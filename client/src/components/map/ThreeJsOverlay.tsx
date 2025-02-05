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

    const overlay = new google.maps.WebGLOverlayView();

    overlay.onAdd = () => {
      console.log('WebGLOverlay added to map');
    };

    overlay.onContextRestored = ({ gl }) => {
      console.log('WebGL context restored');
      if (!rendererRef.current) {
        console.error('Renderer not initialized');
        return;
      }

      try {
        rendererRef.current.autoClear = false;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } catch (error) {
        console.error('Error in onContextRestored:', error);
      }
    };

    overlay.onDraw = ({ transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
        console.warn('Missing Three.js references in onDraw');
        return;
      }

      try {
        // ICC building coordinates
        const matrix = transformer.fromLatLngAltitude({
          lat: 22.3035,
          lng: 114.1599,
          altitude: 400 // Height in meters for better visibility
        });

        updateSceneObjects(sceneRef.current, matrix);

        const projection = new THREE.Matrix4().fromArray(matrix);
        cameraRef.current.projectionMatrix = projection;

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        rendererRef.current.resetState();
      } catch (error) {
        console.error('Error in onDraw:', error);
      }
    };

    console.log('Setting up WebGLOverlay on map...');
    overlay.setMap(map);

    return () => {
      console.log('Cleaning up WebGLOverlay...');
      overlay.setMap(null);
      rendererRef.current?.dispose();
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