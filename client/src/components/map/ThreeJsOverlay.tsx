import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createScene } from '@/lib/three-utils';

interface ThreeJsOverlayProps {
  map: google.maps.Map;
}

export function ThreeJsOverlay({ map }: ThreeJsOverlayProps) {
  const overlayRef = useRef<ThreeJSOverlayView>();
  const sceneRef = useRef<THREE.Scene>();

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create the scene with our 3D objects
    const scene = createScene();
    sceneRef.current = scene;

    // Create the ThreeJS overlay view
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: { lat: 22.3035, lng: 114.1599 }, // ICC building coordinates
      three: {
        // ThreeJS-specific options
        camera: {
          fov: 75,
          near: 1,
          far: 2000,
        },
      },
    });

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

  return null; // The overlay is handled by Google Maps
}