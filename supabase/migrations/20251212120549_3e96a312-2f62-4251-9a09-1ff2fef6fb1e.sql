-- Drop existing trigger functions that rely on vault
DROP FUNCTION IF EXISTS public.trigger_notify_new_message() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notify_new_favorite() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notify_new_follower() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notify_new_review() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notify_price_offer() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notify_new_listing() CASCADE;

-- Create new trigger functions using pg_net extension with hardcoded values
-- Note: pg_net is the recommended way to make HTTP calls from PostgreSQL

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Notify new message trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', NULL
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send message notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for messages
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_message();

-- Notify new favorite trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_new_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-favorite',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'favorites',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', NULL
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send favorite notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for favorites
CREATE TRIGGER on_new_favorite_notify
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_favorite();

-- Notify new follower trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-follower',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'followers',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', NULL
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send follower notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for followers
CREATE TRIGGER on_new_follower_notify
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_follower();

-- Notify new review trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-review',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'reviews',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', NULL
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send review notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for reviews
CREATE TRIGGER on_new_review_notify
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_review();

-- Notify price offer trigger (INSERT and UPDATE)
CREATE OR REPLACE FUNCTION public.trigger_notify_price_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
  ELSE
    event_type := 'UPDATE';
  END IF;
  
  PERFORM extensions.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-price-offer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
    ),
    body := jsonb_build_object(
      'type', event_type,
      'table', 'price_offers',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send price offer notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for price_offers
CREATE TRIGGER on_price_offer_notify
  AFTER INSERT OR UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_price_offer();

-- Notify new listing trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only notify for active listings with approved moderation
  IF NEW.status = 'active' AND (NEW.moderation_status IS NULL OR NEW.moderation_status = 'approved') THEN
    PERFORM extensions.http_post(
      url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-listing',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI2MjYsImV4cCI6MjA3ODcwODYyNn0.39AH04J0GuwBYqxUOPwIjXQFcMDwseXayUhXB5uuTzM'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'listings',
        'schema', 'public',
        'record', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'title', NEW.title,
          'price', NEW.price,
          'currency', NEW.currency,
          'images', NEW.images,
          'location', NEW.location
        ),
        'old_record', NULL
      )::text
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send new listing notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for listings
CREATE TRIGGER on_new_listing_notify
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_listing();