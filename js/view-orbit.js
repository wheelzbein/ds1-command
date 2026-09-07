/* OUTSIDE view — additive 2026-09-07. Do not change hologram/view3d.js. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const R = 6.4;

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
  });
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
  dish.addColorStop(0, "#4a1018");
  dish.addColorStop(0.18, "#2a2e33");
  dish.addColorStop(0.55, "#1a1d22");
  dish.addColorStop(0.82, "#4a5058");
  dish.addColorStop(1, "#6a7078");
  g.fillStyle = dish;
  g.beginPath();
  g.arc(dishCx, dishCy, dishR, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8a9098";
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = "rgba(196, 30, 58, 0.45)";
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

function makeStars() {
  const geo = new THREE.BufferGeometry();
  const n = 2800;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 90 + Math.random() * 160;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const b = 0.65 + Math.random() * 0.35;
    col[i * 3] = b;
    col[i * 3 + 1] = b;
    col[i * 3 + 2] = Math.min(1, b + 0.08);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.22, vertexColors: true, sizeAttenuation: true })
  );
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
    mat(0x14171c, { metalness: 0.45, roughness: 0.55 })
  );
  trench.rotation.x = Math.PI / 2;
  root.add(trench);

  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(R * 1.02, 0.018, 8, 96),
    mat(0xc9a227, { metalness: 0.8, roughness: 0.25, emissive: 0xc9a227, emissiveIntensity: 0.15 })
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
      color: 0x15181c,
      emissive: 0x3a0008,
      emissiveIntensity: 0.45,
      metalness: 0.4,
      roughness: 0.4,
      side: THREE.DoubleSide,
    })
  );
  bowl.rotation.x = -Math.PI / 2;
  dish.add(bowl);
  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 24),
    new THREE.MeshBasicMaterial({ color: 0xc41e3a, side: THREE.DoubleSide })
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
      emissive: 0x5ee7ff,
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
      color: 0x8aa0b0,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    })
  );
  root.add(atmo);
  root.userData.unitId = "vader";

  return root;
}

const WING_ACCENT = Object.freeze({
  officer: 0xc9a227,
  director: 0xe8e4dc,
  intel: 0xc41e3a,
  medical: 0xf2f2f2,
  trooper: 0x9aa3ad,
  crimson: 0xc41e3a,
});

function makeTie(kind) {
  const root = new THREE.Group();
  const accent = WING_ACCENT[kind] || 0x9aa3ad;
  const hull = mat(0x16191e, { metalness: 0.85, roughness: 0.22 });
  const dark = mat(0x0c0e12, { metalness: 0.7, roughness: 0.35 });
  const glass = mat(0x5ee7ff, {
    metalness: 0.9,
    roughness: 0.08,
    emissive: 0x163040,
    emissiveIntensity: 0.55,
    opacity: 0.88,
  });

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), hull);
  root.add(ball);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.112, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), glass);
  visor.rotation.x = Math.PI;
  visor.position.z = 0.03;
  root.add(visor);

  const pylonGeo = new THREE.BoxGeometry(0.46, 0.045, 0.045);
  const lp = new THREE.Mesh(pylonGeo, dark);
  lp.position.x = -0.36;
  const rp = new THREE.Mesh(pylonGeo, dark);
  rp.position.x = 0.36;
  root.add(lp, rp);

  const wingGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.038, 6);
  wingGeo.rotateZ(Math.PI / 2);
  const wingMat = mat(0x101318, { metalness: 0.55, roughness: 0.48 });
  const left = new THREE.Mesh(wingGeo, wingMat);
  left.position.x = -0.58;
  const right = new THREE.Mesh(wingGeo, wingMat);
  right.position.x = 0.58;
  root.add(left, right);

  const edgeGeo = new THREE.EdgesGeometry(wingGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: accent });
  const le = new THREE.LineSegments(edgeGeo, edgeMat);
  le.position.copy(left.position);
  const re = new THREE.LineSegments(edgeGeo, edgeMat);
  re.position.copy(right.position);
  root.add(le, re);

  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.03), dark);
  const ls = strut.clone();
  ls.position.x = -0.58;
  const rs = strut.clone();
  rs.position.x = 0.58;
  root.add(ls, rs);

  const engine = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 16),
    new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  engine.position.z = -0.175;
  root.add(engine);

  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.55, 8),
    new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.0 })
  );
  trail.rotation.x = Math.PI / 2;
  trail.position.z = -0.42;
  root.add(trail);

  root.userData.engine = engine;
  root.userData.trail = trail;
  root.userData.edges = [le, re];
  root.userData.flight = 0;
  return root;
}

function hangarSlot(i, n) {
  const cols = 4;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const z = R + 1.55;
  return new THREE.Vector3((col - (cols - 1) / 2) * 1.55, 0.45 + row * 1.05 - 0.15, z);
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

export function mountOrbit(container, sim) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x03050a, 0.012);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  camera.position.set(16, 7.5, 20);

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
  controls.minDistance = 10;
  controls.maxDistance = 48;
  controls.target.set(0, 0, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  scene.add(new THREE.AmbientLight(0x8899aa, 0.45));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.35);
  sun.position.set(40, 18, 22);
  sun.castShadow = true;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x5ee7ff, 0.28);
  rim.position.set(-20, -8, -16);
  scene.add(rim);
  const redFill = new THREE.PointLight(0xc41e3a, 0.55, 40);
  redFill.position.set(4, 3, 8);
  scene.add(redFill);

  scene.add(makeStars());

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
  const wing = sim.state.units.filter((u) => u.id !== "vader");
  wing.forEach((u, i) => {
    const mesh = makeTie(u.kind);
    mesh.scale.setScalar(1.7);
    mesh.userData.unitId = u.id;
    mesh.userData.spec = {
      radius: 9.2 + (i % 5) * 0.85,
      speed: 0.22 + (i % 4) * 0.05,
      tilt: ((i % 3) - 1) * 0.32,
      incline: ((i % 5) - 2) * 0.12,
      phase: (i / wing.length) * Math.PI * 2,
      wobble: 1.4 + (i % 3) * 0.2,
      amp: 0.55 + (i % 4) * 0.15,
      delay: i * 0.28,
    };
    mesh.userData.slot = hangarSlot(i, wing.length);
    const label = document.createElement("div");
    label.className = "world-tag";
    label.innerHTML = `<i class="dot live"></i>${u.callsign}`;
    const obj = new CSS2DObject(label);
    obj.position.set(0, 0.55, 0);
    mesh.add(obj);
    mesh.userData.label = label;
    label.addEventListener("click", () => sim.select(u.id));
    scene.add(mesh);
    fighters.push({ unit: u, mesh });
  });

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const objs = [station, ...fighters.map((f) => f.mesh)];
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

    station.rotation.y += dt * 0.04;
    const pulse = 0.35 + Math.sin(t * 2.2) * 0.2;
    station.userData.bowl.material.emissiveIntensity = pulse;
    station.userData.dishCore.material.color.setHex(sim.state.mode === "launch" ? 0xff4a63 : 0xc41e3a);
    station.userData.bay.material.emissiveIntensity = sim.state.mode === "launch" ? 0.95 : 0.4;

    const vader = sim.state.units.find((u) => u.id === "vader");
    gicosLabel.classList.toggle("selected", !!vader?.selected);

    const launching = sim.state.mode === "launch";

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
        mesh.userData.flight = Math.max(0, mesh.userData.flight - dt * rate);
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
      for (const edge of mesh.userData.edges) {
        edge.material.color.setHex(unit.selected ? 0x5ee7ff : (WING_ACCENT[live?.kind] || 0x9aa3ad));
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
