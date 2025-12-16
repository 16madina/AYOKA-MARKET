import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    console.log("Processing password reset for:", email);

    // Determine the redirect URL (prefer configured APP_URL to avoid redirecting to the editor domain)
    let appUrl = Deno.env.get("APP_URL");

    // If APP_URL is not set, infer from redirectUrl or request origin/referer
    if (!appUrl) {
      if (redirectUrl) {
        try {
          const u = new URL(redirectUrl);
          appUrl = `${u.protocol}//${u.host}`;
        } catch {
          // ignore
        }
      }

      if (!appUrl) {
        const origin = req.headers.get("origin") || req.headers.get("referer");
        if (origin) {
          try {
            const u = new URL(origin);
            appUrl = `${u.protocol}//${u.host}`;
          } catch {
            // ignore
          }
        }
      }
    }

    // Final fallback
    if (!appUrl) appUrl = "https://ayokamarket.com";

    // Ensure protocol
    if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
      appUrl = `https://${appUrl}`;
    }

    const finalRedirectUrl = `${appUrl.replace(/\/$/, "")}/reset-password`;

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate password reset link using Supabase Admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetUrl = data.properties?.action_link;
    
    if (!resetUrl) {
      console.error("No action link returned");
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Generated reset URL for email");

    // Send custom styled email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AYOKA MARKET <no-reply@ayokamarket.com>",
        to: [email],
        subject: "Réinitialisation de votre mot de passe - AYOKA MARKET",
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
              .content {
                padding: 40px 30px;
                background: white;
              }
              .title {
                color: #704214;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
              }
              .text {
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
              .reset-button {
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
              .warning-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                font-size: 14px;
                color: #856404;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo-container">
                  <img src="https://ayokamarket.com/ayoka-logo-email.png" alt="AYOKA MARKET" style="max-width: 180px; height: auto; display: block;">
                </div>
              </div>
              
              <div class="content">
                <h1 class="title">🔐 Réinitialisation du mot de passe</h1>
                
                <p class="text">
                  Vous avez demandé la réinitialisation de votre mot de passe sur <strong style="color: #704214;">AYOKA MARKET</strong>.
                </p>
                
                <p class="text">
                  Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                </p>
                
                <div class="button-container">
                  <a href="${resetUrl}" class="reset-button">
                    🔑 Réinitialiser mon mot de passe
                  </a>
                </div>
                
                <div class="warning-box">
                  ⚠️ Ce lien est valable pendant <strong>1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.
                </div>
                
                <div class="divider"></div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 10px;">
                  Ou copiez et collez ce lien dans votre navigateur :
                </p>
                <div class="link-text">
                  ${resetUrl}
                </div>
                
                <div class="divider"></div>
                
                <p style="color: #999; font-size: 13px; text-align: center; font-style: italic;">
                  Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe restera inchangé.
                </p>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  <strong style="color: #704214;">AYOKA MARKET</strong><br>
                  Votre marketplace pour l'économie circulaire<br>
                  Ensemble pour un avenir durable 🌍
                </p>
                <p class="footer-text" style="margin-top: 15px;">
                  <a href="https://ayokamarket.com" class="footer-link">ayokamarket.com</a>
                </p>
                <p class="footer-text" style="margin-top: 10px; font-size: 11px;">
                  © ${new Date().getFullYear()} AYOKA MARKET. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
        </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailData);
      
      if (emailResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "rate_limit",
            message: "Trop de demandes. Veuillez patienter quelques secondes avant de réessayer." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(emailData.error || "Failed to send email");
    }

    console.log("Password reset email sent successfully via Resend");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    // Always return success to not reveal if email exists
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
