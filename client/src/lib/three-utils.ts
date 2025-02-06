import * as THREE from 'three';

export function createMarkerCube(color: number = 0x00ff00) {
  // Create a simple cube geometry for the marker
  const geometry = new THREE.BoxGeometry(2, 4, 2);
  const material = new THREE.MeshPhongMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.renderOrder = 1; // Ensure markers render on top
  return cube;
}

export function createRouteLine(points: THREE.Vector3[]) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x0088ff,
    linewidth: 2,
    transparent: true,
    opacity: 0.8,
  });

  const line = new THREE.Line(geometry, material);
  line.renderOrder = 0; // Render below markers
  return line;
}

export function createScene() {
  const scene = new THREE.Scene();

  // Add ambient light for consistent illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  // Add directional light for shadows and depth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
  directionalLight.position.set(0, 10, 50);
  scene.add(directionalLight);

  return scene;
}