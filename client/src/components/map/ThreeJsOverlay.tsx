import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMarkerCube, createScene } from '@/lib/three-utils';

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
    const webglOverlayView = new google.maps.WebGLOverlayView();

    webglOverlayView.onAdd = () => {
      sceneRef.current = createScene();
      cameraRef.current = new THREE.PerspectiveCamera();
      console.log('Scene and camera initialized');
    };

    webglOverlayView.onContextRestored = ({ gl }) => {
      rendererRef.current = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });
      rendererRef.current.autoClear = false;
      console.log('WebGL context restored and renderer initialized');
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
        console.error('Missing required refs in onDraw');
        return;
      }

      // Clear existing markers from the scene
      const existingMarkers = sceneRef.current.children.filter(child => child.userData.isRoute);
      existingMarkers.forEach(marker => sceneRef.current!.remove(marker));

      if (routePath.length > 1) {
        try {
          // Create and position departure marker (green)
          const departureMarker = createMarkerCube(0x00ff00);
          departureMarker.userData.isRoute = true;

          const startMatrix = transformer.fromLatLngAltitude({
            lat: routePath[0].lat,
            lng: routePath[0].lng,
            altitude: 120
          });
          departureMarker.matrix.fromArray(startMatrix);
          departureMarker.matrixAutoUpdate = false;
          sceneRef.current.add(departureMarker);
          console.log('Added departure marker');

          // Create and position arrival marker (red)
          const arrivalMarker = createMarkerCube(0xff0000);
          arrivalMarker.userData.isRoute = true;

          const endMatrix = transformer.fromLatLngAltitude({
            lat: routePath[routePath.length - 1].lat,
            lng: routePath[routePath.length - 1].lng,
            altitude: 120
          });
          arrivalMarker.matrix.fromArray(endMatrix);
          arrivalMarker.matrixAutoUpdate = false;
          sceneRef.current.add(arrivalMarker);
          console.log('Added arrival marker');
        } catch (error) {
          console.error('Error placing markers:', error);
        }
      }

      // Update camera matrix for proper projection
      const matrix = transformer.fromLatLngAltitude({
        lat: map.getCenter()?.lat() || 0,
        lng: map.getCenter()?.lng() || 0,
        altitude: 120
      });

      cameraRef.current.projectionMatrix.fromArray(matrix);

      // Request a redraw and render
      webglOverlayView.requestRedraw();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      rendererRef.current.resetState();
    };

    // Set the overlay on the map
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