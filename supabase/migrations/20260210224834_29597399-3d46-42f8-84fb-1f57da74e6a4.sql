
CREATE OR REPLACE FUNCTION public.trigger_notify_admin_pending_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when moderation_status becomes 'pending_review'
  IF NEW.moderation_status = 'pending_review' AND 
     (OLD IS NULL OR OLD.moderation_status IS DISTINCT FROM 'pending_review') THEN
    PERFORM net.http_post(
      url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-admin-pending-review',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', 'listings',
        'schema', 'public',
        'record', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'title', NEW.title,
          'price', NEW.price,
          'currency', NEW.currency,
          'images', NEW.images,
          'location', NEW.location,
          'moderation_status', NEW.moderation_status
        ),
        'old_record', NULL
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send admin pending review notification: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger on INSERT and UPDATE
CREATE TRIGGER on_listing_pending_review
  AFTER INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_admin_pending_review();
