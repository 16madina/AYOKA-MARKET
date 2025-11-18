-- Modifier les fonctions webhook pour utiliser l'URL en dur
CREATE OR REPLACE FUNCTION notify_new_message_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Appeler l'edge function via pg_net de manière asynchrone
  PERFORM extensions.pg_net.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzMjYyNiwiZXhwIjoyMDc4NzA4NjI2fQ.S5vcQqTVMgZ2yPEcdyOZ5aH09KnE0K6qKxLxkY3gLJI'
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

CREATE OR REPLACE FUNCTION notify_new_review_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM extensions.pg_net.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-review',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzMjYyNiwiZXhwIjoyMDc4NzA4NjI2fQ.S5vcQqTVMgZ2yPEcdyOZ5aH09KnE0K6qKxLxkY3gLJI'
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

CREATE OR REPLACE FUNCTION notify_new_follower_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM extensions.pg_net.http_post(
    url := 'https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-follower',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjenp5ZWx1Y25mdmtpY3dkYmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzMjYyNiwiZXhwIjoyMDc4NzA4NjI2fQ.S5vcQqTVMgZ2yPEcdyOZ5aH09KnE0K6qKxLxkY3gLJI'
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