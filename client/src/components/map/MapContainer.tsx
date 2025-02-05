import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loading";
import { ThreeJsOverlay } from "./ThreeJsOverlay";
import { useToast } from "@/hooks/use-toast";

export function MapContainer() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let scriptLoadTimeout: NodeJS.Timeout;

    const loadGoogleMaps = async () => {
      // Check if the API key is available
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        toast({
          title: "Error",
          description: "Google Maps API key is not configured",
          variant: "destructive"
        });
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker&v=beta`;
      script.async = true;
      script.defer = true;

      // Set up timeout to detect loading failures
      scriptLoadTimeout = setTimeout(() => {
        toast({
          title: "Error",
          description: "Google Maps failed to load. Please refresh the page.",
          variant: "destructive"
        });
      }, 10000);

      // Initialize map once script is loaded
      script.onload = async () => {
        clearTimeout(scriptLoadTimeout);
        try {
          const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

          if (!containerRef.current) return;

          const map = new Map(containerRef.current, {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 15,
            mapId: 'vector_map',
            disableDefaultUI: false,
            mapTypeId: 'roadmap'
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

      script.onerror = () => {
        clearTimeout(scriptLoadTimeout);
        toast({
          title: "Error",
          description: "Failed to load Google Maps",
          variant: "destructive"
        });
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      clearTimeout(scriptLoadTimeout);
    };
  }, [toast]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {mapRef.current && <ThreeJsOverlay map={mapRef.current} />}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader />
        </div>
      )}
    </div>
  );
}