import { useState } from "react";
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
                placeholder="Departure point"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-destructive" />
              <Input
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