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

    // Initialize overlay following the example structure
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      THREE,
      anchor: { ...map.getCenter().toJSON(), altitude: 100 },
    });

    overlay.setMap(map);
    overlayRef.current = overlay;

    // Add camera tilt animation
    let tilt = 0;
    const animate = () => {
      if (tilt < 45) {
        tilt += 0.5;
        map.moveCamera({ tilt });
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [map]);

  // Update markers when route changes
  useEffect(() => {
    if (!sceneRef.current || !overlayRef.current || routePath.length === 0) return;

    console.log('Updating 3D markers for route endpoints');

    try {
      // Clear previous markers
      sceneRef.current.children = sceneRef.current.children.filter(child => !child.userData.isRoute);

      if (routePath.length > 1) {
        // Create departure marker (green)
        const departureMarker = createMarkerCube(0x00ff00);
        departureMarker.userData.isRoute = true;

        // Create matrices for marker positions
        const startMatrix = overlayRef.current.getProjection().fromLatLngAltitude({
          lat: routePath[0].lat,
          lng: routePath[0].lng,
          altitude: 50
        });

        if (startMatrix) {
          departureMarker.matrix.fromArray(startMatrix.elements);
          departureMarker.matrixAutoUpdate = false;
          sceneRef.current.add(departureMarker);
        }

        // Create arrival marker (red)
        const arrivalMarker = createMarkerCube(0xff0000);
        arrivalMarker.userData.isRoute = true;

        const endMatrix = overlayRef.current.getProjection().fromLatLngAltitude({
          lat: routePath[routePath.length - 1].lat,
          lng: routePath[routePath.length - 1].lng,
          altitude: 50
        });

        if (endMatrix) {
          arrivalMarker.matrix.fromArray(endMatrix.elements);
          arrivalMarker.matrixAutoUpdate = false;
          sceneRef.current.add(arrivalMarker);
        }

        // Request a redraw of the scene
        overlayRef.current.requestRedraw();
        console.log('3D markers updated successfully');
      }
    } catch (error) {
      console.error('Error updating 3D markers:', error);
    }
  }, [routePath]);

  return null;
}