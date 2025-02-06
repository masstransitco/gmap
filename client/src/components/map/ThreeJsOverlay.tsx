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
      // Set up the scene
      sceneRef.current = createScene();

      // Set up the camera
      cameraRef.current = new THREE.PerspectiveCamera();
      console.log('Scene and camera initialized');
    };

    webglOverlayView.onContextRestored = ({ gl }) => {
      // Create the Three.js renderer using the WebGL context from the map
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
        console.log('Missing required refs in onDraw');
        return;
      }

      // Clear existing markers
      sceneRef.current.children = sceneRef.current.children.filter(
        child => !child.userData.isRoute
      );

      if (routePath.length > 1) {
        try {
          // Create departure marker (green)
          const departureMarker = createMarkerCube(0x00ff00);
          departureMarker.userData.isRoute = true;

          const startMatrix = transformer.fromLatLngAltitude({
            lat: routePath[0].lat,
            lng: routePath[0].lng,
            altitude: 100
          });

          if (startMatrix) {
            departureMarker.matrix.fromArray(startMatrix);
            departureMarker.matrixAutoUpdate = false;
            sceneRef.current.add(departureMarker);
            console.log('Added departure marker');
          }

          // Create arrival marker (red)
          const arrivalMarker = createMarkerCube(0xff0000);
          arrivalMarker.userData.isRoute = true;

          const endMatrix = transformer.fromLatLngAltitude({
            lat: routePath[routePath.length - 1].lat,
            lng: routePath[routePath.length - 1].lng,
            altitude: 100
          });

          if (endMatrix) {
            arrivalMarker.matrix.fromArray(endMatrix);
            arrivalMarker.matrixAutoUpdate = false;
            sceneRef.current.add(arrivalMarker);
            console.log('Added arrival marker');
          }
        } catch (error) {
          console.error('Error placing markers:', error);
        }
      }

      // Update camera matrix for proper projection
      const cameraMatrix = transformer.fromLatLngAltitude({
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
        altitude: 120
      });

      if (cameraMatrix) {
        cameraRef.current.projectionMatrix.fromArray(cameraMatrix);
      }

      // Render the scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      // Reset GL state
      rendererRef.current.resetState();
    };

    // Set the overlay on the map
    webglOverlayView.setMap(map);

    return () => {
      webglOverlayView.setMap(null);
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [map, routePath]);

  return null;
}