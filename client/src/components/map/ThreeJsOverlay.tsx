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
      anchor: new google.maps.LatLng(0, 0),
      three: {
        camera: {
          fov: 45,
          near: 1,
          far: 2000,
        },
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
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      rendererRef.current = renderer;
    };

    overlay.onDraw = ({ gl, transformer }) => {
      const camera = overlay.getCamera();
      if (!camera || !rendererRef.current || !sceneRef.current) return;

      overlay.requestRedraw();
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
      const MARKER_HEIGHT = 100; // Consistent height for both markers

      // Convert all route points to world coordinates using Google Maps projection
      const worldPoints = routePath.map(point => {
        const matrix = overlayRef.current!.getProjection().fromLatLngAltitude({
          lat: point.lat,
          lng: point.lng,
          altitude: 0
        });
        return { 
          position: new THREE.Vector3(matrix[12], 0, matrix[14]),
          original: point 
        };
      });

      // Create and position the departure marker (green)
      const startPoint = worldPoints[0].position.clone();
      const departureMarker = createMarkerCube(0x00ff00);
      departureMarker.position.copy(startPoint);
      departureMarker.position.y = MARKER_HEIGHT; // Set exact height
      departureMarker.userData.isRoute = true;
      sceneRef.current.add(departureMarker);

      // Create and position the arrival marker (red)
      const endPoint = worldPoints[worldPoints.length - 1].position.clone();
      const arrivalMarker = createMarkerCube(0xff0000);
      arrivalMarker.position.copy(endPoint);
      arrivalMarker.position.y = MARKER_HEIGHT; // Same exact height as departure
      arrivalMarker.userData.isRoute = true;
      sceneRef.current.add(arrivalMarker);

      // Create the route line using all path points
      const routeLine = createRouteLine(worldPoints.map(p => p.position));
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);

      overlayRef.current.requestRedraw();
      console.log('Route visualization updated');
    }
  }, [routePath]);

  return null;
}