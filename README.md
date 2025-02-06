# 3D Map Visualization with React and Three.js

A sophisticated React web application leveraging Three.js for advanced 3D geospatial visualizations with Google Maps API integration. The application provides dynamic, interactive mapping experiences combining WebGL overlay technology, route calculation, and vector tile support.

## Features

- Interactive 3D object visualization on Google Maps
- Route calculation between locations
- Places Autocomplete for address input
- Vector tile mapping support
- Responsive design with modern UI
- WebGL overlay integration

## Tech Stack

- React.js
- Three.js for 3D rendering
- Google Maps JavaScript API
  - Directions API
  - Places API
  - WebGLOverlayView
- TypeScript
- Tailwind CSS with shadcn/ui
- Vite

## Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file with your Google Maps API key:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```
4. Start the development server:
```bash
npm run dev
```

## Environment Variables

- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key with Maps JavaScript API, Directions API, and Places API enabled

## License

MIT
