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
    const scene = createScene();
    sceneRef.current = scene;

    const overlay = new ThreeJSOverlayView({
      map,
      scene,
      anchor: { lat: 22.3035, lng: 114.1599 }, // Hong Kong center coordinates
      three: {
        camera: {
          fov: 45,
          near: 1,
          far: 2000,
        },
      },
    });

    overlay.setMap(map);

    overlay.onAdd = () => {
      console.log('Three.js overlay added to map');
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

      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        ...gl.getContextAttributes(),
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.autoClear = false;

      rendererRef.current = renderer;
    };

    overlay.onDraw = ({ gl, transformer }) => {
      const camera = overlay.getCamera();
      if (!camera || !rendererRef.current || !sceneRef.current) return;

      // Update positions for route and markers if they exist
      if (routePath.length > 1) {
        sceneRef.current.children.forEach(child => {
          if (child.userData.isRoute) {
            if (child.userData.originalLatLng) {
              const matrix = transformer.fromLatLngAltitude({
                lat: child.userData.originalLatLng.lat,
                lng: child.userData.originalLatLng.lng,
                altitude: child.userData.altitude || 0
              });
              child.matrix.set(...matrix);
            }
          }
        });
      }

      rendererRef.current.render(sceneRef.current, camera);
      rendererRef.current.resetState();
    };

    overlayRef.current = overlay;

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

  useEffect(() => {
    if (!sceneRef.current || !overlayRef.current || routePath.length === 0) return;

    console.log('Updating route visualization with path:', routePath);

    // Clear previous route objects
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
      const MARKER_HEIGHT = 100;

      try {
        // Create departure marker (green)
        const departureMarker = createMarkerCube(0x00ff00);
        departureMarker.userData.isRoute = true;
        departureMarker.userData.originalLatLng = routePath[0];
        departureMarker.userData.altitude = MARKER_HEIGHT;
        sceneRef.current.add(departureMarker);

        // Create arrival marker (red)
        const arrivalMarker = createMarkerCube(0xff0000);
        arrivalMarker.userData.isRoute = true;
        arrivalMarker.userData.originalLatLng = routePath[routePath.length - 1];
        arrivalMarker.userData.altitude = MARKER_HEIGHT;
        sceneRef.current.add(arrivalMarker);

        // Create points for the route line
        const points = routePath.map((point, index) => {
          const matrix = overlayRef.current!.transformer.fromLatLngAltitude({
            lat: point.lat,
            lng: point.lng,
            altitude: 0
          });
          return new THREE.Vector3(matrix[12], matrix[13], matrix[14]);
        });

        // Create route line
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