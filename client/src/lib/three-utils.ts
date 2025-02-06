import * as THREE from 'three';

export function createMarkerCube(color: number = 0x00ff00) {
  // Create a cube geometry for the marker
  const geometry = new THREE.BoxGeometry(5, 10, 5); // Smaller size to match map scale
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
  cube.castShadow = true;
  cube.receiveShadow = true;

  // Add animation
  const animate = () => {
    if (cube) {
      cube.rotation.y += 0.02;
    }
  };

  cube.userData.animate = animate;
  return cube;
}

export function createRouteLine(points: THREE.Vector3[], color: number = 0x0088ff) {
  // Create a smooth curve through the points
  const curve = new THREE.CatmullRomCurve3(points);
  const curvePoints = curve.getPoints(50 * points.length); // More points for smoother curve

  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: true,
    opacity: 0.8,
  });

  const line = new THREE.Line(geometry, material);
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
  directionalLight.castShadow = true;
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