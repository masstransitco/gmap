import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();

  // Add ambient light for consistent illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  // Add directional light for shadows and depth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
  directionalLight.position.set(0.5, -1, 0.5);
  scene.add(directionalLight);

  // Create a building-like geometry
  const geometry = new THREE.BoxGeometry(20, 80, 20);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.8,
    // Critical settings to prevent flickering
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    // Prevent z-fighting
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  const cube = new THREE.Mesh(geometry, material);
  // Position slightly above ground to prevent z-fighting
  cube.position.set(0, 40, 0);

  scene.add(cube);

  // Add update method to the scene for animation
  scene.userData.update = () => {
    cube.rotation.y += 0.01;
  };

  return scene;
}