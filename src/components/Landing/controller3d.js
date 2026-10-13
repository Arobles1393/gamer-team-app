import * as THREE from "three";

// Mando 3D de la portada (LandingPage), hecho con geometría: cuerpo extruido
// con un contorno de neón violeta y cuatro partes que se encienden en rosa, una
// por razón de GamerMatch. Este módulo se importa con import() para que
// three.js vaya en su propio archivo y solo se descargue en la portada.

const COLORS = {
  body: 0x16152e,
  rim: 0x8b5cf6,
  part: 0x2a2550,
  idle: 0x7c3aed,
  active: 0xf43f5e
};

// Parte del mando que corresponde a cada razón, en el orden de las fichas:
// 0 partidas claras (botones de acción), 1 compatibilidad (stick izquierdo),
// 2 Steam (botón central), 3 comunidad (cruceta)
export const PART_ORDER = ["face", "leftStick", "guide", "dpad"];

// Hacia dónde gira el mando para mirar a cada ficha (izquierda o derecha)
const FACING = [-0.38, -0.38, 0.38, 0.38];

// Contorno del cuerpo: la mitad derecha, que se refleja para la izquierda
const RIGHT_HALF = [
  [0, 1.05], [1.0, 1.15], [1.9, 1.2], [2.55, 1.0], [2.85, 0.4], [2.95, -0.5],
  [2.85, -1.4], [2.45, -1.95], [1.95, -1.85], [1.55, -1.25], [1.0, -0.8], [0, -0.75]
];

// Recorrido: mitad derecha de arriba abajo y mitad izquierda de abajo arriba
const bodyShape = () => {
  const right = RIGHT_HALF.map(([x, y]) => new THREE.Vector2(x, y));
  const left = RIGHT_HALF.slice(1, -1).map(([x, y]) => new THREE.Vector2(-x, y)).reverse();
  const outline = [...right, ...left];
  const shape = new THREE.Shape();
  shape.moveTo(outline[0].x, outline[0].y);
  shape.splineThru([...outline.slice(1), outline[0]]);
  return shape;
};

const buildController = () => {
  const group = new THREE.Group();
  const disposables = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };

  // Cuerpo
  const depth = 0.55;
  const bodyGeometry = track(new THREE.ExtrudeGeometry(bodyShape(), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.18,
    bevelSegments: 4,
    curveSegments: 48
  }));
  bodyGeometry.translate(0, 0.35, -depth / 2);
  const bodyMaterial = track(new THREE.MeshStandardMaterial({ color: COLORS.body, metalness: 0.35, roughness: 0.42 }));
  group.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  // Contorno de neón: el mismo cuerpo un poco más grande, solo por detrás
  // (técnica de "casco invertido"), centrado sobre el cuerpo
  bodyGeometry.computeBoundingBox();
  const center = bodyGeometry.boundingBox.getCenter(new THREE.Vector3());
  const rimScale = 1.035;
  const rimMaterial = track(new THREE.MeshBasicMaterial({ color: COLORS.rim, side: THREE.BackSide, transparent: true, opacity: 0.9 }));
  const rim = new THREE.Mesh(bodyGeometry, rimMaterial);
  rim.scale.setScalar(rimScale);
  rim.position.copy(center).multiplyScalar(1 - rimScale);
  group.add(rim);

  const front = depth / 2 + 0.22;
  const parts = {};
  const partMaterial = () => track(new THREE.MeshStandardMaterial({
    color: COLORS.part,
    emissive: new THREE.Color(COLORS.idle),
    emissiveIntensity: 0.25,
    metalness: 0.2,
    roughness: 0.35
  }));
  const addPart = (name, meshes) => {
    const material = partMaterial();
    const partGroup = new THREE.Group();
    meshes.forEach(({ geometry, position, rotation }) => {
      const mesh = new THREE.Mesh(track(geometry), material);
      mesh.position.set(...position);
      if (rotation) mesh.rotation.set(...rotation);
      partGroup.add(mesh);
    });
    group.add(partGroup);
    parts[name] = { group: partGroup, material };
  };

  // Botones de acción (rombo de cuatro), a la derecha
  addPart("face", [[0, 0.42], [0.42, 0], [0, -0.42], [-0.42, 0]].map(([x, y]) => ({
    geometry: new THREE.CylinderGeometry(0.17, 0.17, 0.16, 32),
    position: [1.85 + x, 0.55 + y, front],
    rotation: [Math.PI / 2, 0, 0]
  })));

  // Cruceta, a la izquierda
  addPart("dpad", [
    { geometry: new THREE.BoxGeometry(0.85, 0.27, 0.16), position: [-1.85, 0.55, front] },
    { geometry: new THREE.BoxGeometry(0.27, 0.85, 0.16), position: [-1.85, 0.55, front] }
  ]);

  // Sticks: base y cabeza
  const stick = (x) => [
    { geometry: new THREE.CylinderGeometry(0.36, 0.4, 0.14, 40), position: [x, -0.45, front - 0.02], rotation: [Math.PI / 2, 0, 0] },
    { geometry: new THREE.SphereGeometry(0.27, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), position: [x, -0.45, front + 0.04], rotation: [Math.PI / 2, 0, 0] }
  ];
  addPart("leftStick", stick(-0.95));
  addPart("rightStick", stick(0.95));

  // Botón central
  addPart("guide", [{
    geometry: new THREE.CylinderGeometry(0.22, 0.22, 0.12, 40),
    position: [0, 0.75, front],
    rotation: [Math.PI / 2, 0, 0]
  }]);

  // Gatillos superiores
  addPart("bumpers", [-1, 1].map((side) => ({
    geometry: new THREE.CapsuleGeometry(0.16, 0.9, 6, 16),
    position: [side * 1.95, 1.62, 0],
    rotation: [0, 0, Math.PI / 2]
  })));

  return { group, parts, disposables };
};

