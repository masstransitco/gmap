import { useEffect, useRef, useState } from "react";
import { Loader } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { ThreeJsOverlay } from "./ThreeJsOverlay";
import { RouteInputs } from "./RouteInputs";

interface RoutePath {
  lat: number;
  lng: number;
}

export function MapContainer() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [routePath, setRoutePath] = useState<RoutePath[]>([]);
  const { toast } = useToast();

  const handleRouteChange = async (departure: string, arrival: string) => {
    if (!mapRef.current) return;

    try {
      console.log('Calculating route from', departure, 'to', arrival);
      const directionsService = new google.maps.DirectionsService();

      const result = await directionsService.route({
        origin: departure,
        destination: arrival,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        region: 'HK'
      });

      const route = result.routes[0];
      if (route && route.overview_path) {
        const path = route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));

        setRoutePath(path);

        // Fit map bounds to show the entire route with padding
        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        mapRef.current?.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Route Error",
        description: "Could not calculate route between the specified points. Please try different locations.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      toast({
        title: "Configuration Error",
        description: "Google Maps API key is not configured",
        variant: "destructive"
      });
      return;
    }

    // Load Google Maps API with proper initialization sequence
    const loadGoogleMaps = async () => {
      try {
        console.log('Starting Google Maps initialization...');

        // Load the Google Maps script asynchronously
        await new Promise<void>((resolve, reject) => {
          if (window.google?.maps) {
            console.log('Google Maps already loaded');
            setIsLoadingScript(false);
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.defer = true;

          script.onload = () => {
            console.log('Google Maps script loaded successfully');
            if (isMounted) {
              setIsLoadingScript(false);
            }
            resolve();
          };

          script.onerror = (error) => {
            console.error('Failed to load Google Maps:', error);
            reject(new Error('Failed to load Google Maps'));
          };

          document.head.appendChild(script);
        });

        // Wait for the container to be available
        while (isMounted && !containerRef.current) {
          console.log('Waiting for map container...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!isMounted) return;

        console.log('Map container found, initializing map...');

        // Initialize map with correct configuration for WebGL overlay
        const map = new google.maps.Map(containerRef.current!, {
          center: { lat: 22.3035, lng: 114.1599 }, // Hong Kong coordinates
          zoom: 15,
          tilt: 45,
          heading: 0,
          mapId: "15431d2b469f209e", // Vector tiles map ID
          disableDefaultUI: false,
          mapTypeId: 'roadmap',
          backgroundColor: 'transparent',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          rotateControl: true,
        });

        if (isMounted) {
          mapRef.current = map;
          setMapLoaded(true);
          console.log('Map initialized successfully');
        }

      } catch (error) {
        console.error('Map initialization error:', error);
        if (isMounted) {
          setIsLoadingScript(false);
          toast({
            title: "Error",
            description: "Failed to initialize the map",
            variant: "destructive"
          });
        }
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="absolute inset-0 bg-gray-100" 
        style={{ minHeight: '500px' }}
      />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      {mapRef.current && mapLoaded && (
        <>
          <ThreeJsOverlay 
            map={mapRef.current} 
            routePath={routePath}
          />
          <RouteInputs onRouteChange={handleRouteChange} />
        </>
      )}
    </div>
  );
}