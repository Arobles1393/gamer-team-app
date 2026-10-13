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
// 2 Steam (panel táctil y sus luces), 3 comunidad (cruceta)
export const PART_ORDER = ["face", "leftStick", "touchpad", "dpad"];

// Hacia dónde mira el mando para cada ficha: y = izquierda/derecha,
// x = arriba/abajo (fichas superiores e inferiores de cada lado)
const FACING = [
  { y: -0.45, x: -0.3 },
  { y: -0.45, x: -0.04 },
  { y: 0.45, x: -0.3 },
  { y: 0.45, x: -0.04 }
];

// Contorno del cuerpo: la mitad derecha, que se refleja para la izquierda
// Forma inspirada en los mandos de consola actuales: frente ancho para el panel
// táctil y grips redondeados que se abren hacia abajo y afuera
const RIGHT_HALF = [
  [0, 1.02], [0.9, 1.06], [1.75, 1.1], [2.4, 0.94], [2.8, 0.48], [3.0, -0.2],
  [3.14, -1.1], [3.22, -1.9], [3.02, -2.45], [2.58, -2.58], [2.2, -2.25], [1.88, -1.55],
  [1.45, -1.3], [0.75, -1.22], [0, -1.2]
];

// Rectángulo de esquinas redondeadas centrado en el origen (panel táctil)
const roundedRect = (w, h, r) => {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

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
  const depth = 0.36;
  const bodyGeometry = track(new THREE.ExtrudeGeometry(bodyShape(), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.13,
    bevelSegments: 6,
    curveSegments: 48
  }));
  bodyGeometry.translate(0, 0.35, -depth / 2);
  const bodyMaterial = track(new THREE.MeshStandardMaterial({ color: COLORS.body, metalness: 0.35, roughness: 0.42 }));
  group.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  // Contorno de neón: el mismo cuerpo un poco más grande, solo por detrás
  // (técnica de "casco invertido"), centrado sobre el cuerpo
  bodyGeometry.computeBoundingBox();
  const center = bodyGeometry.boundingBox.getCenter(new THREE.Vector3());
  // El trazo nítido del contorno
  const rimScale = 1.03;
  const rimMaterial = track(new THREE.MeshBasicMaterial({ color: COLORS.rim, side: THREE.BackSide }));
  const rim = new THREE.Mesh(bodyGeometry, rimMaterial);
  rim.scale.setScalar(rimScale);
  rim.position.copy(center).multiplyScalar(1 - rimScale);
  group.add(rim);

  // Y su brillo: un plano detrás del cuerpo con un degradado radial suave
  // (aditivo), en vez de un pase de bloom, para no cargar la GPU
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.55)");
  gradient.addColorStop(0.45, "rgba(139, 92, 246, 0.22)");
  gradient.addColorStop(0.75, "rgba(244, 63, 94, 0.07)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const glowTexture = track(new THREE.CanvasTexture(glowCanvas));
  const glowMaterial = track(new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  const glow = new THREE.Mesh(track(new THREE.PlaneGeometry(8.6, 5.4)), glowMaterial);
  glow.position.set(center.x, center.y, -0.9);
  group.add(glow);

  const front = depth / 2 + 0.16;
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
  // Abombados: media esfera aplastada sobre la cara
  addPart("face", [[0, 0.36], [0.36, 0], [0, -0.36], [-0.36, 0]].flatMap(([x, y]) => [
    {
      geometry: new THREE.CylinderGeometry(0.15, 0.15, 0.06, 32),
      position: [2.05 + x, 0.5 + y, front - 0.02],
      rotation: [Math.PI / 2, 0, 0]
    },
    {
      geometry: new THREE.SphereGeometry(0.15, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1),
      position: [2.05 + x, 0.5 + y, front + 0.02],
      rotation: [Math.PI / 2, 0, 0]
    }
  ]));

  // Cruceta, a la izquierda
  addPart("dpad", [
    { geometry: new THREE.BoxGeometry(0.74, 0.22, 0.12), position: [-2.05, 0.5, front] },
    { geometry: new THREE.BoxGeometry(0.22, 0.74, 0.12), position: [-2.05, 0.5, front] }
  ]);

  // Sticks: base y cabeza
  const stick = (x) => [
    { geometry: new THREE.CylinderGeometry(0.31, 0.34, 0.1, 40), position: [x, -0.42, front - 0.02], rotation: [Math.PI / 2, 0, 0] },
    { geometry: new THREE.SphereGeometry(0.23, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), position: [x, -0.42, front + 0.03], rotation: [Math.PI / 2, 0, 0] }
  ];
  // Simétricos, juntos abajo en el centro
  addPart("leftStick", stick(-0.78));
  addPart("rightStick", stick(0.78));

  // Panel táctil ancho arriba al centro, con una franja de luz a cada lado
  const pad = new THREE.ExtrudeGeometry(roundedRect(1.7, 0.95, 0.16), {
    depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3
  });
  addPart("touchpad", [
    { geometry: pad, position: [0, 0.78, front - 0.04] },
    ...[-1, 1].map((side) => ({
      geometry: new THREE.CapsuleGeometry(0.035, 0.7, 4, 12),
      position: [side * 0.98, 0.72, front - 0.01],
      rotation: [0, 0, side * 0.12]
    }))
  ]);

  // Botón central pequeño, entre el panel y los sticks
  addPart("home", [{
    geometry: new THREE.CylinderGeometry(0.11, 0.11, 0.06, 32),
    position: [0, 0.1, front],
    rotation: [Math.PI / 2, 0, 0]
  }]);

  // Gatillos superiores
  addPart("bumpers", [-1, 1].map((side) => ({
    geometry: new THREE.CapsuleGeometry(0.12, 0.95, 6, 16),
    position: [side * 1.95, 1.5, 0],
    rotation: [0, 0, Math.PI / 2]
  })));

  // Gatillos traseros, detrás de los superiores
  addPart("triggers", [-1, 1].map((side) => ({
    geometry: new THREE.BoxGeometry(0.7, 0.34, 0.36),
    position: [side * 1.95, 1.5, -0.32],
    rotation: [0.35, 0, 0]
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
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, -0.32, 9.9);

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
  group.rotation.x = FACING[0].x;
  scene.add(group);

  // flash: destello de luz al elegir una ficha (decae en ~0,6 s)
  const state = { selected: 0, pointerX: 0, pointerY: 0, target: FACING[0], pulse: 0, flash: 0 };
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
    const targetY = state.target.y + state.pointerX * 0.18;
    const targetX = state.target.x + state.pointerY * 0.1;
    state.flash = Math.max(0, state.flash - dt * 1.7);
    group.rotation.y += (targetY - group.rotation.y) * Math.min(dt * 5, 1);
    group.rotation.x += (targetX - group.rotation.x) * Math.min(dt * 5, 1);
    group.position.y = Math.sin(state.pulse * 1.2) * 0.08;
    paintParts(1.1 + Math.sin(state.pulse * 3) * 0.35 + state.flash * 2.2);
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
    paintParts(1.2);
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
      renderer.dispose();
    }
  };
};
