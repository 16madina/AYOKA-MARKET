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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: VerificationEmailRequest = await req.json();
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate email verification link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
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
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .logo {
                color: white;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
              }
              .market {
                color: white;
                font-size: 24px;
                font-family: 'Pacifico', cursive;
                margin-top: 5px;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border: 1px solid #e0e0e0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                background: #f9f9f9;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e0e0e0;
                border-top: none;
              }
              .verify-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 14px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">DJASSA</div>
              <div class="market">Market</div>
            </div>
            
            <div class="content">
              <h1>Bienvenue ${userName ? userName : ""} ! 🎉</h1>
              <p>Merci de vous être inscrit sur <strong>DJASSA Market</strong>, votre marketplace de confiance en Afrique de l'Ouest.</p>
              
              <p>Pour activer votre compte et obtenir votre <span class="verify-badge">✓ Badge Vérifié</span>, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  Vérifier mon email
                </a>
              </div>
              
              <p style="margin-top: 30px;">Ou copiez et collez ce lien dans votre navigateur :</p>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                ${confirmationUrl}
              </p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <strong>Pourquoi vérifier votre email ?</strong><br>
                • Obtenez votre badge vérifié<br>
                • Accédez à toutes les fonctionnalités<br>
                • Gagnez la confiance des acheteurs et vendeurs<br>
                • Sécurisez votre compte
              </p>
            </div>
            
            <div class="footer">
              <p>Si vous n'avez pas créé de compte sur DJASSA Market, vous pouvez ignorer cet email.</p>
              <p style="margin-top: 10px;">
                © ${new Date().getFullYear()} DJASSA Market. Tous droits réservés.
              </p>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const data = await emailResponse.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
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
