import { useEffect, useRef, useState } from "react";
import { Loader } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { ThreeJsOverlay } from "./ThreeJsOverlay";

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

      try {
        // Load the Google Maps script with necessary libraries
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker,geometry,visualization&v=beta`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        });

        // Initialize map
        if (!containerRef.current) return;

        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const map = new Map(containerRef.current, {
          center: { lat: 22.3035, lng: 114.1599 }, // ICC Hong Kong
          zoom: 19, // Increased zoom for better detail
          tilt: 67.5, // Optimal tilt for 3D view
          heading: 45, // Angled view
          mapTypeId: 'satellite', // Use satellite view for better 3D
          disableDefaultUI: false,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          rotateControl: true,
        });

        // Enable 3D buildings layer
        const webglOverlayView = new google.maps.WebGLOverlayView();
        webglOverlayView.setMap(map);

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
    </div>
  );
}