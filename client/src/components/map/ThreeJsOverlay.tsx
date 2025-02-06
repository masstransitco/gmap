import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeJSOverlayView } from '@googlemaps/three';
import { createScene, createMarkerCube, createRouteLine } from '@/lib/three-utils';
import { Matrix4 } from 'three';

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
      anchor: new google.maps.LatLng(0, 0), // Will be updated with route
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

    overlay.onDraw = ({ gl, transformer }) => {
      const camera = overlay.getCamera();
      if (!camera || !rendererRef.current || !sceneRef.current) return;

      //This section is removed because mapOptions is not used after the changes.
      //const mapOptions = {center: {lat:0, lng:0}}; // Placeholder - needs proper implementation

      //const latLngAltitudeLiteral = {
      //  lat: mapOptions.center.lat,
      //  lng: mapOptions.center.lng,
      //  altitude: 100,
      //};
      // Update camera matrix to ensure the model is georeferenced correctly on the map.
      //const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);

      //camera.projectionMatrix = new Matrix4().fromArray(matrix); //Corrected assignment
      overlay.requestRedraw(); //Corrected to use overlay instead of webglOverlayView
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

    console.log('Updating route visualization with path:', routePath);

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
      const startPoint = routePath[0];

      // Update overlay anchor to the start point
      overlayRef.current.anchor = new google.maps.LatLng(startPoint.lat, startPoint.lng);

      // Create departure marker (green) at higher altitude
      const departureMarker = createMarkerCube(0x00ff00);
      departureMarker.position.set(0, 200, 0); // Increased Y position for altitude
      departureMarker.userData.isRoute = true;
      sceneRef.current.add(departureMarker);

      // Create points for the route, relative to start point
      const points = routePath.map((point, index) => {
        // Convert lat/lng differences to approximate meters
        const deltaLng = (point.lng - startPoint.lng) * 111000 * Math.cos(startPoint.lat * Math.PI / 180);
        const deltaLat = (point.lat - startPoint.lat) * 111000;

        return new THREE.Vector3(
          deltaLng,
          50 + Math.sin(index * 0.2) * 10, // Route elevation with wave pattern
          -deltaLat // Negative because Three.js Z is opposite to latitude
        );
      });

      // Create arrival marker (red) at higher altitude
      const arrivalMarker = createMarkerCube(0xff0000);
      const lastPoint = points[points.length - 1];
      arrivalMarker.position.copy(lastPoint);
      arrivalMarker.position.y = 200; // Set to same height as departure marker
      arrivalMarker.userData.isRoute = true;
      sceneRef.current.add(arrivalMarker);

      // Create and add route line
      const routeLine = createRouteLine(points);
      routeLine.userData.isRoute = true;
      sceneRef.current.add(routeLine);

      // Request a redraw with the updated scene
      overlayRef.current.requestRedraw();

      console.log('Route visualization updated');
    }
  }, [routePath]);

  return null;
}