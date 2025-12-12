import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  schema: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    location: string;
  };
  old_record: null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Received listing webhook:', payload.type, payload.table);

    if (payload.type !== 'INSERT' || payload.table !== 'listings') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a new listing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const listing = payload.record;
    console.log('New listing published:', listing.id, 'by user:', listing.user_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('full_name, first_name')
      .eq('id', listing.user_id)
      .single();

    if (sellerError) {
      console.error('Error fetching seller:', sellerError);
      throw new Error('Failed to fetch seller profile');
    }

    const sellerName = seller?.full_name || seller?.first_name || 'Un vendeur';

    // Get all followers of this seller who have push tokens
    const { data: followers, error: followersError } = await supabase
      .from('followers')
      .select(`
        follower_id,
        profiles!followers_follower_id_fkey (
          id,
          push_token
        )
      `)
      .eq('followed_id', listing.user_id);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      throw new Error('Failed to fetch followers');
    }

    console.log(`Found ${followers?.length || 0} followers for seller`);

    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No followers to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firebase service account
    const firebaseServiceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const accessToken = await getFirebaseAccessToken(firebaseServiceAccount);

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseServiceAccount.project_id}/messages:send`;
    
    let successCount = 0;
    let failCount = 0;

    // Send notification to each follower
    for (const follower of followers) {
      const profile = follower.profiles as any;
      if (!profile?.push_token) {
        console.log(`Follower ${follower.follower_id} has no push token`);
        continue;
      }

      // Create system notification in database
      await supabase.rpc('create_system_notification', {
        p_user_id: follower.follower_id,
        p_title: '🆕 Nouvelle annonce',
        p_message: `${sellerName} a publié "${listing.title}"`,
        p_notification_type: 'new_listing',
        p_metadata: {
          listing_id: listing.id,
          seller_id: listing.user_id,
          title: listing.title,
          price: listing.price,
          currency: listing.currency
        }
      });

      // Format price
      const formattedPrice = new Intl.NumberFormat('fr-FR').format(listing.price);

      const message = {
        message: {
          token: profile.push_token,
          notification: {
            title: `🆕 ${sellerName} a publié une annonce`,
            body: `${listing.title} - ${formattedPrice} ${listing.currency || 'FCFA'}`,
          },
          data: {
            type: 'new_listing',
            listing_id: listing.id,
            seller_id: listing.user_id,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      try {
        const fcmResponse = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (fcmResponse.ok) {
          successCount++;
          console.log(`Notification sent to follower ${follower.follower_id}`);
        } else {
          failCount++;
          const errorResult = await fcmResponse.json();
          console.error(`FCM error for follower ${follower.follower_id}:`, errorResult);
        }
      } catch (fcmError) {
        failCount++;
        console.error(`Error sending to follower ${follower.follower_id}:`, fcmError);
      }
    }

    console.log(`Notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${successCount} followers`,
        successCount,
        failCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-new-listing:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await signWithPrivateKey(signatureInput, serviceAccount.private_key);
  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token');
  }

  return tokenData.access_token;
}

async function signWithPrivateKey(data: string, privateKeyPem: string): Promise<string> {
  // Normalize the private key - replace literal \n with actual newlines
  let normalizedKey = privateKeyPem;
  if (privateKeyPem.includes('\\n')) {
    normalizedKey = privateKeyPem.replace(/\\n/g, '\n');
  }
  
  const pemContent = normalizedKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, dataBuffer);

  return base64UrlEncode(signature);
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
