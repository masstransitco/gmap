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
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!map) return;

    console.log('Initializing Three.js overlay...');

    // Create the scene with our 3D objects
    const scene = createScene();
    sceneRef.current = scene;

    // Create the ThreeJS overlay view with WebGL state preservation
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: { lat: 22.3035, lng: 114.1599 },
      three: {
        camera: {
          fov: 75,
          near: 1,
          far: 2000,
        },
        // Important: These options prevent flickering and ensure proper WebGL context
        preserveDrawingBuffer: true,
        alpha: true,
        antialias: true,
        logarithmicDepthBuffer: true,
      },
    });

    // Set up the overlay and ensure it's properly initialized
    overlay.setMap(map);
    overlay.onAdd = () => {
      // WebGL context is now available
      console.log('Three.js overlay added to map');

      // Start the render loop
      const animate = () => {
        if (sceneRef.current?.userData.update) {
          sceneRef.current.userData.update();
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    overlayRef.current = overlay;

    return () => {
      console.log('Cleaning up Three.js overlay...');
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [map]);

  // Function to update route visualization
  const updateRoute = (path: { lat: number; lng: number }[]) => {
    if (!sceneRef.current) return;

    // Clear previous route objects
    sceneRef.current.children.forEach(child => {
      if (child.userData.isRoute) {
        sceneRef.current?.remove(child);
      }
    });

    // Create white cubes for departure and arrival points
    const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    // Add departure point cube
    if (path.length > 0) {
      const departureCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      departureCube.position.set(0, 5, 0);
      departureCube.userData.isRoute = true;
      sceneRef.current.add(departureCube);
    }

    // Add arrival point cube
    if (path.length > 1) {
      const arrivalCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      arrivalCube.position.set(
        path[path.length - 1].lng - path[0].lng,
        5,
        path[path.length - 1].lat - path[0].lat
      );
      arrivalCube.userData.isRoute = true;
      sceneRef.current.add(arrivalCube);

      // Create route line
      const points = path.map((point, index) => {
        if (index === 0) return new THREE.Vector3(0, 5, 0);
        return new THREE.Vector3(
          point.lng - path[0].lng,
          5,
          point.lat - path[0].lat
        );
      });

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
      });

      const routeLine = new THREE.Line(lineGeometry, lineMaterial);
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);
    }
  };

  return null;
}