/**
 * Monta el mando en el canvas. reducedMotion: sin flotar ni rotar solo; se
 * dibuja solo cuando algo cambia. Devuelve { select(i), setPointer(x, y),
 * dispose() }. Lanza un error si WebGL no está disponible (la portada muestra
 * entonces la imagen fija).
 */
export const createControllerScene = (canvas, { reducedMotion = false } = {}) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 11.5);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 4, 6);
  scene.add(key);
  const violet = new THREE.PointLight(COLORS.idle, 40, 30);
  violet.position.set(-5, 2.5, 4);
  scene.add(violet);
  const pink = new THREE.PointLight(COLORS.active, 30, 30);
  pink.position.set(5, -1.5, 4);
  scene.add(pink);

  const { group, parts, disposables } = buildController();
  group.rotation.x = -0.18;
  scene.add(group);

  const state = { selected: 0, pointerX: 0, pointerY: 0, targetY: FACING[0], pulse: 0 };
  let frame = null;
  let visible = true;
  let last = performance.now();

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };

  const paintParts = (glow) => {
    Object.entries(parts).forEach(([name, part]) => {
      const active = name === PART_ORDER[state.selected];
      part.material.emissive.setHex(active ? COLORS.active : COLORS.idle);
      part.material.emissiveIntensity = active ? glow : 0.22;
    });
  };

  function render() {
    renderer.render(scene, camera);
  }

  const tick = (now) => {
    frame = null;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.pulse += dt;
    // Gira hacia la ficha elegida y se inclina un poco hacia el puntero
    const targetY = state.targetY + state.pointerX * 0.18;
    const targetX = -0.18 + state.pointerY * 0.1;
    group.rotation.y += (targetY - group.rotation.y) * Math.min(dt * 5, 1);
    group.rotation.x += (targetX - group.rotation.x) * Math.min(dt * 5, 1);
    group.position.y = Math.sin(state.pulse * 1.2) * 0.08;
    paintParts(1.1 + Math.sin(state.pulse * 3) * 0.35);
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
    group.rotation.y = state.targetY;
    group.rotation.x = -0.18;
    paintParts(1.2);
    render();
  };

  resize();
  if (reducedMotion) settleStatic(); else start();

  return {
    select(index) {
      state.selected = index;
      state.targetY = FACING[index] ?? 0;
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
      renderer.dispose();
    }
  };
};
