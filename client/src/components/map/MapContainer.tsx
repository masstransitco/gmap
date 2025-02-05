import { useEffect, useRef, useState } from "react";
import { Loader } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { ThreeJsOverlay } from "./ThreeJsOverlay";
import { RouteInputs } from "./RouteInputs";

export function MapContainer() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  const handleRouteChange = async (departure: string, arrival: string) => {
    if (!mapRef.current) return;

    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: departure,
        destination: arrival,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      const route = result.routes[0];
      if (route && route.overview_path) {
        const path = route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));

        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        mapRef.current?.fitBounds(bounds);

        console.log('Route calculated:', path);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Route Error",
        description: "Could not calculate route between the specified points",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        toast({
          title: "Configuration Error",
          description: "Google Maps API key is not configured",
          variant: "destructive"
        });
        return;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          // Include WebGL and vector specific libraries
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker,geometry,visualization&v=weekly&channel=2`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        });

        if (!containerRef.current) return;

        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

        // Initialize map with vector rendering
        const map = new Map(containerRef.current, {
          center: { lat: 22.3035, lng: 114.1599 },
          zoom: 19,
          tilt: 45,
          heading: 0,
          mapId: "8e0a97af9386fef",
          disableDefaultUI: false,
          // Use vector map styling
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [
                { visibility: "simplified" },
                { saturation: -60 },
                { lightness: 10 }
              ]
            }
          ],
          // Required for proper WebGL overlay
          backgroundColor: 'transparent',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          rotateControl: true,
        });

        mapRef.current = map;
        setMapLoaded(true);

      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize the map",
          variant: "destructive"
        });
      }
    };

    loadGoogleMaps();
  }, [toast]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader />
        </div>
      )}
      {mapRef.current && mapLoaded && <ThreeJsOverlay map={mapRef.current} />}
      <RouteInputs onRouteChange={handleRouteChange} />
    </div>
  );
}