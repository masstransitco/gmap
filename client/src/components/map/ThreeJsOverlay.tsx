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

    // Initialize the WebGL overlay with correct context attributes
    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: { lat: 22.3035, lng: 114.1599 },
      three: {
        camera: {
          fov: 45,
          near: 1,
          far: 2000,
        },
        // Critical: Set WebGL context attributes for proper overlay
        contextAttributes: {
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: true,
          stencil: true,
          powerPreference: 'high-performance',
        },
      },
    });

    // Proper initialization sequence
    overlay.setMap(map);

    // Handle WebGL context events
    overlay.onAdd = () => {
      console.log('Three.js overlay added to map');

      // Begin render loop only after context is ready
      const animate = () => {
        if (sceneRef.current?.userData.update) {
          sceneRef.current.userData.update();
        }
        overlay.requestRedraw();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    // Required: Handle context restoration
    overlay.onContextRestored = () => {
      console.log('WebGL context restored');
      if (sceneRef.current) {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.material.needsUpdate = true;
          }
        });
      }
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