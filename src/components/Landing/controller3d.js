import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Mando 3D de la portada (LandingPage): el modelo "Gamepad" de Poly Haven
// (Josh Dean, CC0), sin el cable (public/landing/gamepad.glb, ver
// public/landing/README.md). Cada razón de GamerMatch enciende en rosa una
// zona del mando. Este módulo se importa con import() para que three.js vaya
// en su propio archivo y solo se descargue en la portada.

const MODEL_URL = "/landing/gamepad.glb";

const COLORS = {
  glow: "rgba(139, 92, 246, 0.5)",
  active: 0xf43f5e,
  violet: 0x7c3aed
};

// Zonas del mando en coordenadas del modelo (x, z: centro; rx, rz: radios
// de la elipse; minY: altura mínima, para encender solo lo que sobresale).
// El orden coincide con las fichas: 0 partidas claras (botones de acción),
// 1 compatibilidad (Select), 2 Steam (Start), 3 comunidad (cruceta)
const ZONES = [
  { x: 0.066, z: 0.1902, rx: 0.023, rz: 0.023, minY: 0.0161 },
  { x: 0.0126, z: 0.1992, rx: 0.0068, rz: 0.0038, minY: 0 },
  { x: 0.0316, z: 0.1992, rx: 0.0068, rz: 0.0038, minY: 0 },
  { x: -0.0195, z: 0.1902, rx: 0.02, rz: 0.02, minY: 0.0161 }
];

// Hacia dónde mira el mando para cada ficha: y = izquierda/derecha,
// x = arriba/abajo (fichas superiores e inferiores de cada lado)
const FACING = [
  { y: -0.42, x: -0.28 },
  { y: -0.42, x: -0.02 },
  { y: 0.42, x: -0.28 },
  { y: 0.42, x: -0.02 }
];

// Tamaño en la escena: el mando mide 14,4 cm de ancho
const SCALE = 46;

// Enciende en rosa la zona elegida: se suma a la emisión del material en el
// shader, así el modelo sigue siendo una sola pieza
const addHighlight = (material) => {
  const uniforms = {
    uZone: { value: new THREE.Vector4() },
    uMinY: { value: 0 },
    uGlow: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.active) }
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vModelPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvModelPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vModelPos;\nuniform vec4 uZone;\nuniform float uMinY;\nuniform float uGlow;\nuniform vec3 uColor;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        vec2 zoneDist = (vModelPos.xz - uZone.xy) / uZone.zw;
        float zoneMask = 1.0 - smoothstep(0.7, 1.0, length(zoneDist));
        zoneMask *= smoothstep(uMinY - 0.0006, uMinY + 0.0004, vModelPos.y);
        totalEmissiveRadiance += uColor * zoneMask * uGlow;`);
  };
  return uniforms;
};

const loadController = async () => {
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  const disposables = [];
  let mesh = null;
  gltf.scene.traverse((child) => {
    if (child.isMesh && !mesh) mesh = child;
  });
  if (!mesh) throw new Error("El modelo del mando no tiene malla");
  disposables.push(mesh.geometry, mesh.material);
  ["map", "normalMap", "roughnessMap", "metalnessMap"].forEach((key) => {
    if (mesh.material[key]) disposables.push(mesh.material[key]);
  });

  const highlight = addHighlight(mesh.material);

  // Centrado y de frente: el modelo está tumbado (los botones miran a +y)
  mesh.geometry.computeBoundingBox();
  const center = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
  mesh.removeFromParent();
  mesh.position.copy(center).multiplyScalar(-1);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.setScalar(1);
  const lying = new THREE.Group();
  lying.add(mesh);
  lying.rotation.x = Math.PI / 2;
  lying.scale.setScalar(SCALE);

  const group = new THREE.Group();
  group.add(lying);

  // Brillo violeta detrás del mando: un plano con un degradado radial suave
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, COLORS.glow);
  gradient.addColorStop(0.45, "rgba(139, 92, 246, 0.2)");
  gradient.addColorStop(0.75, "rgba(244, 63, 94, 0.06)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const glowGeometry = new THREE.PlaneGeometry(10, 5.6);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = -1.2;
  group.add(glow);
  disposables.push(glowTexture, glowMaterial, glowGeometry);

  return { group, highlight, disposables };
};

/**
 * Monta el mando en el canvas. reducedMotion: sin flotar ni rotar solo; se
 * dibuja solo cuando algo cambia. Resuelve con { select(i), setPointer(x, y),
 * dispose() } cuando el modelo ha cargado. Falla si WebGL no está disponible
 * o el modelo no carga (la portada muestra entonces la imagen fija).
 */
export const createControllerScene = async (canvas, { reducedMotion = false } = {}) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  let loaded;
  try {
    loaded = await loadController();
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const { group, highlight, disposables } = loaded;

  const scene = new THREE.Scene();
  // Reflejos realistas: una habitación de estudio como entorno de luz
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.7;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 4, 6);
  scene.add(key);
  // Luz de contorno violeta desde atrás y una rosa más suave, del mundo de la app
  const violet = new THREE.DirectionalLight(COLORS.violet, 2.2);
  violet.position.set(-4, 3, -5);
  scene.add(violet);
  const pink = new THREE.PointLight(COLORS.active, 18, 30);
  pink.position.set(5, -2, 4);
  scene.add(pink);

  group.rotation.x = FACING[0].x;
  scene.add(group);

  // flash: destello de luz al elegir una ficha (decae en ~0,6 s)
  const state = { selected: 0, pointerX: 0, pointerY: 0, target: FACING[0], pulse: 0, flash: 0 };
  let frame = null;
  let visible = true;
  let last = performance.now();

  function render() {
    renderer.render(scene, camera);
  }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };

  const paintZone = (glow) => {
    const zone = ZONES[state.selected] ?? ZONES[0];
    highlight.uZone.value.set(zone.x, zone.z, zone.rx, zone.rz);
    highlight.uMinY.value = zone.minY;
    highlight.uGlow.value = glow;
  };

  const tick = (now) => {
    frame = null;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.pulse += dt;
    // Gira hacia la ficha elegida y se inclina un poco hacia el puntero
    const targetY = state.target.y + state.pointerX * 0.18;
    const targetX = state.target.x + state.pointerY * 0.1;
    state.flash = Math.max(0, state.flash - dt * 1.7);
    group.rotation.y += (targetY - group.rotation.y) * Math.min(dt * 5, 1);
    group.rotation.x += (targetX - group.rotation.x) * Math.min(dt * 5, 1);
    group.position.y = Math.sin(state.pulse * 1.2) * 0.08;
    paintZone(0.9 + Math.sin(state.pulse * 3) * 0.3 + state.flash * 1.8);
    render();
    if (visible) frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (reducedMotion || frame !== null || !visible) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  // Solo anima mientras se ve y la pestaña está activa
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden;
    if (visible) start(); else stop();
  });
  io.observe(canvas);
  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) start(); else stop();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const settleStatic = () => {
    group.rotation.y = state.target.y;
    group.rotation.x = state.target.x;
    paintZone(1);
    render();
  };

  resize();
  if (reducedMotion) settleStatic(); else start();

  return {
    select(index) {
      state.selected = index;
      state.target = FACING[index] ?? FACING[0];
      state.flash = 1;
      if (reducedMotion) settleStatic();
    },
    setPointer(x, y) {
      state.pointerX = x;
      state.pointerY = y;
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      disposables.forEach((thing) => thing.dispose());
      environment.dispose();
      renderer.dispose();
    }
  };
};
