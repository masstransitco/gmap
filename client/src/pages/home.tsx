import { MapContainer } from "@/components/map/MapContainer";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto h-screen px-4 py-6 flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            3D Map Visualization
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive 3D objects overlaid on vector tiles
          </p>
        </div>

        <Card className="flex-grow overflow-hidden">
          <MapContainer />
        </Card>
      </div>
    </div>
  );
}