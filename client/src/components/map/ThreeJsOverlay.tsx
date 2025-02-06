import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createScene, createMarkerCube, createRouteLine } from '@/lib/three-utils';

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
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
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
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
        sceneRef.current?.remove(child);
      }
    });

    if (routePath.length > 1) {
      // Create departure marker (green)
      const departureMarker = createMarkerCube(0x00ff00);
      departureMarker.position.set(0, 20, 0);
      departureMarker.userData.isRoute = true;
      sceneRef.current.add(departureMarker);

      // Create arrival marker (red)
      const arrivalMarker = createMarkerCube(0xff0000);
      const lastPoint = routePath[routePath.length - 1];
      const deltaLng = lastPoint.lng - routePath[0].lng;
      const deltaLat = lastPoint.lat - routePath[0].lat;
      arrivalMarker.position.set(deltaLng * 111000, 20, deltaLat * 111000);
      arrivalMarker.userData.isRoute = true;
      sceneRef.current.add(arrivalMarker);

      // Create route line points
      const points = routePath.map((point, index) => {
        const deltaLng = point.lng - routePath[0].lng;
        const deltaLat = point.lat - routePath[0].lat;
        // Scale the coordinates (roughly 111km per degree)
        return new THREE.Vector3(
          deltaLng * 111000,
          20 + Math.sin(index * 0.2) * 10, // Add wave pattern
          deltaLat * 111000
        );
      });

      // Create and add route line
      const routeLine = createRouteLine(points);
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);
    }

    // Request a redraw
    overlayRef.current?.requestRedraw();
  }, [routePath]);

  return null;
}