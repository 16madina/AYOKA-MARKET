-- Add latitude and longitude columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geographic queries performance
CREATE INDEX IF NOT EXISTS idx_listings_coordinates 
ON public.listings(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.latitude IS 'GPS latitude coordinate for map display';
COMMENT ON COLUMN public.listings.longitude IS 'GPS longitude coordinate for map display';