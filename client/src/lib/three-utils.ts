import * as THREE from 'three';

export function createScene() {
  // Create scene
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
  });

  const cube = new THREE.Mesh(geometry, material);

  // Position cube relative to the anchor point (which will be at ground level)
  cube.position.set(0, 100, 0); // Half height up to sit on ground
  cube.rotation.y = Math.PI / 4; // 45-degree rotation

  scene.add(cube);

  // Add animation
  const animate = () => {
    cube.rotation.y += 0.005;
    requestAnimationFrame(animate);
  };
  animate();

  return scene;
}