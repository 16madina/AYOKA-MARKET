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
    console.log('Received follower webhook:', payload);

    if (payload.type !== 'INSERT' || payload.table !== 'followers') {
      return new Response(JSON.stringify({ success: false, reason: 'Not an INSERT on followers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const follow = payload.record;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer les infos du follower
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', follow.follower_id)
      .single();

    // Récupérer le push token du followed
    const { data: followedProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', follow.followed_id)
      .single();

    const followerName = followerProfile?.full_name || 'Un utilisateur';

    if (followedProfile?.push_token) {
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
              token: followedProfile.push_token,
              notification: {
                title: '👤 Nouvel abonné',
                body: `${followerName} a commencé à vous suivre`,
              },
              data: {
                type: 'follower',
                follower_id: follow.follower_id,
                follow_id: follow.id,
                route: `/seller/${follow.follower_id}`,
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
      console.log('Followed user has no push token');
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
