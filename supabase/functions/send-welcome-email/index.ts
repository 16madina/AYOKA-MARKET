import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BAZARAM <no-reply@bazarammarket.com>",
        to: [email],
        subject: "Bienvenue sur BAZARAM ! 🎉",
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
              .features-box {
                background: #fff8f0;
                border: 2px solid #704214;
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
              }
              .features-title {
                color: #704214;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
              }
              .feature {
                display: flex;
                align-items: flex-start;
                margin: 15px 0;
              }
              .feature-icon {
                font-size: 24px;
                margin-right: 15px;
                min-width: 30px;
              }
              .feature-text {
                color: #333;
                font-size: 15px;
                line-height: 1.6;
              }
              .button-container {
                text-align: center;
                margin: 35px 0;
              }
              .cta-button {
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
              .tips-box {
                background: #f9f9f9;
                border-left: 4px solid #704214;
                border-radius: 5px;
                padding: 20px;
                margin: 25px 0;
              }
              .tips-title {
                color: #704214;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .tips-text {
                color: #666;
                font-size: 14px;
                line-height: 1.8;
              }
              .footer {
                background: #f9f9f9;
                padding: 30px;
                text-align: center;
                border-top: 2px solid #704214;
              }
              .footer-text {
                color: #666;
                font-size: 13px;
                line-height: 1.6;
                margin-bottom: 15px;
              }
              .footer-links {
                color: #666;
                font-size: 12px;
                margin-bottom: 10px;
              }
              .footer-link {
                color: #704214;
                text-decoration: none;
                font-weight: bold;
                margin: 0 5px;
              }
              .copyright {
                color: #999;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo-container">
                  <img src="https://bazarammarket.com/bazaram-logo-email.png" alt="BAZARAM" class="logo" />
                </div>
              </div>
              
              <div class="content">
                <h1 class="welcome-title">Félicitations ${userName} ! 🎉</h1>
                
                <p class="welcome-text">
                  Votre compte <strong style="color: #704214;">BAZARAM</strong> est maintenant <strong>vérifié et actif</strong> !
                </p>

                <div class="features-box">
                  <h2 class="features-title">Que pouvez-vous faire maintenant ?</h2>
                  
                  <div class="feature">
                    <div class="feature-icon">📦</div>
                    <div class="feature-text">
                      <strong>Publier vos annonces</strong> - Vendez ou donnez vos articles en quelques clics
                    </div>
                  </div>

                  <div class="feature">
                    <div class="feature-icon">💬</div>
                    <div class="feature-text">
                      <strong>Discuter avec les vendeurs</strong> - Négociez et organisez vos transactions
                    </div>
                  </div>

                  <div class="feature">
                    <div class="feature-icon">⭐</div>
                    <div class="feature-text">
                      <strong>Sauvegarder vos favoris</strong> - Ne perdez plus de vue les articles qui vous intéressent
                    </div>
                  </div>

                  <div class="feature">
                    <div class="feature-icon">🌍</div>
                    <div class="feature-text">
                      <strong>Contribuer à l'économie circulaire</strong> - Donnez une seconde vie aux objets
                    </div>
                  </div>
                </div>

                <div class="button-container">
                  <a href="https://bazarammarket.com" class="cta-button">
                    Commencer à explorer
                  </a>
                </div>

                <div class="tips-box">
                  <h3 class="tips-title">💡 Conseils pour bien démarrer</h3>
                  <div class="tips-text">
                    • Complétez votre profil pour inspirer confiance<br>
                    • Prenez des photos de qualité pour vos annonces<br>
                    • Soyez réactif dans vos conversations<br>
                    • Utilisez la géolocalisation pour toucher les acheteurs proches
                  </div>
                </div>

                <p class="welcome-text">
                  Besoin d'aide ? Notre équipe est là pour vous accompagner.
                </p>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  <strong style="color: #704214;">BAZARAM</strong><br>
                  Votre marketplace pour l'économie circulaire<br>
                  Ensemble pour un avenir durable 🌍
                </p>
                <p class="footer-links">
                  <a href="https://bazarammarket.com" class="footer-link">Site web</a> • 
                  <a href="https://bazarammarket.com/help" class="footer-link">Aide</a> • 
                  <a href="https://bazarammarket.com/settings/terms" class="footer-link">CGU</a>
                </p>
                <p class="copyright">
                  © ${new Date().getFullYear()} BAZARAM. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
        }),
      });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      console.error("Error sending welcome email:", error);
      throw error;
    }

    const data = await emailResponse.json();
    console.log("Welcome email sent successfully:", data);

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
    console.error("Error in send-welcome-email function:", error);
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
