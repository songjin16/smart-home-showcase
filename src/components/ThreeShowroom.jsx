import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const pointPositions = {
  'main-light': new THREE.Vector3(0, 2.55, -0.35),
  curtain: new THREE.Vector3(-2.62, 1.35, -1.1),
  panel: new THREE.Vector3(2.55, 1.1, 0.75),
  speaker: new THREE.Vector3(-0.85, 0.55, -2.15),
  ac: new THREE.Vector3(2.25, 1.95, -1.85),
  sensor: new THREE.Vector3(-2.48, 1.8, -1.95),
};

function makeLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(11, 18, 32, 0.82)';
  context.roundRect(10, 18, 364, 92, 28);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '500 34px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 192, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function addBox(scene, size, position, color, name = '') {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.02 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export default function ThreeShowroom({ scene, products, onSelectProduct }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const latestSceneRef = useRef(scene);
  const latestSelectRef = useRef(onSelectProduct);

  latestSceneRef.current = scene;
  latestSelectRef.current = onSelectProduct;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color('#eef4f1');

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(4.4, 3.1, 5.2);
    camera.lookAt(0, 1, -0.45);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.45);
    threeScene.add(ambientLight);

    const mainLight = new THREE.PointLight('#fff2c2', 2.1, 8, 1.8);
    mainLight.position.set(0, 2.5, -0.15);
    mainLight.castShadow = true;
    threeScene.add(mainLight);

    const accentLight = new THREE.PointLight('#6ee7b7', 1.1, 5, 2);
    accentLight.position.set(-1.8, 0.8, -1.9);
    threeScene.add(accentLight);

    addBox(threeScene, [5.8, 0.08, 4.2], [0, -0.04, 0], '#d6c6a8', 'floor');
    addBox(threeScene, [5.8, 2.8, 0.08], [0, 1.36, -2.1], '#f5efe3', 'back-wall');
    addBox(threeScene, [0.08, 2.8, 4.2], [-2.9, 1.36, 0], '#e9f1f3', 'left-wall');
    addBox(threeScene, [0.08, 2.8, 4.2], [2.9, 1.36, 0], '#edf1e8', 'right-wall');

    addBox(threeScene, [1.55, 0.62, 0.72], [-0.9, 0.34, 0.68], '#52796f', 'sofa-left');
    addBox(threeScene, [1.55, 0.62, 0.72], [0.72, 0.34, 0.68], '#52796f', 'sofa-right');
    addBox(threeScene, [3.28, 0.62, 0.18], [-0.08, 0.72, 1.04], '#46655d', 'sofa-back');
    addBox(threeScene, [0.9, 0.1, 0.55], [-0.95, 0.72, 0.42], '#9bb7aa', 'pillow-one');
    addBox(threeScene, [0.7, 0.1, 0.5], [0.72, 0.72, 0.42], '#f0c987', 'pillow-two');

    addBox(threeScene, [1.55, 0.16, 0.75], [0, 0.28, -0.35], '#b08968', 'coffee-table');
    addBox(threeScene, [1.8, 0.92, 0.08], [0, 1.12, -2.04], '#172033', 'tv');
    addBox(threeScene, [2.35, 0.32, 0.38], [0, 0.28, -1.82], '#8d6e63', 'tv-cabinet');
    addBox(threeScene, [0.52, 0.5, 0.12], [2.86, 1.15, 0.75], '#111827', 'panel');
    addBox(threeScene, [0.86, 0.28, 0.22], [2.42, 2.02, -1.85], '#ffffff', 'ac');
    addBox(threeScene, [0.26, 0.34, 0.26], [-0.85, 0.62, -1.86], '#111827', 'speaker');
    addBox(threeScene, [0.28, 0.2, 0.2], [-2.84, 1.8, -1.85], '#ffffff', 'sensor');

    const curtainLeft = addBox(threeScene, [0.12, 1.82, 0.08], [-2.82, 1.3, -1.2], '#8b5e54', 'curtain-left');
    const curtainRight = addBox(threeScene, [0.12, 1.82, 0.08], [-2.82, 1.3, -0.2], '#8b5e54', 'curtain-right');
    addBox(threeScene, [0.06, 1.48, 1.55], [-2.88, 1.36, -0.7], '#b7e4f9', 'window');

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 16),
      new THREE.MeshStandardMaterial({ color: '#fff8db', emissive: '#fff2c2', emissiveIntensity: 1.5 }),
    );
    bulb.position.set(0, 2.5, -0.35);
    threeScene.add(bulb);

    const interactives = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    products.forEach((product) => {
      const position = pointPositions[product.id];
      if (!position) return;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 24, 12),
        new THREE.MeshStandardMaterial({
          color: '#14b8a6',
          emissive: '#0f766e',
          emissiveIntensity: 0.55,
          roughness: 0.3,
        }),
      );
      marker.position.copy(position);
      marker.userData.product = product;
      threeScene.add(marker);
      interactives.push(marker);

      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeLabelTexture(product.name),
          transparent: true,
          depthTest: false,
        }),
      );
      label.position.copy(position).add(new THREE.Vector3(0, 0.25, 0));
      label.scale.set(0.82, 0.28, 1);
      threeScene.add(label);
    });

    const applyScene = (active) => {
      ambientLight.intensity = 0.22 + active.light * 0.48;
      mainLight.intensity = 0.45 + active.light * 2.35;
      mainLight.color.set(active.warmth);
      accentLight.color.set(active.accent);
      accentLight.intensity = active.id === 'away' ? 0.85 : 0.65 + active.light * 1.25;
      bulb.material.emissive.set(active.warmth);
      bulb.material.emissiveIntensity = 0.35 + active.light * 1.8;
      curtainLeft.scale.z = 1 + active.curtain * 2.6;
      curtainRight.scale.z = 1 + active.curtain * 2.6;
      curtainLeft.position.z = -1.45 + active.curtain * 0.32;
      curtainRight.position.z = 0.05 - active.curtain * 0.32;
      renderer.setClearColor(active.id === 'movie' ? '#dbeafe' : '#eef4f1', 1);
    };

    const onResize = () => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(interactives);
      if (hit?.object?.userData?.product) {
        latestSelectRef.current(hit.object.userData.product);
      }
    };

    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    apiRef.current = { applyScene };
    applyScene(latestSceneRef.current);

    let animationFrame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      interactives.forEach((marker, index) => {
        marker.position.y = pointPositions[marker.userData.product.id].y + Math.sin(elapsed * 2 + index) * 0.025;
        marker.scale.setScalar(1 + Math.sin(elapsed * 3 + index) * 0.08);
      });
      renderer.render(threeScene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      mount.removeChild(renderer.domElement);
      threeScene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      apiRef.current = null;
    };
  }, [products]);

  useEffect(() => {
    apiRef.current?.applyScene(scene);
  }, [scene]);

  return (
    <div className="three-shell">
      <div className="three-canvas" ref={mountRef} />
      <div className="viewer-help">点击发光点位查看产品介绍</div>
    </div>
  );
}
