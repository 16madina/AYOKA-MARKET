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
    first_name?: string;
    full_name?: string;
    push_token?: string;
  };
  old_record: null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Received welcome notification webhook:', JSON.stringify(payload, null, 2));

    // Only process INSERT events on profiles table
    if (payload.type !== 'INSERT' || payload.table !== 'profiles') {
      console.log('Ignoring non-INSERT event or wrong table');
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { id: userId, first_name, full_name, push_token } = payload.record;
    const userName = first_name || full_name?.split(' ')[0] || 'ami(e)';

    console.log(`Processing welcome notification for user: ${userId}, name: ${userName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Wait a bit for the push token to be registered (new users might not have it immediately)
    // We'll check again after a short delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch the latest profile to get the push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, first_name, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.push_token) {
      console.log('User has no push token yet, skipping welcome notification');
      
      // Create a system notification instead (will show in-app)
      await supabase.from('system_notifications').insert({
        user_id: userId,
        title: 'Bienvenue sur Ayoka Market! 🎉',
        message: `Merci de nous rejoindre ${userName}! Publiez votre première annonce et commencez à vendre dès maintenant.`,
        notification_type: 'welcome',
        metadata: { route: '/publish' }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'System notification created (no push token)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the display name
    const displayName = profile.first_name || profile.full_name?.split(' ')[0] || 'ami(e)';

    // Send push notification via the send-push-notification function
    const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title: 'Bienvenue sur Ayoka Market! 🎉',
        body: `Merci de nous rejoindre ${displayName}! Publiez votre première annonce et commencez à vendre dès maintenant.`,
        data: {
          type: 'welcome',
          route: '/publish'
        }
      }
    });

    if (pushError) {
      console.error('Error sending push notification:', pushError);
      return new Response(
        JSON.stringify({ success: false, error: pushError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also create a system notification for in-app display
    await supabase.from('system_notifications').insert({
      user_id: userId,
      title: 'Bienvenue sur Ayoka Market! 🎉',
      message: `Merci de nous rejoindre ${displayName}! Publiez votre première annonce et commencez à vendre dès maintenant.`,
      notification_type: 'welcome',
      metadata: { route: '/publish' }
    });

    console.log('Welcome notification sent successfully to:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-welcome:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
