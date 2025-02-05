import * as THREE from 'three';

export function initScene(container: HTMLDivElement) {
  const scene = new THREE.Scene();
  
  // Setup renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Setup camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  // Add sample 3D objects
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  return { scene, renderer, camera };
}

export function updateSceneObjects(scene: THREE.Scene, matrix: Float64Array) {
  // Update positions and rotations of objects based on map
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.rotation.x += 0.01;
      object.rotation.y += 0.01;
    }
  });
}
