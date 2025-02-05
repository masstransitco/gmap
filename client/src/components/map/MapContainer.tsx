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

      if (!containerRef.current) {
        console.error('Map container not found');
        return;
      }

      try {
        if (!window.google?.maps) {
          await new Promise<void>((resolve) => {
            window.initMap = () => {
              resolve();
            };

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=maps,marker&v=beta`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          });
        }

        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

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
          description: "Failed to initialize the map. Please try refreshing the page.",
          variant: "destructive"
        });
      }
    };

    loadGoogleMaps();
  }, [toast]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {mapRef.current && mapLoaded && <ThreeJsOverlay map={mapRef.current} />}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader />
        </div>
      )}
    </div>
  );
}