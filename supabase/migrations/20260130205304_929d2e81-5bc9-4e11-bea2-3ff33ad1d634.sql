-- Add RLS policy for admins to delete any listing
CREATE POLICY "Admins can delete all listings"
ON public.listings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));