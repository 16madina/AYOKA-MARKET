-- Mettre à jour les profils existants avec les données de raw_user_meta_data
UPDATE public.profiles p
SET 
  first_name = COALESCE(p.first_name, (
    SELECT u.raw_user_meta_data->>'first_name' 
    FROM auth.users u 
    WHERE u.id = p.id
  )),
  last_name = COALESCE(p.last_name, (
    SELECT u.raw_user_meta_data->>'last_name' 
    FROM auth.users u 
    WHERE u.id = p.id
  )),
  phone = COALESCE(p.phone, (
    SELECT u.raw_user_meta_data->>'phone' 
    FROM auth.users u 
    WHERE u.id = p.id
  )),
  city = COALESCE(p.city, (
    SELECT u.raw_user_meta_data->>'city' 
    FROM auth.users u 
    WHERE u.id = p.id
  )),
  country = COALESCE(p.country, (
    SELECT u.raw_user_meta_data->>'country' 
    FROM auth.users u 
    WHERE u.id = p.id
  )),
  avatar_url = COALESCE(p.avatar_url, (
    SELECT u.raw_user_meta_data->>'avatar_url' 
    FROM auth.users u 
    WHERE u.id = p.id
  ))
WHERE 
  p.first_name IS NULL 
  OR p.last_name IS NULL 
  OR p.phone IS NULL 
  OR p.city IS NULL 
  OR p.country IS NULL;

-- Mettre à jour le champ location (ville + pays)
UPDATE public.profiles
SET location = CONCAT(city, ', ', country)
WHERE city IS NOT NULL 
  AND country IS NOT NULL 
  AND (location IS NULL OR location = '');