import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();

  // Add lights for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create a cube representing the ICC building
  const geometry = new THREE.BoxGeometry(30, 200, 30); // Tall building shape
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    opacity: 0.8,
    transparent: true,
    shininess: 50,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
  });

  const cube = new THREE.Mesh(geometry, material);

  // Position cube relative to the anchor point
  cube.position.set(0, 100, 0); // Half height up to sit on ground
  cube.rotation.y = Math.PI / 4; // 45-degree rotation

  // Add smooth rotation animation
  const rotationSpeed = 0.002;
  cube.userData.update = () => {
    cube.rotation.y += rotationSpeed;
  };

  scene.add(cube);

  // Add update method to the scene for animation
  scene.userData.update = () => {
    scene.traverse((object) => {
      if (object.userData.update) {
        object.userData.update();
      }
    });
  };

  return scene;
}