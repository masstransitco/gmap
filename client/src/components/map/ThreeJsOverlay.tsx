import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
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
  const overlayRef = useRef<ThreeJSOverlayView>();
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    const webglOverlayView = new google.maps.WebGLOverlayView();

    webglOverlayView.onAdd = () => {
      // Set up the scene
      const scene = createScene();
      sceneRef.current = scene;

      // Set up the camera
      cameraRef.current = new THREE.PerspectiveCamera();
    };

    webglOverlayView.onContextRestored = ({ gl }) => {
      // Create the Three.js renderer using the WebGL context from the map
      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });
      renderer.autoClear = false;
      rendererRef.current = renderer;
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

      // Update marker positions if route exists
      if (routePath.length > 1) {
        // Clear existing markers
        sceneRef.current.children = sceneRef.current.children.filter(
          child => !child.userData.isRoute
        );

        // Create departure marker (green)
        const departureMarker = createMarkerCube(0x00ff00);
        departureMarker.userData.isRoute = true;

        const startMatrix = transformer.fromLatLngAltitude({
          lat: routePath[0].lat,
          lng: routePath[0].lng,
          altitude: 50
        });

        if (startMatrix) {
          departureMarker.matrix.fromArray(startMatrix);
          departureMarker.matrixAutoUpdate = false;
          sceneRef.current.add(departureMarker);
        }

        // Create arrival marker (red)
        const arrivalMarker = createMarkerCube(0xff0000);
        arrivalMarker.userData.isRoute = true;

        const endMatrix = transformer.fromLatLngAltitude({
          lat: routePath[routePath.length - 1].lat,
          lng: routePath[routePath.length - 1].lng,
          altitude: 50
        });

        if (endMatrix) {
          arrivalMarker.matrix.fromArray(endMatrix);
          arrivalMarker.matrixAutoUpdate = false;
          sceneRef.current.add(arrivalMarker);
        }
      }

      // Update camera matrix for proper projection
      const cameraMatrix = transformer.fromLatLngAltitude({
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
        altitude: 100
      });

      if (cameraMatrix) {
        cameraRef.current.projectionMatrix = new THREE.Matrix4().fromArray(cameraMatrix);
      }

      // Render the scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      // Reset GL state
      rendererRef.current.resetState();
    };

    // Set the overlay on the map
    webglOverlayView.setMap(map);
    overlayRef.current = webglOverlayView;

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [map]);

  return null;
}