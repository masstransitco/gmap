import * as THREE from 'three';

export function createMarkerCube(color: number = 0x00ff00) {
  // Create a cube geometry for the marker
  const geometry = new THREE.BoxGeometry(30, 60, 30); // Increased size for better visibility
  const material = new THREE.MeshPhongMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    // Critical settings to prevent flickering
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  const cube = new THREE.Mesh(geometry, material);
  return cube;
}

export function createRouteLine(points: THREE.Vector3[]) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x0088ff,
    linewidth: 3,
    transparent: true,
    opacity: 0.8,
  });

  const line = new THREE.Line(geometry, material);
  // Elevate the line slightly to prevent z-fighting
  line.position.y = 5;
  return line;
}

export function createScene() {
  const scene = new THREE.Scene();

  // Add ambient light for consistent illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  // Add directional light for shadows and depth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0.5, 1, 0.5);
  scene.add(directionalLight);

  return scene;
}