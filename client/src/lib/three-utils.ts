import * as THREE from 'three';

export function initScene(container: HTMLDivElement) {
  const scene = new THREE.Scene();

  // Setup renderer with proper blending for map overlay
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true, // Better depth handling for overlay
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Setup camera with appropriate near/far planes for map scale
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    1, // Near plane
    2000 // Far plane
  );

  // Enhanced lighting for 3D objects
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add sample 3D objects
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    opacity: 0.8,
    transparent: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  return { scene, renderer, camera };
}

export function updateSceneObjects(scene: THREE.Scene, matrix: Float64Array) {
  // Update positions and rotations of objects based on map
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Rotate objects to match map perspective
      object.rotation.x += 0.01;
      object.rotation.y += 0.01;

      // Adjust position based on map tilt
      const tilt = Math.PI / 4; // 45 degrees tilt
      object.position.y = Math.sin(tilt) * 50; // Lift objects slightly above ground
    }
  });
}