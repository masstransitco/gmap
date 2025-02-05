import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initScene, updateSceneObjects } from '@/lib/three-utils';

interface ThreeJsOverlayProps {
  map: google.maps.Map;
}

export function ThreeJsOverlay({ map }: ThreeJsOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useEffect(() => {
    if (!overlayRef.current) return;

    console.log('Initializing Three.js scene...');
    const { scene, renderer, camera } = initScene(overlayRef.current);
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Create the WebGL overlay view
    const overlay = new google.maps.WebGLOverlayView();

    // Initialize WebGL when overlay is added to map
    overlay.onAdd = () => {
      console.log('WebGLOverlay added to map');
    };

    // Set up WebGL context and renderer
    overlay.onContextRestored = ({ gl }) => {
      console.log('WebGL context restored, setting up renderer...');
      if (!rendererRef.current) return;

      try {
        // Configure WebGL context
        rendererRef.current.autoClear = false;
        rendererRef.current.setPixelRatio(window.devicePixelRatio);

        // Enable depth testing and blending
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        console.log('WebGL context setup completed');
      } catch (error) {
        console.error('Error in onContextRestored:', error);
      }
    };

    // Handle WebGL context loss
    overlay.onContextLost = () => {
      console.log('WebGL context lost');
    };

    // Render the scene
    overlay.onDraw = ({ gl, transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
        console.warn('Missing Three.js references in onDraw');
        return;
      }

      try {
        // Get the ICC building coordinates matrix
        const matrix = transformer.fromLatLngAltitude({
          lat: 22.3035,  // ICC building latitude
          lng: 114.1599, // ICC building longitude
          altitude: 200  // Height in meters
        });

        // Update scene objects (rotating cube)
        updateSceneObjects(sceneRef.current, matrix);

        // Set up camera projection matrix
        const projection = new THREE.Matrix4().fromArray(matrix);
        cameraRef.current.projectionMatrix = projection;

        // Set up viewport and render
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        rendererRef.current.state.reset();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        rendererRef.current.resetState();

      } catch (error) {
        console.error('Error in onDraw:', error);
      }
    };

    // Add the overlay to the map
    console.log('Adding WebGLOverlay to map...');
    overlay.setMap(map);

    // Cleanup
    return () => {
      console.log('Cleaning up WebGLOverlay...');
      overlay.setMap(null);
      rendererRef.current?.dispose();
      sceneRef.current?.clear();
    };
  }, [map]);

  return (
    <div 
      ref={overlayRef} 
      className="absolute inset-0 pointer-events-none" 
      style={{ width: '100%', height: '100%' }}
    />
  );
}