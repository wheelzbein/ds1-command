/* DESIGN LOCKED 2026-09-07. OUTSIDE look: navy sky, nebula, planet, green dish, twinkling white stars, Death Squadron. See DESIGN_LOCK.md */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const SPACE = Object.freeze({
  bg: 0x071428,
  fog: 0x081830,
  fogDensity: 0.0065,
  ambient: 0x6a7aa8,
  sun: 0xffe6c4,
  rim: 0xc45a8c,
  fill: 0x3a6aa0,
  nebulaPink: 0xd45a8a,
  nebulaViolet: 0x6a3a9a,
  nebulaBlue: 0x2a4a8c,
});

const STATION = Object.freeze({
  radius: 6.4,
  trench: 0x14171c,
  gold: 0xc9a227,
  dish: 0x3dff8a,
  dishLaunch: 0xb6ffd0,
  bay: 0x5ee7ff,
  atmo: 0x8aa0b0,
});

const SHIP = Object.freeze({
  hull: 0x8a9098,
  hullDark: 0x4a5058,
  hullDeep: 0x2a3036,
  panel: 0x6e747c,
  tower: 0x5a616a,
  globe: 0x9aa3ad,
  engine: 0x9ee7ff,
  interceptorHull: 0xf4f7fb,
  interceptorWing: 0xd8dee6,
  interceptorPylon: 0x6b7380,
  glass: 0x5ee7ff,
  glassEmissive: 0x163040,
});

const CAMERA = Object.freeze({
  fov: 42,
  x: 20,
  y: 9,
  z: 26,
  minDistance: 12,
  maxDistance: 72,
  autoRotateSpeed: 0.22,
});

const SQUADRON = Object.freeze({
  tarkin: Object.freeze({ klass: "executor", label: "EXECUTOR" }),
  krennic: Object.freeze({ klass: "isd", label: "CHIMAERA", variant: "ii" }),
  piett: Object.freeze({ klass: "isd", label: "DEVASTATOR", variant: "i" }),
  veers: Object.freeze({ klass: "isd", label: "AVENGER", variant: "ii" }),
  motti: Object.freeze({ klass: "lancer", label: "LANCER" }),
  surgeon: Object.freeze({ klass: "carrack", label: "CARRACK" }),
  yularen: Object.freeze({ klass: "interceptor", label: null }),
  jerjerrod: Object.freeze({ klass: "interceptor", label: null }),
  tk421: Object.freeze({ klass: "interceptor", label: null }),
  hangar: Object.freeze({ klass: "interceptor", label: null }),
  crimson: Object.freeze({ klass: "interceptor", label: null }),
});

const R = STATION.radius;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.35,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity != null && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    map: opts.map ?? null,
  });
}

