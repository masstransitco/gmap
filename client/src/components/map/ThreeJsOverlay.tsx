import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createMarkerCube, createRouteLine } from '@/lib/three-utils';

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

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create scene with proper lighting following the example
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0, 10, 50);
    scene.add(directionalLight);

    sceneRef.current = scene;

    // Initialize overlay with proper settings
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: { lat: 22.3035, lng: 114.1599, altitude: 100 },
      THREE,
    });

    overlay.setMap(map);

    overlayRef.current = overlay;

    return () => {
      console.log('Cleaning up Three.js overlay...');
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [map]);

  useEffect(() => {
    if (!sceneRef.current || !overlayRef.current || routePath.length === 0) return;

    console.log('Updating route visualization with path:', routePath);

    // Clear previous route objects
    sceneRef.current.children.forEach(child => {
      if (child.userData.isRoute) {
        sceneRef.current?.remove(child);
      }
    });

    if (routePath.length > 1) {
      try {
        // Set new anchor point to start of route
        overlayRef.current.anchor = {
          lat: routePath[0].lat,
          lng: routePath[0].lng,
          altitude: 100
        };

        // Create departure marker (green)
        const departureMarker = createMarkerCube(0x00ff00);
        departureMarker.userData.isRoute = true;
        const startPos = overlayRef.current.latLngAltitudeToVector3(
          { lat: routePath[0].lat, lng: routePath[0].lng },
          50
        );
        departureMarker.position.copy(startPos);
        sceneRef.current.add(departureMarker);

        // Create arrival marker (red)
        const arrivalMarker = createMarkerCube(0xff0000);
        arrivalMarker.userData.isRoute = true;
        const endPos = overlayRef.current.latLngAltitudeToVector3(
          { lat: routePath[routePath.length - 1].lat, lng: routePath[routePath.length - 1].lng },
          50
        );
        arrivalMarker.position.copy(endPos);
        sceneRef.current.add(arrivalMarker);

        // Create route line
        const points = routePath.map(point => {
          return overlayRef.current!.latLngAltitudeToVector3(
            { lat: point.lat, lng: point.lng },
            0
          );
        });

        const routeLine = createRouteLine(points);
        routeLine.userData.isRoute = true;
        sceneRef.current.add(routeLine);

        overlayRef.current.requestRedraw();
        console.log('Route visualization updated successfully');
      } catch (error) {
        console.error('Error updating route visualization:', error);
      }
    }
  }, [routePath]);

  return null;
}