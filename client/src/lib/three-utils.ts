import * as THREE from 'three';

export function initScene(container: HTMLDivElement) {
  const scene = new THREE.Scene();

  // Setup renderer with proper blending for map overlay
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Setup camera with appropriate near/far planes for map scale
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    1,
    2000
  );

  // Enhanced lighting for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create a larger, more visible cube
  const geometry = new THREE.BoxGeometry(100, 100, 100);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    opacity: 0.8,
    transparent: true,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 50, 0); // Position the cube above ground level
  scene.add(cube);

  return { scene, renderer, camera };
}

export function updateSceneObjects(scene: THREE.Scene, matrix: Float64Array) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Animate rotation
      object.rotation.x += 0.01;
      object.rotation.y += 0.01;

      // Maintain elevation above ground
      object.position.y = Math.max(object.position.y, 50);
    }
  });
}