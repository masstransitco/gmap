import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMarkerCube } from '@/lib/three-utils';

interface RoutePath {
  lat: number;
  lng: number;
}

interface ThreeJsOverlayProps {
  map: google.maps.Map;
  routePath: RoutePath[];
}

export function ThreeJsOverlay({ map, routePath }: ThreeJsOverlayProps) {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create WebGL overlay
    const webglOverlayView = new google.maps.WebGLOverlayView();

    webglOverlayView.onAdd = () => {
      // Initialize scene
      const scene = new THREE.Scene();

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
      directionalLight.position.set(0.5, -1, 0.5);
      scene.add(directionalLight);

      // Initialize camera
      const camera = new THREE.PerspectiveCamera();

      sceneRef.current = scene;
      cameraRef.current = camera;

      console.log('Scene and camera initialized');
    };

    webglOverlayView.onContextRestored = ({ gl }) => {
      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });
      renderer.autoClear = false;
      rendererRef.current = renderer;
      console.log('WebGL context restored');
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
        console.error('Missing required refs in onDraw');
        return;
      }

      // Clear existing route markers
      const markers = sceneRef.current.children.filter(
        child => child instanceof THREE.Mesh
      );
      markers.forEach(marker => sceneRef.current!.remove(marker));

      // Add new markers if we have a route
      if (routePath.length > 1) {
        try {
          // Create and position departure marker (green)
          const departureMarker = createMarkerCube(0x00ff00);
          const departureMatrix = transformer.fromLatLngAltitude({
            lat: routePath[0].lat,
            lng: routePath[0].lng,
            altitude: 50
          });
          departureMarker.matrix.fromArray(departureMatrix);
          departureMarker.matrixAutoUpdate = false;
          sceneRef.current.add(departureMarker);

          // Create and position arrival marker (red)
          const arrivalMarker = createMarkerCube(0xff0000);
          const arrivalMatrix = transformer.fromLatLngAltitude({
            lat: routePath[routePath.length - 1].lat,
            lng: routePath[routePath.length - 1].lng,
            altitude: 50
          });
          arrivalMarker.matrix.fromArray(arrivalMatrix);
          arrivalMarker.matrixAutoUpdate = false;
          sceneRef.current.add(arrivalMarker);
        } catch (error) {
          console.error('Error creating markers:', error);
        }
      }

      // Update camera matrix
      const mapCenter = map.getCenter();
      if (mapCenter) {
        const matrix = transformer.fromLatLngAltitude({
          lat: mapCenter.lat(),
          lng: mapCenter.lng(),
          altitude: 120
        });
        cameraRef.current.projectionMatrix.fromArray(matrix);
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      rendererRef.current.resetState();
    };

    // Set up the overlay
    webglOverlayView.setMap(map);

    return () => {
      webglOverlayView.setMap(null);
      if (sceneRef.current) {
        while (sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
      }
    };
  }, [map, routePath]);

  return null;
}