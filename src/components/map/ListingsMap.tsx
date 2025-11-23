import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Navigation, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';

type GeoJSONFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    location: string;
    categoryName?: string;
    profileName?: string;
    profileAvatar?: string;
  };
};

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
  heatmapMode?: boolean;
}

export const ListingsMap = ({ 
  listings, 
  centerLat = 5.3600, // Abidjan par défaut
  centerLng = -4.0083,
  zoom = 11,
  heatmapMode = false
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

    const mapInstance = map.current;

    // Attendre que la carte soit chargée avant d'ajouter des sources
    const addListingsToMap = () => {
      // Supprimer les anciennes sources et couches si elles existent
      if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
      if (mapInstance.getLayer('cluster-count')) mapInstance.removeLayer('cluster-count');
      if (mapInstance.getLayer('unclustered-point')) mapInstance.removeLayer('unclustered-point');
      if (mapInstance.getLayer('listings-heatmap')) mapInstance.removeLayer('listings-heatmap');
      if (mapInstance.getSource('listings')) mapInstance.removeSource('listings');

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Créer les features GeoJSON
    const features: GeoJSONFeature[] = listings
      .filter(listing => listing.latitude && listing.longitude)
      .map(listing => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [listing.longitude!, listing.latitude!]
        },
        properties: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          currency: listing.currency,
          images: listing.images || [],
          location: listing.location,
          categoryName: listing.categories?.name,
          profileName: listing.profiles?.full_name,
          profileAvatar: listing.profiles?.avatar_url
        }
      }));

    if (features.length === 0) return;

    if (heatmapMode) {
      // Mode Heatmap: Ajouter la source sans clustering
      mapInstance.addSource('listings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Couche heatmap avec dégradé de couleurs
      mapInstance.addLayer({
        id: 'listings-heatmap',
        type: 'heatmap',
        source: 'listings',
        paint: {
          // Intensité de la heatmap basée sur le zoom
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          // Rayon de chaque point de la heatmap
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 30
          ],
          // Dégradé de couleurs (bleu -> vert -> jaune -> orange -> rouge)
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Opacité basée sur le zoom
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.8,
            15, 0.6
          ]
        }
      });
    } else {
      // Mode Clustering: Ajouter la source avec clustering
      mapInstance.addSource('listings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Couche pour les clusters
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'listings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            'hsl(var(--primary))',
            10,
            'hsl(var(--accent))',
            30,
            'hsl(var(--destructive))'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Texte du compteur dans les clusters
      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'listings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Couche pour les marqueurs individuels
      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'listings',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': 'hsl(var(--primary))',
          'circle-radius': 12,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff'
        }
      });

      // Click sur cluster: zoomer
      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        
        if (!features.length) return;
        
        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource('listings') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          
          const coordinates = (features[0].geometry as any).coordinates;
          mapInstance.easeTo({
            center: coordinates,
            zoom: zoom
          });
        });
      });

      // Click sur marqueur individuel: afficher la carte
      mapInstance.on('click', 'unclustered-point', (e) => {
        if (!e.features || !e.features[0]) return;
        
        const props = e.features[0].properties;
        const listing = listings.find(l => l.id === props?.id);
        
        if (listing) {
          setSelectedListing(listing);
          const coordinates = (e.features[0].geometry as any).coordinates.slice();
          mapInstance.flyTo({
            center: coordinates,
            zoom: 14,
            duration: 1000
          });
        }
      });

      // Curseur pointer sur clusters et marqueurs
      mapInstance.on('mouseenter', 'clusters', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'clusters', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
      mapInstance.on('mouseenter', 'unclustered-point', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'unclustered-point', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    }

    // Ajuster la vue pour montrer tous les marqueurs
    const bounds = new mapboxgl.LngLatBounds();
    features.forEach(feature => {
      bounds.extend(feature.geometry.coordinates as [number, number]);
    });

    if (features.length === 1) {
      mapInstance.flyTo({
        center: features[0].geometry.coordinates as [number, number],
        zoom: 13,
        duration: 1000
      });
    } else {
      mapInstance.fitBounds(bounds, {
        padding: { top: 80, bottom: 280, left: 50, right: 50 },
        maxZoom: 13,
        duration: 1000
      });
    }
    };

    // Si la carte est déjà chargée, ajouter directement
    if (mapInstance.isStyleLoaded()) {
      addListingsToMap();
    } else {
      // Sinon, attendre que le style soit chargé
      mapInstance.once('style.load', addListingsToMap);
    }

    return () => {
      // Cleanup: retirer l'event listener si le composant est démonté avant le chargement
      mapInstance.off('style.load', addListingsToMap);
    };
  }, [listings, heatmapMode]);

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
