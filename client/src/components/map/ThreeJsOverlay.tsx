import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createScene, createMarkerCube, createRouteLine } from '@/lib/three-utils';
import { Matrix4 } from 'three';

interface RoutePath {
  lat: number;
  lng: number;
}

interface ThreeJsOverlayProps {
  map: google.maps.Map;
  routePath: RoutePath[];
}

export function ThreeJsOverlay({ map, routePath }: ThreeJsOverlayProps) {
  const overlayRef = useRef<ThreeJSOverlayView | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Initialize the WebGL overlay
  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create the scene
    const scene = createScene();
    sceneRef.current = scene;

    // Initialize the WebGL overlay
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      THREE,
      anchor: new google.maps.LatLng(map.getCenter()),
    });

    // Set up WebGL context
    overlay.onContextRestored = ({ gl }) => {
      console.log('WebGL context restored');

      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });

      renderer.autoClear = false;
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;
    };

    // Handle drawing
    overlay.onDraw = ({ transformer }) => {
      const camera = overlay.getCamera();

      if (!camera || !rendererRef.current || !sceneRef.current) return;

      rendererRef.current.render(sceneRef.current, camera);
      // Always reset state after rendering
      rendererRef.current.resetState();

      // Request next frame
      overlay.requestRedraw();
    };

    overlayRef.current = overlay;
    overlay.setMap(map);

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [map]);

  // Update route visualization when path changes
  useEffect(() => {
    if (!overlayRef.current || !sceneRef.current || routePath.length === 0) return;

    console.log('Updating route visualization with path:', routePath);

    // Clear previous route visualization
    sceneRef.current.children = sceneRef.current.children.filter(child => !child.userData.isRoute);

    try {
      const startPoint = routePath[0];
      const endPoint = routePath[routePath.length - 1];

      // Create departure marker (green)
      const departureMatrix = overlayRef.current.transformer.fromLatLngAltitude({
        lat: startPoint.lat,
        lng: startPoint.lng,
        altitude: 200 // Higher altitude for better visibility
      });

      const departureMarker = createMarkerCube(0x00ff00);
      departureMarker.matrix.fromArray(departureMatrix);
      departureMarker.matrixAutoUpdate = false;
      departureMarker.userData.isRoute = true;
      sceneRef.current.add(departureMarker);

      // Create arrival marker (red)
      const arrivalMatrix = overlayRef.current.transformer.fromLatLngAltitude({
        lat: endPoint.lat,
        lng: endPoint.lng,
        altitude: 200
      });

      const arrivalMarker = createMarkerCube(0xff0000);
      arrivalMarker.matrix.fromArray(arrivalMatrix);
      arrivalMarker.matrixAutoUpdate = false;
      arrivalMarker.userData.isRoute = true;
      sceneRef.current.add(arrivalMarker);

      // Create route line points
      const points = routePath.map(point => {
        const matrix = overlayRef.current!.transformer.fromLatLngAltitude({
          lat: point.lat,
          lng: point.lng,
          altitude: 50 // Keep route slightly elevated
        });
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(new Matrix4().fromArray(matrix));
        return vector;
      });

      // Create and add route line
      const routeLine = createRouteLine(points, 0x0088ff);
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);

      // Request a redraw
      overlayRef.current.requestRedraw();

    } catch (error) {
      console.error('Error updating route visualization:', error);
    }
  }, [routePath]);

  return null;
}