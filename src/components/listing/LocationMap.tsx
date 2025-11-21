import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
  location: string;
}

const LocationMap = ({ location }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const mapboxToken = 'pk.eyJ1IjoibWFkaW5hZGlhbGxvIiwiYSI6ImNtaTk0eGZ0dDBqb2cya3B6MnFhMHJmODAifQ.zBKszfc8fyp-K-o6lJpymg';

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log('Geolocation not available:', error);
        }
      );
    }
  }, []);

  // Calculate distance
  const calculateDistance = (
    coord1: [number, number],
    coord2: [number, number]
  ): number => {
    const R = 6371; // Earth's radius in km
    const lat1 = (coord1[1] * Math.PI) / 180;
    const lat2 = (coord2[1] * Math.PI) / 180;
    const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
    const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      console.error('Mapbox token is not configured');
      return;
    }

    // Geocode location to coordinates (simple approach for West African cities)
    const getCoordinates = (loc: string): [number, number] => {
      const locationMap: Record<string, [number, number]> = {
        'abidjan': [-4.0, 5.3],
        'dakar': [-17.4, 14.7],
        'bamako': [-8.0, 12.6],
        'conakry': [-13.7, 9.5],
        'ouagadougou': [-1.5, 12.4],
        'lomé': [1.2, 6.1],
        'cotonou': [2.4, 6.4],
        'niamey': [2.1, 13.5],
      };

      const normalizedLoc = loc.toLowerCase();
      for (const [city, coords] of Object.entries(locationMap)) {
        if (normalizedLoc.includes(city)) {
          return coords;
        }
      }
      // Default to Abidjan
      return [-4.0, 5.3];
    };

    const coordinates = getCoordinates(location);

    // Calculate distance if user location is available
    if (userLocation) {
      const dist = calculateDistance(userLocation, coordinates);
      setDistance(dist);
    }

    // Initialize map with token
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 12,
    });

    // Add marker
    new mapboxgl.Marker({ color: '#6366f1' })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [location, userLocation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localisation
          </div>
          {distance !== null && (
            <div className="flex items-center gap-1 text-sm font-normal text-primary">
              <Navigation className="h-4 w-4" />
              <span>À {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} de vous</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div ref={mapContainer} className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
};

export default LocationMap;
