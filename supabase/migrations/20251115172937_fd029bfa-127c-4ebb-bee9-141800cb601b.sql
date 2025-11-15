-- Add language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en'));