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
  latitude?: number | null;
  longitude?: number | null;
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      setMapError('Token Mapbox non configuré');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng, centerLat],
        zoom: zoom,
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Erreur de chargement de la carte');
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
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erreur d\'initialisation de la carte');
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!map.current || !listings || listings.length === 0) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    // Ajouter les nouveaux marqueurs avec coordonnées réelles
    listings.forEach((listing) => {
      // Ignorer les annonces sans coordonnées GPS
      if (!listing.latitude || !listing.longitude) {
        console.log(`Annonce ignorée (pas de coordonnées): ${listing.title}`);
        return;
      }

      const lng = listing.longitude;
      const lat = listing.latitude;

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
      bounds.extend([lng, lat]);
      hasValidBounds = true;
    });

    // Ajuster la vue pour montrer tous les marqueurs
    if (hasValidBounds) {
      if (listings.length === 1) {
        // Une seule annonce: centrer dessus
        const listing = listings[0];
        if (listing.latitude && listing.longitude) {
          map.current.flyTo({
            center: [listing.longitude, listing.latitude],
            zoom: 13,
            duration: 1000
          });
        }
      } else {
        // Plusieurs annonces: adapter les limites
        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 280, left: 50, right: 50 },
          maxZoom: 13,
          duration: 1000
        });
      }
    }
  }, [listings]);

  return (
    <div className="relative w-full h-full">
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-50">
          <Card className="p-6 text-center max-w-md">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="font-semibold text-lg mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground text-sm mb-4">{mapError}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </Card>
        </div>
      )}
      
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}
      
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
