/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1  
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string (e.g., "5 km", "< 1 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return "< 1 km";
  }
  if (distanceKm >= 1000) {
    return `${Math.round(distanceKm / 100) / 10} km`;
  }
  return `${distanceKm} km`;
}

// Cache for geocoded locations to avoid excessive API calls
const geocodeCache: { [key: string]: { lat: number; lng: number } | null } = {};

/**
 * Geocode a location string to coordinates using Nominatim API
 * @param location - Location string (e.g., "Abidjan, Côte d'Ivoire")
 * @returns Coordinates or null if not found
 */
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (location in geocodeCache) {
    return geocodeCache[location];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        location
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'DjassaMarket/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      geocodeCache[location] = coords;
      return coords;
    }

    geocodeCache[location] = null;
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    geocodeCache[location] = null;
    return null;
  }
}

/**
 * Get user's current coordinates using browser geolocation
 * @returns User coordinates or null
 */
export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.log('Geolocation error:', error);
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}
