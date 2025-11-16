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

interface VerificationEmailRequest {
  email: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: VerificationEmailRequest = await req.json();
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const productionDomain = 'https://djassamarket.com';
    const redirectUrl = `${productionDomain}/email-verified`;

    console.log("Redirect URL:", redirectUrl);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error("Error generating verification link:", linkError);
      throw linkError;
    }

    const confirmationUrl = linkData.properties?.action_link;

    console.log("Sending verification email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DJASSA Market <no-reply@djassamarket.com>",
        to: [email],
        subject: "Vérifiez votre adresse email - DJASSA Market",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
              }
              .header {
                background: linear-gradient(135deg, #704214 0%, #8B5A2B 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .logo-container {
                background-color: white;
                padding: 20px;
                border-radius: 15px;
                display: inline-block;
                margin-bottom: 10px;
              }
              .logo {
                max-width: 200px;
                height: auto;
              }
              .content {
                padding: 40px 30px;
                background: white;
              }
              .welcome-title {
                color: #704214;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
              }
              .welcome-text {
                color: #555;
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 20px;
                text-align: center;
              }
              .button-container {
                text-align: center;
                margin: 35px 0;
              }
              .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #704214 0%, #8B5A2B 100%);
                color: white;
                padding: 16px 50px;
                text-decoration: none;
                border-radius: 10px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(112, 66, 20, 0.3);
              }
              .verify-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
              }
              .link-text {
                color: #666;
                font-size: 14px;
                word-break: break-all;
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                margin-top: 20px;
              }
              .footer {
                background: #f9f9f9;
                padding: 30px;
                text-align: center;
                border-top: 2px solid #704214;
              }
              .footer-text {
                color: #888;
                font-size: 13px;
                line-height: 1.6;
              }
              .footer-link {
                color: #704214;
                text-decoration: none;
                font-weight: bold;
              }
              .divider {
                height: 1px;
                background: linear-gradient(to right, transparent, #e0e0e0, transparent);
                margin: 25px 0;
              }
              .info-box {
                background: #fff8f0;
                border-left: 4px solid #704214;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo-container">
                  <img src="https://djassamarket.com/djassa-logo-email.png" alt="DJASSA Market" class="logo" />
                </div>
              </div>
              
              <div class="content">
                <h1 class="welcome-title">Bienvenue ${userName || ""}! 🎉</h1>
                
                <p class="welcome-text">
                  Merci de vous être inscrit sur <strong style="color: #704214;">DJASSA Market</strong>.
                </p>
                
                <p class="welcome-text">
                  Redonnez une deuxième vie à vos articles, faites des économies sur les articles que vous n'utilisez plus 
                  ou offrez-les à quelqu'un dans le besoin.
                </p>
                
                <div class="button-container">
                  <a href="${confirmationUrl}" class="verify-button">
                    ✓ Vérifier mon adresse email
                  </a>
                </div>
                
                <div class="divider"></div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 10px;">
                  Ou copiez et collez ce lien dans votre navigateur :
                </p>
                <div class="link-text">
                  ${confirmationUrl}
                </div>
                
                <div class="divider"></div>
                
                <p style="color: #999; font-size: 13px; text-align: center; font-style: italic;">
                  Si vous n'avez pas créé de compte sur DJASSA Market, vous pouvez ignorer cet email en toute sécurité.
                </p>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  <strong style="color: #704214;">DJASSA Market</strong><br>
                  Votre marketplace pour l'économie circulaire<br>
                  Ensemble pour un avenir durable 🌍
                </p>
                <p class="footer-text" style="margin-top: 15px;">
                  <a href="https://djassamarket.com" class="footer-link">djassamarket.com</a>
                </p>
                <p class="footer-text" style="margin-top: 10px; font-size: 11px;">
                  © ${new Date().getFullYear()} DJASSA Market. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
        </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", data);
      throw new Error(data.error || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
