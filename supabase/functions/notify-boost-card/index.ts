import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoostCardPayload {
  user_id: string;
  tier: string;
  duration_days: number;
  referral_count: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record as BoostCardPayload;

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: "No user_id provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's push token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token, full_name, first_name")
      .eq("id", record.user_id)
      .single();

    if (profileError || !profile?.push_token) {
      console.log("No push token found for user:", record.user_id);
      return new Response(
        JSON.stringify({ success: false, message: "No push token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine tier label and emoji
    const tierLabels: Record<string, string> = {
      bronze: "🥉 Bronze",
      silver: "🥈 Argent",
      gold: "🥇 Or",
    };
    const tierLabel = tierLabels[record.tier] || record.tier;

    // Send Firebase push notification
    const firebaseServiceAccount = JSON.parse(
      Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}"
    );

    if (!firebaseServiceAccount.client_email) {
      console.error("Firebase service account not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Firebase not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate Firebase access token
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: firebaseServiceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signatureInput = `${headerB64}.${claimB64}`;

    const privateKey = firebaseServiceAccount.private_key;
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(signatureInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${signatureInput}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Failed to get Firebase access token");
      return new Response(
        JSON.stringify({ success: false, message: "Token error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send FCM notification
    const projectId = firebaseServiceAccount.project_id;
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: profile.push_token,
            notification: {
              title: "🎉 Nouvelle carte boost !",
              body: `Félicitations ! Vous avez débloqué une carte ${tierLabel} de ${record.duration_days} jours grâce à vos parrainages !`,
            },
            data: {
              type: "boost_card",
              tier: record.tier,
              duration_days: String(record.duration_days),
              referral_count: String(record.referral_count),
              click_action: "/referral",
            },
            android: {
              priority: "high",
              notification: {
                channelId: "rewards",
                icon: "ic_stat_notification",
                color: "#F59E0B",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          },
        }),
      }
    );

    const fcmResult = await fcmResponse.json();
    console.log("FCM Response:", fcmResult);

    // Create system notification for in-app display (always, regardless of push success)
    const { error: notifError } = await supabase
      .from("system_notifications")
      .insert({
        user_id: record.user_id,
        title: "🎉 Nouvelle carte boost !",
        message: `Félicitations ! Vous avez débloqué une carte ${tierLabel} de ${record.duration_days} jours grâce à vos parrainages !`,
        notification_type: "boost_card",
        metadata: {
          tier: record.tier,
          duration_days: record.duration_days,
          referral_count: record.referral_count,
          route: "/referral"
        }
      });

    if (notifError) {
      console.error("Error creating system notification:", notifError);
    } else {
      console.log("System notification created for boost card");
    }

    return new Response(
      JSON.stringify({ success: true, fcmResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-boost-card:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
