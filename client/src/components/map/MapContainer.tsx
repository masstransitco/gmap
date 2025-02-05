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

    const initMap = async () => {
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
          title: "Error loading map",
          description: "Please check your internet connection and try again",
          variant: "destructive"
        });
      }
    };

    // Define the callback function that Google Maps will call
    window.initMap = initMap;

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