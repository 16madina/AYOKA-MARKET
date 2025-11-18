-- Modifier les triggers pour appeler les edge functions via pg_net
-- D'abord, activer l'extension pg_net si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fonction pour notifier les nouveaux messages via webhook
CREATE OR REPLACE FUNCTION notify_new_message_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url text;
BEGIN
  -- URL de l'edge function
  webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-new-message';
  
  -- Appeler l'edge function via pg_net de manière asynchrone
  PERFORM extensions.pg_net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'record', row_to_json(NEW),
      'schema', 'public',
      'old_record', null
    )
  );

  RETURN NEW;
END;
$$;

-- Fonction pour notifier les nouveaux avis via webhook
CREATE OR REPLACE FUNCTION notify_new_review_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url text;
BEGIN
  webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-new-review';
  
  PERFORM extensions.pg_net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'reviews',
      'record', row_to_json(NEW),
      'schema', 'public',
      'old_record', null
    )
  );

  RETURN NEW;
END;
$$;

-- Fonction pour notifier les nouveaux abonnés via webhook
CREATE OR REPLACE FUNCTION notify_new_follower_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url text;
BEGIN
  webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-new-follower';
  
  PERFORM extensions.pg_net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'followers',
      'record', row_to_json(NEW),
      'schema', 'public',
      'old_record', null
    )
  );

  RETURN NEW;
END;
$$;

-- Créer les triggers pour les webhooks (après les triggers de notifications système)
DROP TRIGGER IF EXISTS trigger_notify_new_message_webhook ON messages;
CREATE TRIGGER trigger_notify_new_message_webhook
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message_webhook();

DROP TRIGGER IF EXISTS trigger_notify_new_review_webhook ON reviews;
CREATE TRIGGER trigger_notify_new_review_webhook
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review_webhook();

DROP TRIGGER IF EXISTS trigger_notify_new_follower_webhook ON followers;
CREATE TRIGGER trigger_notify_new_follower_webhook
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower_webhook();