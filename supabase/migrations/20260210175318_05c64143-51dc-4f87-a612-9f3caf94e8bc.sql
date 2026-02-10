
-- Create a storage bucket for rejected moderation images (admin-only access)
INSERT INTO storage.buckets (id, name, public) VALUES ('moderation-images', 'moderation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to view moderation images
CREATE POLICY "Admins can view moderation images"
ON storage.objects FOR SELECT
USING (bucket_id = 'moderation-images');

-- Allow service role to upload (edge functions use service role)
CREATE POLICY "Service role can upload moderation images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'moderation-images');
