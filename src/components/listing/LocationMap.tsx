import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Car, Loader2 } from 'lucide-react';
import { geocodeLocation } from '@/utils/distanceCalculation';

interface LocationMapProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface TravelInfo {
  distance: number; // in km
  duration: number; // in minutes
}

const LocationMap = ({ location, latitude, longitude }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [isLoadingTravel, setIsLoadingTravel] = useState(false);
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

  // Get listing coordinates - prioritize stored GPS, fallback to geocoding
  useEffect(() => {
    const getCoordinates = async () => {
      // If we have stored GPS coordinates, use them
      if (latitude && longitude) {
        setCoordinates([longitude, latitude]);
        return;
      }

      // Otherwise, geocode the location string
      const geocoded = await geocodeLocation(location);
      if (geocoded) {
        setCoordinates([geocoded.lng, geocoded.lat]);
      } else {
        // Default fallback to Abidjan center
        setCoordinates([-4.0, 5.3]);
      }
    };

    getCoordinates();
  }, [location, latitude, longitude]);

  // Fetch travel info from Mapbox Directions API
  useEffect(() => {
    const fetchTravelInfo = async () => {
      if (!userLocation || !coordinates) return;

      setIsLoadingTravel(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${coordinates[0]},${coordinates[1]}?access_token=${mapboxToken}&overview=false`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setTravelInfo({
            distance: route.distance / 1000, // Convert meters to km
            duration: route.duration / 60, // Convert seconds to minutes
          });
        }
      } catch (error) {
        console.log('Could not fetch travel info:', error);
      } finally {
        setIsLoadingTravel(false);
      }
    };

    fetchTravelInfo();
  }, [userLocation, coordinates]);

  // Initialize map when coordinates are ready
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !coordinates) {
      return;
    }

    // Initialize map with token
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 14,
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
  }, [coordinates]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localisation
          </div>
        </CardTitle>
        {/* Travel info display */}
        {isLoadingTravel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Calcul du trajet...</span>
          </div>
        )}
        {travelInfo && !isLoadingTravel && (
          <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Car className="h-4 w-4" />
              <span>{formatDistance(travelInfo.distance)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{formatDuration(travelInfo.duration)}</span>
            </div>
          </div>
        )}
        {!userLocation && !isLoadingTravel && (
          <p className="text-xs text-muted-foreground mt-2">
            Activez la géolocalisation pour voir la distance
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div ref={mapContainer} className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
};

export default LocationMap;
