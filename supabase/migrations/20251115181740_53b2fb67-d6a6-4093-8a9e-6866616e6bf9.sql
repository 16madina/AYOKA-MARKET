-- Add currency column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'FCFA';

-- Update existing listings to have currency based on their location
UPDATE public.listings
SET currency = CASE
  WHEN location ILIKE '%Guinée%' THEN 'GNF'
  WHEN location ILIKE '%Ghana%' THEN 'GHS'
  WHEN location ILIKE '%Nigeria%' THEN 'NGN'
  WHEN location ILIKE '%Gambie%' THEN 'GMD'
  WHEN location ILIKE '%Liberia%' THEN 'LRD'
  WHEN location ILIKE '%Sierra Leone%' THEN 'SLL'
  WHEN location ILIKE '%Cap-Vert%' THEN 'CVE'
  WHEN location ILIKE '%Mauritanie%' THEN 'MRU'
  ELSE 'FCFA'
END
WHERE currency = 'FCFA';