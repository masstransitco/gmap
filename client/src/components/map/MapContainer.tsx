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
    const initMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        
        if (!containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 15,
          mapId: 'vector_map', // Create this in Google Cloud Console
          disableDefaultUI: false,
          mapTypeId: 'roadmap'
        });

        mapRef.current = map;
        setMapLoaded(true);

      } catch (error) {
        toast({
          title: "Error loading map",
          description: "Please check your internet connection and try again",
          variant: "destructive"
        });
      }
    };

    initMap();
  }, [toast]);

  if (!mapLoaded) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <Loader />
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {mapRef.current && <ThreeJsOverlay map={mapRef.current} />}
    </div>
  );
}
