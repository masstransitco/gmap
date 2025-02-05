import * as THREE from 'three';

export function initScene(container: HTMLDivElement) {
  // Create scene
  const scene = new THREE.Scene();

  // Create and configure renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Create and position camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    1,
    2000
  );

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
    opacity: 1.0,
    transparent: true,
    shininess: 50,
    side: THREE.DoubleSide,
  });

  const cube = new THREE.Mesh(geometry, material);
  // Position cube at half its height to sit on the ground
  cube.position.set(0, 100, 0);
  scene.add(cube);

  return { scene, renderer, camera };
}

export function updateSceneObjects(scene: THREE.Scene, matrix: Float64Array) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Add a subtle rotation animation
      object.rotation.y += 0.005;
    }
  });
}