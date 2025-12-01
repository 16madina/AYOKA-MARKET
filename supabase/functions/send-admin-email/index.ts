import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    console.log('Sending email to:', email);
    console.log('Subject:', subject);

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AYOKA MARKET Admin <no-reply@ayokamarket.com>',
        to: [email],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 20px;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
                  padding: 30px 20px;
                  text-align: center;
                }
                .header img {
                  height: 50px;
                  margin-bottom: 10px;
                }
                .header h1 {
                  color: #ffffff;
                  margin: 0;
                  font-size: 24px;
                }
                .content {
                  padding: 30px 20px;
                  color: #333333;
                  line-height: 1.6;
                }
                .content p {
                  margin: 0 0 15px 0;
                }
                .footer {
                  background-color: #f8f8f8;
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #666666;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background-color: #8B4513;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 4px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div style="background-color: white; padding: 20px; border-radius: 15px; display: inline-block;">
                    <img src="https://ayokamarket.com/ayoka-logo-email.png" alt="AYOKA MARKET" style="max-width: 200px; height: auto;" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<h2 style=\'color: #704214; margin: 0;\'>AYOKA MARKET</h2>';" />
                  </div>
                  <h1>AYOKA MARKET</h1>
                  <p style="color: #ffffff; margin: 0; font-size: 14px;">Message de l'équipe AYOKA MARKET</p>
                </div>
                <div class="content">
                  ${message.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} AYOKA MARKET. Tous droits réservés.</p>
                  <p>Ce message vous a été envoyé par l'équipe d'administration de AYOKA MARKET.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Error sending email:', data);
      throw new Error(data.error || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
