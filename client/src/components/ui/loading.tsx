export function Loader() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  );
}
