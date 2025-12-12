import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  schema: string;
  old_record: any | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Received price_offers webhook:', payload);

    if (payload.table !== 'price_offers') {
      return new Response(JSON.stringify({ success: false, reason: 'Not price_offers table' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const offer = payload.record;
    const oldOffer = payload.old_record;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    let recipientId: string;
    let title: string;
    let body: string;
    let notificationType: string;

    // Récupérer l'annonce
    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', offer.listing_id)
      .single();

    const listingTitle = listing?.title || 'annonce';

    // Récupérer le nom de l'expéditeur
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', offer.sender_id)
      .single();

    const senderName = senderProfile?.full_name || 'Un utilisateur';

    if (payload.type === 'INSERT') {
      // Nouvelle offre - notifier le vendeur
      recipientId = offer.receiver_id;
      title = '💰 Nouvelle offre de prix';
      body = `${senderName} vous propose ${offer.amount} pour "${listingTitle}"`;
      notificationType = 'price_offer';
    } else if (payload.type === 'UPDATE' && oldOffer?.status === 'pending') {
      // Offre mise à jour (acceptée ou refusée) - notifier l'acheteur
      recipientId = offer.sender_id;
      
      if (offer.status === 'accepted') {
        title = '✅ Offre acceptée';
        body = `Votre offre de ${offer.amount} pour "${listingTitle}" a été acceptée!`;
        notificationType = 'offer_accepted';
      } else if (offer.status === 'rejected') {
        title = '❌ Offre refusée';
        body = `Votre offre de ${offer.amount} pour "${listingTitle}" a été refusée`;
        notificationType = 'offer_rejected';
      } else if (offer.status === 'counter') {
        title = '🔄 Contre-offre reçue';
        body = `Une contre-offre a été faite pour "${listingTitle}"`;
        notificationType = 'counter_offer';
      } else {
        console.log('Unknown status change, skipping notification');
        return new Response(JSON.stringify({ success: false, reason: 'Unknown status' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } else {
      console.log('Not a relevant event, skipping');
      return new Response(JSON.stringify({ success: false, reason: 'Not relevant event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Récupérer le push token du destinataire
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', recipientId)
      .single();

    if (recipientProfile?.push_token) {
      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
      if (!serviceAccountJson) {
        console.error('FIREBASE_SERVICE_ACCOUNT not configured');
        return new Response(JSON.stringify({ success: false, error: 'Firebase not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      const accessToken = await getFirebaseAccessToken(serviceAccount);

      const fcmResponse = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: recipientProfile.push_token,
              notification: { title, body },
              data: {
                type: notificationType,
                conversation_id: offer.conversation_id,
                listing_id: offer.listing_id,
                offer_id: offer.id,
                route: `/messages?conversation=${offer.conversation_id}`,
              },
            },
          }),
        }
      );

      const fcmResult = await fcmResponse.json();
      console.log('FCM Response:', fcmResult);

      if (!fcmResponse.ok) {
        console.error('FCM Error:', JSON.stringify(fcmResult));
      }
    } else {
      console.log('Recipient has no push token');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper functions for Firebase authentication
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signWithPrivateKey(signatureInput, serviceAccount.private_key);
  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function signWithPrivateKey(data: string, privateKeyPem: string): Promise<string> {
  // Normalize the private key - replace literal \n with actual newlines
  let normalizedKey = privateKeyPem;
  if (privateKeyPem.includes('\\n')) {
    normalizedKey = privateKeyPem.replace(/\\n/g, '\n');
  }
  
  const pemContents = normalizedKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(data));
  return base64UrlEncode(signature);
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
