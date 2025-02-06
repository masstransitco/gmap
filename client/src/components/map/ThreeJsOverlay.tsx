import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
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
  const overlayRef = useRef<ThreeJSOverlayView>();
  const sceneRef = useRef<THREE.Scene>();

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create scene with proper lighting
    const scene = new THREE.Scene();

    // Add ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0, 10, 50);
    scene.add(directionalLight);

    sceneRef.current = scene;

    // Initialize overlay with the basic setup from example
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: new google.maps.LatLng(22.3035, 114.1599),
      THREE,
    });

    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
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

    console.log('Updating 3D markers for route endpoints');

    // Clear previous markers
    sceneRef.current.children = sceneRef.current.children.filter(child => !child.userData.isRoute);

    if (routePath.length > 1) {
      try {
        // Create departure marker (green) at elevation
        const departureMarker = createMarkerCube(0x00ff00);
        departureMarker.userData.isRoute = true;
        const startLatLng = new google.maps.LatLng(routePath[0].lat, routePath[0].lng);
        const startPos = overlayRef.current.latLngAltitudeToVector3(startLatLng, 50);
        departureMarker.position.copy(startPos);
        sceneRef.current.add(departureMarker);

        // Create arrival marker (red) at elevation
        const arrivalMarker = createMarkerCube(0xff0000);
        arrivalMarker.userData.isRoute = true;
        const endLatLng = new google.maps.LatLng(routePath[routePath.length - 1].lat, routePath[routePath.length - 1].lng);
        const endPos = overlayRef.current.latLngAltitudeToVector3(endLatLng, 50);
        arrivalMarker.position.copy(endPos);
        sceneRef.current.add(arrivalMarker);

        overlayRef.current.requestRedraw();
        console.log('3D markers updated successfully');
      } catch (error) {
        console.error('Error updating 3D markers:', error);
      }
    }
  }, [routePath]);

  return null;
}