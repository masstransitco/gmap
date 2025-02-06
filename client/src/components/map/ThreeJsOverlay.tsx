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
      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.PerspectiveCamera();

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      sceneRef.current.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
      directionalLight.position.set(0.5, -1, 0.5);
      sceneRef.current.add(directionalLight);

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

      // Clear any existing markers
      const markers = sceneRef.current.children.filter(
        child => child instanceof THREE.Mesh
      );
      markers.forEach(marker => sceneRef.current!.remove(marker));

      if (routePath.length > 1) {
        try {
          // Create departure marker (green cube)
          const departureMarker = createMarkerCube(0x00ff00);
          const departureMatrix = transformer.fromLatLngAltitude({
            lat: routePath[0].lat,
            lng: routePath[0].lng,
            altitude: 50
          });
          departureMarker.matrix.fromArray(departureMatrix);
          departureMarker.matrixAutoUpdate = false;
          sceneRef.current.add(departureMarker);
          console.log('Added departure marker');

          // Create arrival marker (red cube)
          const arrivalMarker = createMarkerCube(0xff0000);
          const arrivalMatrix = transformer.fromLatLngAltitude({
            lat: routePath[routePath.length - 1].lat,
            lng: routePath[routePath.length - 1].lng,
            altitude: 50
          });
          arrivalMarker.matrix.fromArray(arrivalMatrix);
          arrivalMarker.matrixAutoUpdate = false;
          sceneRef.current.add(arrivalMarker);
          console.log('Added arrival marker');
        } catch (error) {
          console.error('Error creating markers:', error);
        }
      }

      // Update camera matrix
      const matrix = transformer.fromLatLngAltitude({
        lat: map.getCenter()?.lat() || 0,
        lng: map.getCenter()?.lng() || 0,
        altitude: 120
      });
      cameraRef.current.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

      // Render and reset
      webglOverlayView.requestRedraw();
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