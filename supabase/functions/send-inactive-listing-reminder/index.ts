import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting inactive listing reminder check...");
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Calculate date 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Find listings that haven't been updated in 10 days and are still active
    const { data: inactiveListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        title,
        updated_at,
        user_id,
        images,
        price,
        currency,
        profiles!user_id (
          full_name,
          email
        )
      `)
      .eq('status', 'active')
      .lt('updated_at', tenDaysAgo.toISOString());

    if (listingsError) {
      console.error("Error fetching inactive listings:", listingsError);
      throw listingsError;
    }

    console.log(`Found ${inactiveListings?.length || 0} inactive listings`);

    if (!inactiveListings || inactiveListings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No inactive listings found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Group listings by user
    const listingsByUser = new Map<string, any[]>();
    for (const listing of inactiveListings) {
      const userId = listing.user_id;
      if (!listingsByUser.has(userId)) {
        listingsByUser.set(userId, []);
      }
      listingsByUser.get(userId)!.push(listing);
    }

    // Send reminder emails
    const emailPromises = Array.from(listingsByUser.entries()).map(async ([userId, listings]) => {
      const userProfile = listings[0].profiles;
      const userEmail = userProfile?.email;
      const userName = userProfile?.full_name || userEmail?.split('@')[0] || 'cher membre';

      if (!userEmail) {
        console.log(`No email found for user ${userId}`);
        return;
      }

      // Create in-app notification
      const listingTitles = listings.map(l => l.title).join(', ');
      const notificationMessage = listings.length > 1 
        ? `Vous avez ${listings.length} annonces qui n'ont pas été mises à jour depuis plus de 10 jours : ${listingTitles}. Mettez-les à jour pour augmenter leur visibilité !`
        : `Votre annonce "${listings[0].title}" n'a pas été mise à jour depuis plus de 10 jours. Mettez-la à jour pour augmenter sa visibilité !`;

      const { error: notifError } = await supabaseAdmin
        .from('system_notifications')
        .insert({
          user_id: userId,
          title: '📢 Annonces inactives',
          message: notificationMessage,
          notification_type: 'reminder',
          metadata: {
            listing_ids: listings.map(l => l.id),
            inactive_days: listings.map(l => 
              Math.floor((Date.now() - new Date(l.updated_at).getTime()) / (1000 * 60 * 60 * 24))
            )
          }
        });

      if (notifError) {
        console.error(`Failed to create notification for user ${userId}:`, notifError);
      } else {
        console.log(`In-app notification created for user ${userId}`);
      }

      // Build listings HTML
      const listingsHtml = listings.map(listing => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(listing.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : '';
        
        return `
          <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin: 10px 0;">
            ${firstImage ? `<img src="${firstImage}" alt="${listing.title}" style="width: 100%; max-width: 200px; border-radius: 5px; margin-bottom: 10px;">` : ''}
            <h3 style="color: #704214; margin: 10px 0; font-size: 16px;">${listing.title}</h3>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">${listing.price} ${listing.currency}</p>
            <p style="color: #999; font-size: 12px; font-style: italic;">Dernière mise à jour: il y a ${daysSinceUpdate} jours</p>
            <a href="https://ayokamarket.com/listing/${listing.id}" style="display: inline-block; background: #704214; color: white; padding: 8px 20px; text-decoration: none; border-radius: 5px; font-size: 14px; margin-top: 10px;">
              Mettre à jour l'annonce
            </a>
          </div>
        `;
      }).join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #704214 0%, #8B5A2B 100%); padding: 40px 30px; text-align: center;">
                <div style="background-color: white; padding: 20px; border-radius: 15px; display: inline-block;">
                  <img src="https://ayokamarket.com/ayoka-logo-email.png" alt="AYOKA MARKET" style="max-width: 200px; height: auto;" />
                </div>
              </div>
              
              <div style="padding: 40px 30px; background: white;">
                <h1 style="color: #704214; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                  👋 ${userName}, vos annonces ont besoin d'attention !
                </h1>
                
                <p style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
                  Nous avons remarqué que ${listings.length > 1 ? 'certaines de vos annonces n\'ont' : 'une de vos annonces n\'a'} pas été mise${listings.length > 1 ? 's' : ''} à jour depuis <strong>plus de 10 jours</strong>.
                </p>

                <div style="background: #fff8f0; border-left: 4px solid #704214; padding: 20px; margin: 25px 0; border-radius: 5px;">
                  <h3 style="color: #704214; margin-top: 0; font-size: 18px;">💡 Pourquoi mettre à jour ?</h3>
                  <ul style="color: #666; font-size: 14px; line-height: 1.8;">
                    <li>Les annonces récentes sont <strong>plus visibles</strong></li>
                    <li>Cela montre que vous êtes <strong>actif</strong></li>
                    <li>Vous pouvez <strong>ajuster le prix</strong> si nécessaire</li>
                    <li>Une mise à jour simple peut <strong>relancer l'intérêt</strong></li>
                  </ul>
                </div>

                <h2 style="color: #704214; font-size: 20px; margin: 30px 0 15px; text-align: center;">
                  Vos annonces inactives
                </h2>

                ${listingsHtml}

                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://ayokamarket.com/profile" style="display: inline-block; background: linear-gradient(135deg, #704214 0%, #8B5A2B 100%); color: white; padding: 16px 50px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(112, 66, 20, 0.3);">
                    Voir toutes mes annonces
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                  Une simple mise à jour peut faire la différence ! 🚀
                </p>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; text-align: center; border-top: 2px solid #704214;">
                <p style="color: #666; font-size: 13px; line-height: 1.6; margin-bottom: 15px;">
                  <strong style="color: #704214;">BAZARAM</strong><br>
                  Votre marketplace pour l'économie circulaire
                </p>
                <p style="color: #999; font-size: 11px;">
                  © ${new Date().getFullYear()} BAZARAM. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AYOKA MARKET <no-reply@ayokamarket.com>",
          to: [userEmail],
          subject: `📢 ${listings.length > 1 ? `${listings.length} annonces inactives` : 'Annonce inactive'} - Mettez à jour pour plus de visibilité`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const error = await emailResponse.json();
        console.error(`Failed to send email to ${userEmail}:`, error);
        throw error;
      }

      console.log(`Reminder email sent to ${userEmail} for ${listings.length} listing(s)`);
    });

    await Promise.all(emailPromises);

    console.log("All reminder emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${listingsByUser.size} reminder emails for ${inactiveListings.length} inactive listings` 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inactive-listing-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
