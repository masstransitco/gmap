import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface RouteInputsProps {
  onRouteChange: (departure: string, arrival: string) => void;
}

export function RouteInputs({ onRouteChange }: RouteInputsProps) {
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const departureRef = useRef<HTMLInputElement>(null);
  const arrivalRef = useRef<HTMLInputElement>(null);
  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete>();
  const arrivalAutocompleteRef = useRef<google.maps.places.Autocomplete>();

  useEffect(() => {
    if (!departureRef.current || !arrivalRef.current) return;

    // Initialize Google Places Autocomplete
    const initializeAutocomplete = async () => {
      const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

      departureAutocompleteRef.current = new Autocomplete(departureRef.current!, {
        types: ['address'],
        fields: ['formatted_address', 'geometry']
      });

      arrivalAutocompleteRef.current = new Autocomplete(arrivalRef.current!, {
        types: ['address'],
        fields: ['formatted_address', 'geometry']
      });

      // Add listeners to update state when place is selected
      departureAutocompleteRef.current.addListener('place_changed', () => {
        const place = departureAutocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setDeparture(place.formatted_address);
        }
      });

      arrivalAutocompleteRef.current.addListener('place_changed', () => {
        const place = arrivalAutocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setArrival(place.formatted_address);
        }
      });
    };

    initializeAutocomplete().catch(console.error);

    // Cleanup
    return () => {
      google.maps.event.clearInstanceListeners(departureAutocompleteRef.current!);
      google.maps.event.clearInstanceListeners(arrivalAutocompleteRef.current!);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (departure && arrival) {
      onRouteChange(departure, arrival);
    }
  };

  return (
    <Card className="absolute top-6 left-6 w-96 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Input
                ref={departureRef}
                placeholder="Departure point"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-destructive" />
              <Input
                ref={arrivalRef}
                placeholder="Arrival point"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Calculate Route
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}