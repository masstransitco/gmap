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

    const { scene, renderer, camera } = initScene(overlayRef.current);
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const overlay = new google.maps.WebGLOverlayView();

    overlay.onAdd = () => {
      // Called when the overlay is added to the map
    };

    overlay.onContextRestored = ({ gl }) => {
      if (!rendererRef.current) return;

      // Set up WebGL context
      rendererRef.current.autoClear = false;
      rendererRef.current.state.enable(gl.BLEND);
      rendererRef.current.state.blendEquation(gl.FUNC_ADD);
      rendererRef.current.state.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    };

    overlay.onDraw = ({ transformer }) => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

      const matrix = transformer.fromLatLngAltitude({
        lat: map.getCenter()?.lat() || 0,
        lng: map.getCenter()?.lng() || 0,
        altitude: 120
      });

      updateSceneObjects(sceneRef.current, matrix);

      const projection = new THREE.Matrix4().fromArray(matrix);
      cameraRef.current.projectionMatrix = projection;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      rendererRef.current.resetState();
    };

    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
      rendererRef.current?.dispose();
    };
  }, [map]);

  return <div ref={overlayRef} className="absolute inset-0 pointer-events-none" />;
}