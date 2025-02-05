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
      console.log('API Key available:', !!apiKey); // Log if API key exists

      if (!apiKey) {
        toast({
          title: "Configuration Error",
          description: "Google Maps API key is not configured. Please check your environment variables.",
          variant: "destructive"
        });
        return;
      }

      if (!containerRef.current) {
        console.error('Map container not found');
        return;
      }

      try {
        // Only load script if Google Maps is not already loaded
        if (!window.google?.maps) {
          console.log('Loading Google Maps script...');

          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker&v=beta`;
            script.async = true;

            script.onload = () => {
              console.log('Google Maps script loaded successfully');
              resolve();
            };

            script.onerror = () => {
              console.error('Failed to load Google Maps script');
              reject(new Error('Failed to load Google Maps script'));
            };

            document.head.appendChild(script);
          });
        }

        console.log('Initializing map with Maps library...');
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

        const map = new Map(containerRef.current, {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 15,
          mapId: 'vector_map',
          disableDefaultUI: false,
          mapTypeId: 'roadmap'
        });

        console.log('Map initialized successfully');
        mapRef.current = map;
        setMapLoaded(true);

      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize the map. Please ensure your API key is valid.",
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