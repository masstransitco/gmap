import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RouteInputsProps {
  onRouteChange: (departure: string, arrival: string) => void;
}

interface PlaceLocation {
  address: string;
  location?: google.maps.LatLng;
}

export function RouteInputs({ onRouteChange }: RouteInputsProps) {
  const [departure, setDeparture] = useState<PlaceLocation>({ address: "" });
  const [arrival, setArrival] = useState<PlaceLocation>({ address: "" });
  const departureRef = useRef<HTMLInputElement>(null);
  const arrivalRef = useRef<HTMLInputElement>(null);
  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete>();
  const arrivalAutocompleteRef = useRef<google.maps.places.Autocomplete>();
  const { toast } = useToast();

  useEffect(() => {
    if (!departureRef.current || !arrivalRef.current || !window.google?.maps) return;

    // Initialize Google Places Autocomplete
    const initializeAutocomplete = async () => {
      try {
        // Wait for Places library to be loaded
        const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        // Configure autocomplete for departure
        departureAutocompleteRef.current = new Autocomplete(departureRef.current!, {
          fields: ['formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'hk' }, // Restrict to Hong Kong
          types: ['establishment', 'geocode', 'address']
        });

        // Configure autocomplete for arrival
        arrivalAutocompleteRef.current = new Autocomplete(arrivalRef.current!, {
          fields: ['formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'hk' }, // Restrict to Hong Kong
          types: ['establishment', 'geocode', 'address']
        });

        // Add listeners to update state when place is selected
        departureAutocompleteRef.current.addListener('place_changed', () => {
          const place = departureAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            setDeparture({
              address: place.formatted_address || place.name || '',
              location: place.geometry.location
            });
            toast({
              title: "Departure Selected",
              description: place.formatted_address || place.name,
            });
          } else {
            setDeparture({ address: departureRef.current?.value || "" });
            toast({
              title: "Invalid Location",
              description: "Please select a location from the dropdown suggestions",
              variant: "destructive"
            });
          }
        });

        arrivalAutocompleteRef.current.addListener('place_changed', () => {
          const place = arrivalAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            setArrival({
              address: place.formatted_address || place.name || '',
              location: place.geometry.location
            });
            toast({
              title: "Arrival Selected",
              description: place.formatted_address || place.name,
            });
          } else {
            setArrival({ address: arrivalRef.current?.value || "" });
            toast({
              title: "Invalid Location",
              description: "Please select a location from the dropdown suggestions",
              variant: "destructive"
            });
          }
        });

      } catch (error) {
        console.error('Failed to initialize Places Autocomplete:', error);
        toast({
          title: "Error",
          description: "Failed to initialize location search",
          variant: "destructive"
        });
      }
    };

    initializeAutocomplete();

    // Cleanup
    return () => {
      if (departureAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(departureAutocompleteRef.current);
      }
      if (arrivalAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(arrivalAutocompleteRef.current);
      }
    };
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (departure.location && arrival.location) {
      onRouteChange(
        `${departure.location.lat()},${departure.location.lng()}`,
        `${arrival.location.lat()},${arrival.location.lng()}`
      );
    }
  };

  return (
    <Card className="absolute top-6 left-6 w-96 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Input
                ref={departureRef}
                placeholder="Enter departure location"
                value={departure.address}
                onChange={(e) => setDeparture({ address: e.target.value })}
                className="flex-1"
              />
            </div>
            <div className="relative flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-destructive" />
              <Input
                ref={arrivalRef}
                placeholder="Enter arrival location"
                value={arrival.address}
                onChange={(e) => setArrival({ address: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!departure.location || !arrival.location}
          >
            Calculate Route
          </Button>
        </form>
      </CardContent>
      <style>{`
        .pac-container {
          z-index: 1000;
          border-radius: 0.5rem;
          margin-top: 4px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          background-color: white;
          border: 1px solid #e2e8f0;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
        }
        .pac-item:hover {
          background-color: #f7fafc;
        }
        .pac-item-query {
          font-size: 14px;
          padding-right: 4px;
        }
        .pac-matched {
          font-weight: bold;
        }
      `}</style>
    </Card>
  );
}