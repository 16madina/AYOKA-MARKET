import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
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
    console.log('Received pending review webhook:', JSON.stringify(payload));

    const listing = payload.record;

    // Only process if moderation_status is pending_review
    if (listing.moderation_status !== 'pending_review') {
      return new Response(JSON.stringify({ success: false, reason: 'Not pending_review' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError || !adminRoles?.length) {
      console.log('No admins found or error:', rolesError);
      return new Response(JSON.stringify({ success: false, reason: 'No admins found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get listing owner name
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', listing.user_id)
      .single();

    const ownerName = ownerProfile?.full_name || 'Un utilisateur';
    const listingTitle = listing.title || 'Sans titre';

    // Get admin push tokens
    const adminIds = adminRoles.map((r: any) => r.user_id);
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', adminIds);

    // Send push notification to each admin with a token
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    let accessToken: string | null = null;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      accessToken = await getFirebaseAccessToken(serviceAccount);

      for (const admin of (adminProfiles || [])) {
        if (admin.push_token) {
          try {
            await fetch(
              `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: {
                    token: admin.push_token,
                    notification: {
                      title: '🔍 Annonce en attente de révision',
                      body: `${ownerName} a publié "${listingTitle}" - En attente de modération`,
                    },
                    data: {
                      type: 'moderation',
                      listing_id: listing.id,
                      route: '/admin',
                    },
                  },
                }),
              }
            );
            console.log('Push sent to admin:', admin.id);
          } catch (e) {
            console.error('Push error for admin:', admin.id, e);
          }
        }
      }
    }

    // Create system notification for all admins (in-app bell)
    const notifications = adminIds.map((adminId: string) => ({
      user_id: adminId,
      title: '🔍 Annonce en attente de révision',
      message: `${ownerName} a publié "${listingTitle}" - En attente de modération`,
      notification_type: 'moderation',
      metadata: {
        listing_id: listing.id,
        user_id: listing.user_id,
        route: '/admin',
      },
    }));

    const { error: notifError } = await supabase
      .from('system_notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating admin notifications:', notifError);
    } else {
      console.log(`System notifications created for ${adminIds.length} admin(s)`);
    }

    return new Response(JSON.stringify({ success: true, admins_notified: adminIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

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
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
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
