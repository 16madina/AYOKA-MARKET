-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Add followers_count to profiles
ALTER TABLE public.profiles
ADD COLUMN followers_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers
CREATE POLICY "Users can follow others"
ON public.followers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.followers
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

CREATE POLICY "Users can view follows"
ON public.followers
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- Function to update followers count
CREATE OR REPLACE FUNCTION public.update_followers_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.followed_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.followed_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update followers count
CREATE TRIGGER update_followers_count_trigger
AFTER INSERT OR DELETE ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.update_followers_count();