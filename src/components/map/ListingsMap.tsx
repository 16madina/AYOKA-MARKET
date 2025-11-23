import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Navigation, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  location: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  categories?: {
    name: string;
  };
}

interface ListingsMapProps {
  listings: Listing[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

export const ListingsMap = ({ 
  listings, 
  centerLat = 5.3600, // Abidjan par défaut
  centerLng = -4.0083,
  zoom = 11
}: ListingsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: zoom,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!map.current) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Coordonnées approximatives pour les villes d'Abidjan
    const locationCoords: { [key: string]: [number, number] } = {
      'Cocody': [-3.9854, 5.3515],
      'Plateau': [-4.0267, 5.3250],
      'Marcory': [-4.0017, 5.2950],
      'Adjamé': [-4.0217, 5.3517],
      'Yopougon': [-4.0917, 5.3450],
      'Abobo': [-4.0183, 5.4233],
      'Koumassi': [-3.9650, 5.2933],
      'Treichville': [-4.0100, 5.2917],
      'Port-Bouët': [-3.9217, 5.2550],
      'Abidjan': [-4.0083, 5.3600],
    };

    // Ajouter les nouveaux marqueurs
    listings.forEach((listing) => {
      // Extraire la ville de la location
      const city = listing.location.split(',')[0].trim();
      const coords = locationCoords[city] || locationCoords['Abidjan'];

      // Ajouter un petit décalage aléatoire pour éviter la superposition
      const randomOffset = () => (Math.random() - 0.5) * 0.01;
      const lng = coords[0] + randomOffset();
      const lat = coords[1] + randomOffset();

      // Créer un élément personnalisé pour le marqueur
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(var(--primary))';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '18px';
      el.style.fontWeight = 'bold';
      el.innerHTML = '📍';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.transition = 'transform 0.2s';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedListing(listing);
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1000
        });
      });

      markersRef.current.push(marker);
    });

    // Ajuster la vue pour montrer tous les marqueurs
    if (listings.length > 0) {
      const coordinates = listings.map(listing => {
        const city = listing.location.split(',')[0].trim();
        const coords = locationCoords[city] || locationCoords['Abidjan'];
        const randomOffset = () => (Math.random() - 0.5) * 0.01;
        return [coords[0] + randomOffset(), coords[1] + randomOffset()];
      });

      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 13
      });
    }
  }, [listings]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {selectedListing && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-0 overflow-hidden shadow-xl z-10 animate-in slide-in-from-bottom-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setSelectedListing(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedListing.images?.[0] && (
              <img
                src={selectedListing.images[0]}
                alt={selectedListing.title}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2">
                  {selectedListing.title}
                </h3>
                <p className="text-primary text-xl font-bold mt-1">
                  {formatCurrency(selectedListing.price, selectedListing.currency)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{selectedListing.location}</span>
              </div>

              {selectedListing.categories && (
                <div className="text-sm text-muted-foreground">
                  {selectedListing.categories.name}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => navigate(`/listing/${selectedListing.id}`)}
                  className="flex-1"
                >
                  Voir l'annonce
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(() => {
                        // Ouvrir dans l'app de navigation
                        const city = selectedListing.location.split(',')[0].trim();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(city)}`, '_blank');
                      });
                    }
                  }}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{listings.length} annonce{listings.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
