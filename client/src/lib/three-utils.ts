import * as THREE from 'three';

export function createMarkerCube(color: number = 0x00ff00) {
  // Create a cube geometry for the marker
  const geometry = new THREE.BoxGeometry(5, 10, 5); // Smaller size for better scale
  const material = new THREE.MeshPhongMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.renderOrder = 2; // Ensure markers render above the route line

  // Add subtle animation
  const animate = () => {
    if (cube) {
      cube.rotation.y += 0.01;
      // Very subtle floating animation
      cube.position.y += Math.sin(Date.now() * 0.002) * 0.05;
    }
  };

  cube.userData.animate = animate;
  return cube;
}

export function createRouteLine(points: THREE.Vector3[], color: number = 0x0088ff) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: true,
    opacity: 0.8,
    depthWrite: false, // Allow line to be seen through objects
  });

  const line = new THREE.Line(geometry, material);
  line.renderOrder = 1; // Ensure line renders above ground but below markers
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

  // Add update method to the scene for animation
  scene.userData.update = () => {
    scene.children.forEach(child => {
      if (child.userData.animate) {
        child.userData.animate();
      }
    });
  };

  return scene;
}