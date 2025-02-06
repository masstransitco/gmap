import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMarkerCube, createRouteLine, createScene } from '@/lib/three-utils';

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
      console.log('WebGL context restored');
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
        console.error('Missing required refs in onDraw');
        return;
      }

      // Clear existing objects
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }

      if (routePath.length > 1) {
        try {
          // Create route line points
          const points = routePath.map(point => {
            const matrix = transformer.fromLatLngAltitude({
              lat: point.lat,
              lng: point.lng,
              altitude: 20
            });
            const vector = new THREE.Vector3();
            vector.setFromMatrixPosition(new THREE.Matrix4().fromArray(matrix));
            return vector;
          });

          // Add route line
          const routeLine = createRouteLine(points);
          sceneRef.current.add(routeLine);

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
          console.error('Error creating route visualization:', error);
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

      // Render and reset
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      rendererRef.current.resetState();
    };

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