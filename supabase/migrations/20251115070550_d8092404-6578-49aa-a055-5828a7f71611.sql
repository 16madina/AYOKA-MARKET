-- Drop existing foreign key constraints on reviews table
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey,
DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;

-- Add new foreign key constraints pointing to profiles table
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_reviewee_id_fkey 
FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;