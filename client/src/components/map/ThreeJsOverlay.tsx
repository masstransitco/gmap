import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createScene } from '@/lib/three-utils';

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
      anchor: { lat: 22.3035, lng: 114.1599 }, // Hong Kong coordinates
      three: {
        camera: {
          fov: 45,
          near: 1,
          far: 2000,
        },
        // Critical: Set WebGL context attributes for proper overlay
        contextAttributes: {
          antialias: true,
          preserveDrawingBuffer: false,
          alpha: true,
          stencil: true,
          depth: true,
          powerPreference: 'high-performance',
        },
      },
    });

    overlay.setMap(map);

    overlay.onAdd = () => {
      console.log('Three.js overlay added to map');
      // Begin render loop only after context is ready
      const animate = () => {
        if (sceneRef.current?.userData.update) {
          sceneRef.current.userData.update();
        }
        overlay.requestRedraw();
        requestAnimationFrame(animate);
      };
      animate();
    };

    overlay.onContextRestored = ({ gl }) => {
      console.log('WebGL context restored');
      if (!gl) return;

      // Create the renderer using the map's WebGL context
      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.autoClear = false;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      rendererRef.current = renderer;
    };

    overlay.onDraw = ({ transformer }) => {
      const camera = overlay.getCamera();
      if (!camera || !rendererRef.current || !sceneRef.current) return;

      // Update camera matrix to ensure proper georeferencing
      const latLngAltitudeLiteral = {
        lat: 22.3035,
        lng: 114.1599,
        altitude: 100,
      };
      const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

      // Clear the renderer properly
      rendererRef.current.clear();

      // Render with proper state management
      rendererRef.current.render(sceneRef.current, camera);
      rendererRef.current.resetState();
    };

    overlayRef.current = overlay;

    // Proper cleanup
    return () => {
      console.log('Cleaning up Three.js overlay...');
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [map]);

  // Update route visualization when path changes
  useEffect(() => {
    if (!sceneRef.current || !overlayRef.current || routePath.length === 0) return;

    // Clear previous route visualization
    sceneRef.current.children.forEach(child => {
      if (child.userData.isRoute) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
        sceneRef.current?.remove(child);
      }
    });

    if (routePath.length > 1) {
      // Create route visualization
      const points = routePath.map((point) => {
        return new THREE.Vector3(
          point.lng - routePath[0].lng,
          50, // Height above ground
          point.lat - routePath[0].lat
        );
      });

      // Create route line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
      });

      const routeLine = new THREE.Line(lineGeometry, lineMaterial);
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);

      // Add markers at start and end points
      const markerGeometry = new THREE.SphereGeometry(5, 32, 32);
      const startMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8,
      });
      const endMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
      });

      const startMarker = new THREE.Mesh(markerGeometry, startMaterial);
      startMarker.position.set(0, 50, 0);
      startMarker.userData.isRoute = true;
      sceneRef.current.add(startMarker);

      const endMarker = new THREE.Mesh(markerGeometry, endMaterial);
      const lastPoint = points[points.length - 1];
      endMarker.position.set(lastPoint.x, 50, lastPoint.z);
      endMarker.userData.isRoute = true;
      sceneRef.current.add(endMarker);
    }

    // Request a redraw
    overlayRef.current?.requestRedraw();
  }, [routePath]);

  return null;
}