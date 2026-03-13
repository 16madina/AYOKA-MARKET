

## Problem

All profile-related queries across the app use the same React Query key `["profile", userId]` but fetch different columns. This causes a cache collision:

1. **BottomNav** (always visible) fetches only `avatar_url, first_name, last_name`
2. When you click "Profil", React Query instantly serves this cached data — which has no `email_verified` field
3. The verified badge only appears after a background refetch completes (up to 5 seconds), or after the 30-second BottomNav polling overwrites the cache again

## Solution

Differentiate the React Query keys so each component manages its own cache independently.

### Changes

**1. `src/components/BottomNav.tsx`**
- Change query key from `["profile", user?.id]` to `["profile-nav", user?.id]`

**2. `src/pages/Profile.tsx`**
- Change query key from `["profile", user?.id]` to `["profile-full", user?.id]`
- This ensures Profile always fetches all fields and never gets partial data from the nav cache

**3. `src/pages/Publish.tsx`**
- Change query key to `["profile-publish", user?.id]` since it also fetches specific fields

**4. `src/components/listing/SellerProfile.tsx`**
- Keep as `["profile", userId]` or rename to `["seller-profile", userId]` — this one is for other users so no collision with the current user's profile

This will ensure the Profile page immediately shows the correct `email_verified` status without waiting for a refetch cycle.

