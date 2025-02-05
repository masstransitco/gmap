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
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast({
        title: "Error",
        description: "Google Maps API key is not configured",
        variant: "destructive"
      });
      return;
    }

    // Load Google Maps script dynamically
    const script = document.getElementById('google-maps-script') as HTMLScriptElement || document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=maps,marker&v=beta`;
    script.async = true;
    document.body.appendChild(script);


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