function makeHullMap(hex, seed, line = "rgba(18, 22, 28, 0.38)") {
  const w = 512;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = hex;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = line;
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 14) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = 0; y < h; y += 9) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 90; i++) {
    const v = 70 + rnd() * 50;
    g.fillStyle = `rgba(${v},${v + 4},${v + 8},${0.12 + rnd() * 0.2})`;
    g.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 28, 4 + rnd() * 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wedgeGeometry(length, width, thickness, arrow = 0) {
  const shape = new THREE.Shape();
  const n = length / 2;
  if (arrow > 0) {
    const t = length * arrow;
    shape.moveTo(0, n);
    shape.lineTo(width * 0.11, n - t);
    shape.lineTo(width / 2, -n);
    shape.lineTo(-width / 2, -n);
    shape.lineTo(-width * 0.11, n - t);
  } else {
    shape.moveTo(0, n);
    shape.lineTo(width / 2, -n);
    shape.lineTo(-width / 2, -n);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.16,
    bevelSize: Math.min(width * 0.045, 0.08),
    bevelSegments: 2,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, thickness * 0.55, 0);
  return geo;
}

function makeDeathStarTexture() {
  const w = 2048;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");

  g.fillStyle = "#6e7378";
  g.fillRect(0, 0, w, h);

  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = 90 + Math.random() * 50;
    g.fillStyle = `rgba(${v},${v + 2},${v + 4},${0.12 + Math.random() * 0.22})`;
    g.fillRect(x, y, 2 + Math.random() * 6, 1 + Math.random() * 3);
  }

  g.strokeStyle = "rgba(28, 32, 36, 0.55)";
  g.lineWidth = 1;
  const meridians = 72;
  const parallels = 36;
  for (let i = 0; i <= meridians; i++) {
    const x = (i / meridians) * w;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let j = 0; j <= parallels; j++) {
    const y = (j / parallels) * h;
    g.lineWidth = j === parallels / 2 ? 0 : 1;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }

  g.fillStyle = "#1c1f24";
  g.fillRect(0, h / 2 - 22, w, 44);
  g.fillStyle = "#3a4048";
  g.fillRect(0, h / 2 - 7, w, 14);
  g.strokeStyle = "rgba(201, 162, 39, 0.18)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, h / 2);
  g.lineTo(w, h / 2);
  g.stroke();

  const dishCx = w * 0.31;
  const dishCy = h * 0.34;
  const dishR = h * 0.145;
  const dish = g.createRadialGradient(dishCx, dishCy, dishR * 0.08, dishCx, dishCy, dishR);
  dish.addColorStop(0, "#1c5a32");
  dish.addColorStop(0.18, "#163024");
  dish.addColorStop(0.55, "#1a2a22");
  dish.addColorStop(0.82, "#4a5850");
  dish.addColorStop(1, "#6a7078");
  g.fillStyle = dish;
  g.beginPath();
  g.arc(dishCx, dishCy, dishR, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8a9098";
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = "rgba(61, 255, 138, 0.5)";
  g.lineWidth = 2;
  for (let i = 1; i <= 5; i++) {
    g.beginPath();
    g.arc(dishCx, dishCy, dishR * (i / 6), 0, Math.PI * 2);
    g.stroke();
  }

  g.fillStyle = "#05070a";
  g.fillRect(w * 0.72, h / 2 - 16, 70, 32);
  g.fillStyle = "rgba(94, 231, 255, 0.35)";
  g.fillRect(w * 0.725, h / 2 - 10, 60, 20);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNebulaTexture() {
  const w = 2048;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#071428";
  g.fillRect(0, 0, w, h);

  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0c1c3c");
  sky.addColorStop(0.45, "#071428");
  sky.addColorStop(1, "#050d1c");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  function blob(x, y, r, rgba) {
    const grd = g.createRadialGradient(x, y, r * 0.05, x, y, r);
    grd.addColorStop(0, rgba);
    grd.addColorStop(1, "rgba(7,20,40,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  g.globalCompositeOperation = "lighter";
  blob(w * 0.22, h * 0.38, 480, "rgba(200, 70, 130, 0.62)");
  blob(w * 0.18, h * 0.55, 320, "rgba(140, 50, 170, 0.48)");
  blob(w * 0.78, h * 0.28, 400, "rgba(80, 60, 180, 0.52)");
  blob(w * 0.62, h * 0.18, 280, "rgba(50, 100, 190, 0.42)");
  blob(w * 0.48, h * 0.42, 240, "rgba(220, 100, 70, 0.28)");
  blob(w * 0.88, h * 0.62, 340, "rgba(180, 55, 120, 0.36)");
  blob(w * 0.35, h * 0.22, 220, "rgba(110, 80, 200, 0.34)");
  g.globalCompositeOperation = "source-over";

  for (let i = 0; i < 900; i++) {
    const a = 0.015 + Math.random() * 0.04;
    g.fillStyle = `rgba(220,200,255,${a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlanetTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#16384a";
  g.fillRect(0, 0, w, h);

  const sea = g.createLinearGradient(0, 0, w, h);
  sea.addColorStop(0, "#1a4660");
  sea.addColorStop(1, "#0e2a38");
  g.fillStyle = sea;
  g.fillRect(0, 0, w, h);

  function land(x, y, rx, ry, color) {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, Math.random() * 1.2, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 18; i++) {
    land(
      Math.random() * w,
      Math.random() * h,
      40 + Math.random() * 90,
      22 + Math.random() * 50,
      i % 3 === 0 ? "#3d6a3a" : i % 3 === 1 ? "#6a7a3a" : "#2f5534"
    );
  }
  g.globalAlpha = 0.28;
  for (let i = 0; i < 12; i++) {
    land(Math.random() * w, Math.random() * h, 80 + Math.random() * 120, 12 + Math.random() * 18, "#d8e8f0");
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeStars() {
  const geo = new THREE.BufferGeometry();
  const n = 3800;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = 95 + Math.random() * 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const b = 0.82 + Math.random() * 0.18;
    col[i * 3] = b;
    col[i * 3 + 1] = b;
    col[i * 3 + 2] = b;
    phase[i] = Math.random() * Math.PI * 2;
        size[i] = 1.6 + Math.random() * 3.2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixel: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixel;
      attribute float aPhase;
      attribute float aSize;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vColor = color;
        float tw = 0.42 + 0.58 * abs(sin(uTime * 2.4 + aPhase) * sin(uTime * 1.15 + aPhase * 1.7));
        vTwinkle = tw;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * tw * uPixel * (280.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = length(p);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 1.6);
        gl_FragColor = vec4(vColor, glow * vTwinkle);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.userData.material = material;
  return points;
}

function makeDeathStar() {
  const root = new THREE.Group();
  const tex = makeDeathStarTexture();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.28,
      color: 0xffffff,
    })
  );
  ball.castShadow = true;
  ball.receiveShadow = true;
  ball.userData.unitId = "vader";
  root.add(ball);

  const trench = new THREE.Mesh(
    new THREE.TorusGeometry(R * 0.995, 0.09, 10, 128),
    mat(STATION.trench, { metalness: 0.45, roughness: 0.55 })
  );
  trench.rotation.x = Math.PI / 2;
  root.add(trench);

  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(R * 1.02, 0.018, 8, 96),
    mat(STATION.gold, { metalness: 0.8, roughness: 0.25, emissive: STATION.gold, emissiveIntensity: 0.15 })
  );
  goldRing.rotation.x = Math.PI / 2;
  root.add(goldRing);

  const lat = THREE.MathUtils.degToRad(28);
  const lon = THREE.MathUtils.degToRad(22);
  const dir = new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon)
  );
  const dish = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.07, 10, 48),
    mat(0x5a616a, { metalness: 0.7, roughness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  dish.add(rim);
  const bowl = new THREE.Mesh(
    new THREE.CircleGeometry(1.52, 48),
    new THREE.MeshStandardMaterial({
      color: 0x163024,
      emissive: 0x145a32,
      emissiveIntensity: 0.7,
      metalness: 0.35,
      roughness: 0.38,
      side: THREE.DoubleSide,
    })
  );
  bowl.rotation.x = -Math.PI / 2;
  dish.add(bowl);
  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 24),
    new THREE.MeshBasicMaterial({ color: STATION.dish, side: THREE.DoubleSide })
  );
  core.rotation.x = -Math.PI / 2;
  core.position.y = 0.02;
  dish.add(core);
  dish.position.copy(dir.clone().multiplyScalar(R * 0.97));
  dish.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  root.add(dish);
  root.userData.dishCore = core;
  root.userData.bowl = bowl;

  const bay = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.62, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x05070a,
      emissive: STATION.bay,
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.4,
    })
  );
  bay.position.set(0, 0.08, R * 0.99);
  root.add(bay);
  root.userData.bay = bay;

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.035, 48, 32),
    new THREE.MeshBasicMaterial({
      color: STATION.atmo,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    })
  );
  root.add(atmo);
  root.userData.unitId = "vader";

  return root;
}

function addEngines(root, z, positions, radius) {
  const engines = [];
  for (const [x, y] of positions) {
    const eng = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 16),
      new THREE.MeshBasicMaterial({ color: SHIP.engine, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    eng.position.set(x, y, z);
    root.add(eng);
    engines.push(eng);
  }
  return engines;
}

function makeExecutor() {
  const root = new THREE.Group();
  const map = makeHullMap("#8a9098", 17);
  const hull = new THREE.Mesh(
    wedgeGeometry(11.2, 2.05, 0.42, 0.22),
    mat(SHIP.hull, { map, metalness: 0.55, roughness: 0.42 })
  );
  hull.castShadow = true;
  hull.receiveShadow = true;
  root.add(hull);

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.28, 8.4),
    mat(SHIP.panel, { metalness: 0.5, roughness: 0.4 })
  );
  ridge.position.set(0, 0.58, -0.4);
  root.add(ridge);

  for (let i = 0; i < 10; i++) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.55 + (i % 3) * 0.08, 0.16, 0.55),
      mat(i % 2 ? SHIP.hullDark : SHIP.tower, { metalness: 0.45, roughness: 0.5 })
    );
    block.position.set(((i % 2) * 2 - 1) * 0.22, 0.72, 3.2 - i * 0.78);
    root.add(block);
  }

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.55), mat(SHIP.tower, { metalness: 0.5, roughness: 0.35 }));
  tower.position.set(0, 1.12, -3.55);
  root.add(tower);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.42), mat(SHIP.hullDark));
  cap.position.set(0, 1.5, -3.55);
  root.add(cap);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(SHIP.globe, { metalness: 0.8, roughness: 0.2 }));
  globe.position.set(0, 1.62, -3.42);
  root.add(globe);

  const engines = addEngines(root, -5.62, [
    [0, 0.28], [-0.32, 0.18], [0.32, 0.18], [-0.18, 0.42], [0.18, 0.42],
    [-0.5, 0.22], [0.5, 0.22], [0, 0.08],
  ], 0.09);
  root.userData.engines = engines;
  root.userData.labelY = 1.85;
  return root;
}

function makeStarDestroyer(variant) {
  const root = new THREE.Group();
  const map = makeHullMap(variant === "i" ? "#7e848c" : "#9098a0", variant === "i" ? 31 : 53);
  const hull = new THREE.Mesh(
    wedgeGeometry(2.95, 1.55, 0.32, 0),
    mat(SHIP.hull, { map, metalness: 0.52, roughness: 0.44 })
  );
  hull.castShadow = true;
  hull.receiveShadow = true;
  root.add(hull);

  const city = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 1.35), mat(SHIP.panel));
  city.position.set(0, 0.42, -0.15);
  root.add(city);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.32), mat(SHIP.tower, { metalness: 0.5, roughness: 0.35 }));
  tower.position.set(0, 0.68, -0.92);
  root.add(tower);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.18), mat(SHIP.hullDark));
  bridge.position.set(0, 0.9, -0.92);
  root.add(bridge);

  if (variant === "ii") {
    const lg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(SHIP.globe, { metalness: 0.85, roughness: 0.18 }));
    const rg = lg.clone();
    lg.position.set(-0.09, 0.98, -0.86);
    rg.position.set(0.09, 0.98, -0.86);
    root.add(lg, rg);
  } else {
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.55), mat(SHIP.hullDeep));
    notch.position.set(0, 0.08, 0.15);
    root.add(notch);
  }

  const engines = addEngines(root, -1.5, [[0, 0.18], [-0.22, 0.16], [0.22, 0.16]], 0.08);
  root.userData.engines = engines;
  root.userData.labelY = 1.15;
  return root;
}

function makeLancer() {
  const root = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.22, 1.55),
    mat(SHIP.hull, { map: makeHullMap("#858b93", 71), metalness: 0.5, roughness: 0.46 })
  );
  hull.castShadow = true;
  root.add(hull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 6), mat(SHIP.panel));
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.02, 0.92);
  root.add(nose);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.2), mat(SHIP.tower));
  tower.position.set(0, 0.22, 0.18);
  root.add(tower);
  for (let i = 0; i < 8; i++) {
    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), mat(SHIP.hullDark, { metalness: 0.7 }));
    gun.position.set(((i % 2) * 2 - 1) * 0.2, 0.16, 0.55 - i * 0.16);
    root.add(gun);
  }
  const engines = addEngines(root, -0.8, [[0, 0.04], [-0.1, 0.04], [0.1, 0.04]], 0.045);
  root.userData.engines = engines;
  root.userData.labelY = 0.55;
  return root;
}

function makeCarrack() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.85, 6, 12),
    mat(SHIP.hull, { map: makeHullMap("#7a828c", 91), metalness: 0.48, roughness: 0.5 })
  );
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  root.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), mat(SHIP.panel));
  head.position.set(0, 0.08, 0.55);
  root.add(head);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.5), mat(SHIP.hullDark));
  const wingR = wingL.clone();
  wingL.position.set(-0.22, 0.02, -0.05);
  wingR.position.set(0.22, 0.02, -0.05);
  root.add(wingL, wingR);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.16), mat(SHIP.tower));
  tower.position.set(0, 0.24, 0.12);
  root.add(tower);
  const engines = addEngines(root, -0.62, [[0, 0.02], [-0.12, 0.02], [0.12, 0.02]], 0.05);
  root.userData.engines = engines;
  root.userData.labelY = 0.5;
  return root;
}

function makeInterceptor() {
  const root = new THREE.Group();
  const hull = mat(SHIP.interceptorHull, {
    map: makeHullMap("#f4f7fb", 11, "rgba(50, 58, 68, 0.72)"),
    metalness: 0.04,
    roughness: 0.72,
    emissive: 0xe8eef4,
    emissiveIntensity: 0.62,
  });
  const dark = mat(SHIP.interceptorPylon, {
    metalness: 0.12,
    roughness: 0.55,
    emissive: 0x3a424c,
    emissiveIntensity: 0.28,
  });
  const glass = mat(SHIP.glass, {
    metalness: 0.9,
    roughness: 0.08,
    emissive: SHIP.glassEmissive,
    emissiveIntensity: 0.55,
    opacity: 0.88,
  });

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), hull);
  root.add(ball);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), glass);
  visor.rotation.x = Math.PI;
  visor.position.z = 0.025;
  root.add(visor);

  const pylonGeo = new THREE.BoxGeometry(0.42, 0.04, 0.04);
  const lp = new THREE.Mesh(pylonGeo, dark);
  lp.position.x = -0.32;
  const rp = new THREE.Mesh(pylonGeo, dark);
  rp.position.x = 0.32;
  root.add(lp, rp);

  function bladeGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.48);
    shape.lineTo(0.08, 0.06);
    shape.lineTo(0.72, 0.02);
    shape.lineTo(0.8, 0);
    shape.lineTo(0.72, -0.02);
    shape.lineTo(0.08, -0.06);
    shape.lineTo(0, -0.48);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: false });
    geo.translate(0, 0, -0.027);
    return geo;
  }
  const wingMat = mat(SHIP.interceptorWing, {
    map: makeHullMap("#d8dee6", 23, "rgba(28, 34, 42, 0.88)"),
    metalness: 0.04,
    roughness: 0.78,
    emissive: 0xcfd6de,
    emissiveIntensity: 0.58,
    side: THREE.DoubleSide,
  });
  const left = new THREE.Mesh(bladeGeo(), wingMat);
  left.position.x = -0.52;
  left.rotation.y = Math.PI;
  const right = new THREE.Mesh(bladeGeo(), wingMat);
  right.position.x = 0.52;
  root.add(left, right);

  const engine = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 16),
    new THREE.MeshBasicMaterial({ color: SHIP.engine, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  engine.position.z = -0.16;
  root.add(engine);
  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.5, 8),
    new THREE.MeshBasicMaterial({ color: SHIP.engine, transparent: true, opacity: 0.0 })
  );
  trail.rotation.x = Math.PI / 2;
  trail.position.z = -0.4;
  root.add(trail);

  root.userData.engine = engine;
  root.userData.trail = trail;
  root.userData.engines = [engine];
  root.userData.labelY = 0.52;
  root.userData.flight = 0;
  return root;
}

function makeShip(spec) {
  if (spec.klass === "executor") return makeExecutor();
  if (spec.klass === "isd") return makeStarDestroyer(spec.variant);
  if (spec.klass === "lancer") return makeLancer();
  if (spec.klass === "carrack") return makeCarrack();
  return makeInterceptor();
}

function hangarSlot(i) {
  const cols = 4;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return new THREE.Vector3((col - (cols - 1) / 2) * 1.55, 0.45 + row * 1.05 - 0.15, R + 1.55);
}

function orbitPoint(t, spec) {
  const a = spec.phase + t * spec.speed;
  const x = Math.cos(a) * spec.radius;
  const z = Math.sin(a) * spec.radius;
  const y = Math.sin(a * spec.wobble + spec.phase) * spec.amp;
  const v = new THREE.Vector3(x, y, z);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), spec.incline);
  v.applyAxisAngle(new THREE.Vector3(0, 0, 1), spec.tilt);
  return v;
}

const CAPITAL_STATIONS = Object.freeze({
  tarkin: {
    parked: [-12.4, 1.35, 1.8],
    launched: [-20.5, 2.8, 7.5],
    heading: [0.15, 0, 1],
  },
  krennic: {
    parked: [10.6, 0.9, 3.4],
    launched: [17.8, 2.1, 6.2],
    heading: [0.05, 0, 1],
  },
  piett: {
    parked: [8.2, -0.8, -8.6],
    launched: [14.5, -1.6, -15.2],
    heading: [0.2, 0.05, 1],
  },
  veers: {
    parked: [-8.4, 1.4, -9.2],
    launched: [-13.8, 3.4, -16.4],
    heading: [-0.1, 0.04, 1],
  },
  motti: {
    parked: [4.4, 0.55, 8.2],
    launched: [9.2, 1.2, 14.4],
    heading: [0.1, 0, 1],
  },
  surgeon: {
    parked: [-4.2, 0.4, 8.6],
    launched: [-8.4, 0.8, 15.1],
    heading: [0.08, 0, 1],
  },
});

export function mountOrbit(container, sim) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SPACE.bg);
  scene.fog = new THREE.FogExp2(SPACE.fog, SPACE.fogDensity);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 420);
  camera.position.set(CAMERA.x, CAMERA.y, CAMERA.z);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "label-layer";
  container.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = CAMERA.minDistance;
  controls.maxDistance = CAMERA.maxDistance;
  controls.target.set(0, 0, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = CAMERA.autoRotateSpeed;

  scene.add(new THREE.AmbientLight(SPACE.ambient, 0.42));
  const sun = new THREE.DirectionalLight(SPACE.sun, 1.28);
  sun.position.set(48, 22, 16);
  sun.castShadow = true;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(SPACE.rim, 0.38);
  rim.position.set(-28, 6, -18);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(SPACE.fill, 0.22);
  fill.position.set(8, -12, 20);
  scene.add(fill);
  const dishLight = new THREE.PointLight(STATION.dish, 0.55, 28);
  dishLight.position.set(3.2, 3.4, 4.6);
  scene.add(dishLight);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(210, 48, 32),
    new THREE.MeshBasicMaterial({ map: makeNebulaTexture(), side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  const stars = makeStars();
  scene.add(stars);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(18.5, 64, 48),
    new THREE.MeshStandardMaterial({
      map: makePlanetTexture(),
      roughness: 0.92,
      metalness: 0.04,
    })
  );
  planet.position.set(-36, -22, -46);
  planet.rotation.y = 0.6;
  scene.add(planet);
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(19.6, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x6ec8ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      fog: false,
    })
  );
  planet.add(atmo);

  const station = makeDeathStar();
  scene.add(station);

  const gicosLabel = document.createElement("div");
  gicosLabel.className = "world-tag";
  gicosLabel.innerHTML = `<i class="dot live"></i>GICOS`;
  const gicosObj = new CSS2DObject(gicosLabel);
  gicosObj.position.set(0, R + 0.9, 0);
  station.add(gicosObj);
  gicosLabel.addEventListener("click", () => sim.select("vader"));

  const fighters = [];
  const capitals = [];
  const wing = sim.state.units.filter((u) => u.id !== "vader");
  let interceptorIndex = 0;

  wing.forEach((u) => {
    const spec = SQUADRON[u.id] || { klass: "interceptor", label: null };
    const mesh = makeShip(spec);
    mesh.userData.unitId = u.id;
    mesh.userData.klass = spec.klass;
    const tag = spec.label || u.callsign;
    const label = document.createElement("div");
    label.className = "world-tag";
    label.innerHTML = `<i class="dot live"></i>${tag}`;
    const obj = new CSS2DObject(label);
    obj.position.set(0, mesh.userData.labelY || 0.55, 0);
    mesh.add(obj);
    mesh.userData.label = label;
    label.addEventListener("click", () => sim.select(u.id));
    scene.add(mesh);

    if (spec.klass === "interceptor") {
      const i = interceptorIndex++;
      mesh.scale.setScalar(3.15);
      mesh.userData.spec = {
        radius: 9.2 + (i % 5) * 0.85,
        speed: 0.28 + (i % 4) * 0.06,
        tilt: ((i % 3) - 1) * 0.32,
        incline: ((i % 5) - 2) * 0.12,
        phase: (i / 4) * Math.PI * 2,
        wobble: 1.4 + (i % 3) * 0.2,
        amp: 0.55 + (i % 4) * 0.15,
        delay: i * 0.28,
      };
      mesh.userData.slot = hangarSlot(i);
      mesh.userData.flight = 0.55;
      fighters.push({ unit: u, mesh });
    } else {
      const stationSpec = CAPITAL_STATIONS[u.id];
      mesh.userData.parked = new THREE.Vector3(...stationSpec.parked);
      mesh.userData.launched = new THREE.Vector3(...stationSpec.launched);
      mesh.userData.heading = new THREE.Vector3(...stationSpec.heading).normalize();
      mesh.userData.flight = 0;
      mesh.position.copy(mesh.userData.parked);
      mesh.lookAt(mesh.position.clone().add(mesh.userData.heading));
      capitals.push({ unit: u, mesh });
    }
  });

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const objs = [station, ...fighters.map((f) => f.mesh), ...capitals.map((f) => f.mesh)];
    const hits = ray.intersectObjects(objs, true);
    if (!hits.length) return;
    let o = hits[0].object;
    while (o && !o.userData.unitId) o = o.parent;
    if (o?.userData.unitId) sim.select(o.userData.unitId);
  });

  function resize() {
    const w = container.clientWidth;
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stars.userData.material.uniforms.uPixel.value = Math.min(window.devicePixelRatio || 1, 2);
  }
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let running = true;
  const tmp = new THREE.Vector3();
  const look = new THREE.Vector3();

  function render() {
    if (!running) return;
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    controls.update();

    stars.userData.material.uniforms.uTime.value = t;
    sky.rotation.y = t * 0.003;
    planet.rotation.y += dt * 0.015;

    station.rotation.y += dt * 0.04;
    const pulse = 0.55 + Math.sin(t * 2.2) * 0.25;
    station.userData.bowl.material.emissiveIntensity = pulse;
    station.userData.dishCore.material.color.setHex(sim.state.mode === "launch" ? STATION.dishLaunch : STATION.dish);
    station.userData.bay.material.emissiveIntensity = sim.state.mode === "launch" ? 0.95 : 0.4;
    dishLight.intensity = sim.state.mode === "launch" ? 1.15 : 0.55;

    const vader = sim.state.units.find((u) => u.id === "vader");
    gicosLabel.classList.toggle("selected", !!vader?.selected);

    const launching = sim.state.mode === "launch";

    for (const { unit, mesh } of capitals) {
      const rate = launching ? 0.28 : 0.42;
      if (launching) mesh.userData.flight = Math.min(1, mesh.userData.flight + dt * rate);
      else mesh.userData.flight = Math.max(0, mesh.userData.flight - dt * rate);
      const f = mesh.userData.flight;
      const ease = f * f * (3 - 2 * f);
      tmp.lerpVectors(mesh.userData.parked, mesh.userData.launched, ease);
      mesh.position.copy(tmp);
      look.copy(mesh.position).add(mesh.userData.heading);
      mesh.lookAt(look);
      const glow = 0.55 + ease * 0.4;
      for (const eng of mesh.userData.engines || []) eng.material.opacity = glow;
      const label = mesh.userData.label;
      label.classList.toggle("selected", unit.selected);
      const live = sim.state.units.find((x) => x.id === unit.id);
      const dot = label.querySelector(".dot");
      if (live && dot) {
        dot.className = "dot " + (live.status === "SORTIE" ? "live" : live.status === "NAP" ? "away" : "idle");
      }
    }

    for (const { unit, mesh } of fighters) {
      const spec = mesh.userData.spec;
      const rate = launching ? 0.38 : 0.5;
      if (launching) {
        if (mesh.userData.launchT == null) mesh.userData.launchT = t;
        const elapsed = t - mesh.userData.launchT;
        const ready = elapsed >= spec.delay || mesh.userData.flight > 0.01;
        if (ready) mesh.userData.flight = Math.min(1, mesh.userData.flight + dt * rate);
      } else {
        mesh.userData.launchT = null;
        mesh.userData.flight = Math.max(0.42, mesh.userData.flight - dt * rate);
      }
      const f = mesh.userData.flight;
      const ease = f * f * (3 - 2 * f);
      const parked = mesh.userData.slot.clone();
      parked.applyAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation.y);
      const air = orbitPoint(t, spec);
      tmp.lerpVectors(parked, air, ease);
      mesh.position.copy(tmp);

      if (ease > 0.08) {
        const next = orbitPoint(t + 0.05, spec);
        look.copy(next).sub(air).normalize();
        if (look.lengthSq() > 0.0001) {
          mesh.lookAt(mesh.position.x + look.x, mesh.position.y + look.y, mesh.position.z + look.z);
        }
      } else {
        mesh.lookAt(0, 0.2, 0);
        mesh.rotateY(Math.PI);
      }

      const glow = ease;
      mesh.userData.engine.material.opacity = 0.15 + glow * 0.85;
      mesh.userData.trail.material.opacity = glow * 0.42;
      mesh.userData.trail.scale.set(1, 0.4 + glow * 1.4, 1);

      const label = mesh.userData.label;
      label.classList.toggle("selected", unit.selected);
      const live = sim.state.units.find((x) => x.id === unit.id);
      const dot = label.querySelector(".dot");
      if (live && dot) {
        dot.className = "dot " + (live.status === "SORTIE" ? "live" : live.status === "NAP" ? "away" : "idle");
      }
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  function dispose() {
    running = false;
    window.removeEventListener("resize", resize);
    renderer.dispose();
    container.innerHTML = "";
  }

  return { render, resize, dispose };
}
