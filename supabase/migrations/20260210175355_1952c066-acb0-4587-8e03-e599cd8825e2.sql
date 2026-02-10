
-- Add column to store the moderation copy URL for rejected images
ALTER TABLE public.image_moderation_logs ADD COLUMN IF NOT EXISTS moderation_image_url TEXT;
