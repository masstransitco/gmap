import * as THREE from 'three';

export function initScene(container: HTMLDivElement) {
  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

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

  // Create a cube for ICC building - larger size for visibility
  const geometry = new THREE.BoxGeometry(50, 200, 50); // Taller to represent skyscraper
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    opacity: 0.6,
    transparent: true,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 100, 0); // Half height to anchor at bottom
  scene.add(cube);

  container.appendChild(renderer.domElement);

  return { scene, renderer, camera };
}

export function updateSceneObjects(scene: THREE.Scene, matrix: Float64Array) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Subtle rotation for effect
      object.rotation.y += 0.01;
    }
  });
}