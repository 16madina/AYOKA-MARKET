-- Create ad_banners table for managing advertisement banners
CREATE TABLE public.ad_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active banners"
ON public.ad_banners
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can view all banners"
ON public.ad_banners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert banners"
ON public.ad_banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banners"
ON public.ad_banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banners"
ON public.ad_banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ad_banners_updated_at
BEFORE UPDATE ON public.ad_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();