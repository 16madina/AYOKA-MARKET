-- Add notification_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "messages": true,
  "offers": true,
  "favorites": true,
  "newListings": false,
  "priceDrops": true,
  "followers": true,
  "reviews": true,
  "marketing": false,
  "push": true,
  "email": true,
  "soundEnabled": true,
  "soundVolume": 70,
  "vibrationEnabled": true,
  "vibrationIntensity": "medium",
  "quietHoursEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00",
  "showPreview": true,
  "showSenderName": true,
  "groupNotifications": true
}'::jsonb;