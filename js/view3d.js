/* DESIGN LOCKED 2026-09-07. Hologram look, lighting, and unit palettes are frozen. See DESIGN_LOCK.md */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { ROOMS } from "./roster.js?v=swarm15";

function toWorld(nx, ny) {
  return new THREE.Vector3((nx - 0.5) * 32, 0, (ny - 0.5) * 22);
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.35,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.opacity,
    opacity: opts.opacity ?? 1,
  });
}

function box(w, h, d, material, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function makeCrestTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#14171c";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c9a227";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(256, 256, 210, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(256, 256, 70, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    g.beginPath();
    g.moveTo(256 + Math.cos(a) * 80, 256 + Math.sin(a) * 80);
    g.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function makeScreenTexture(seed) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  function paint(t) {
    ctx.fillStyle = "#031018";
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = "#5ee7ff";
    ctx.font = "12px monospace";
    const lines = ["SECTOR CLEAR", "SUPERLASER STBY", "REACTOR 1.00", "NO REBELS", "GICOS LINK OK", "AUTH: TARKIN"];
    for (let i = 0; i < 8; i++) {
      const y = ((i * 18 + t * 22 + seed * 40) % 160);
      ctx.globalAlpha = 0.55 + (i % 3) * 0.15;
      ctx.fillText(lines[(i + seed) % lines.length], 10, y);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#c41e3a";
    ctx.strokeRect(4, 4, 248, 152);
    tex.needsUpdate = true;
  }
  paint(0);
  tex.userData.paint = paint;
  return tex;
}

function makePerson(kind) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const legs = new THREE.Group();
  root.add(body);
  root.add(legs);

  const palettes = Object.freeze({
    darklord: Object.freeze({ armor: 0x111111, accent: 0x3a0000, visor: 0x220000, cape: 0x0a0a0a }),
    officer: Object.freeze({ armor: 0x4a5340, accent: 0xc9a227, visor: 0x1a1a1a, cape: 0x2a3328 }),
    director: Object.freeze({ armor: 0xe8e4dc, accent: 0x111111, visor: 0x1a1a1a, cape: 0x111111 }),
    intel: Object.freeze({ armor: 0xd9d4c8, accent: 0xc41e3a, visor: 0x1a1a1a, cape: 0xd0cbbf }),
    medical: Object.freeze({ armor: 0xf2f2f2, accent: 0xc41e3a, visor: 0x111111, cape: 0xeaeaea }),
    trooper: Object.freeze({ armor: 0xf4f4f4, accent: 0x111111, visor: 0x111111, cape: 0xf4f4f4 }),
    crimson: Object.freeze({ armor: 0x8b0e1a, accent: 0xc9a227, visor: 0x1a0505, cape: 0x7a0c16 }),
  });
  const p = palettes[kind] || palettes.trooper;
  const armor = mat(p.armor, { roughness: 0.4, metalness: 0.45 });
  const dark = mat(0x111111, { roughness: 0.5, metalness: 0.2 });
  const visor = mat(p.visor, { roughness: 0.15, metalness: 0.8, emissive: kind === "darklord" ? 0x550000 : 0x000000, emissiveIntensity: kind === "darklord" ? 0.6 : 0 });
  const accent = mat(p.accent, { roughness: 0.4, metalness: 0.5 });

  // legs
  const lLeg = box(0.22, 0.7, 0.22, armor, -0.13, 0.35, 0, legs);
  const rLeg = box(0.22, 0.7, 0.22, armor, 0.13, 0.35, 0, legs);
  box(0.24, 0.12, 0.28, dark, -0.13, 0.06, 0.02, legs);
  box(0.24, 0.12, 0.28, dark, 0.13, 0.06, 0.02, legs);
  lLeg.name = "lLeg";
  rLeg.name = "rLeg";

  // torso
  box(0.62, 0.72, 0.36, armor, 0, 1.05, 0, body);
  box(0.5, 0.18, 0.22, accent, 0, 1.18, 0.18, body);
  if (kind === "trooper" || kind === "medical") {
    box(0.28, 0.16, 0.1, dark, 0, 1.02, 0.2, body);
  }
  if (kind === "officer" || kind === "director" || kind === "intel") {
    box(0.28, 0.08, 0.04, mat(0xc41e3a), -0.12, 1.22, 0.2, body);
    box(0.28, 0.08, 0.04, mat(0x3a6ea5), -0.12, 1.13, 0.2, body);
  }
  if (kind === "medical") {
    box(0.16, 0.05, 0.05, mat(0xc41e3a), 0.18, 1.28, 0.2, body);
    box(0.05, 0.16, 0.05, mat(0xc41e3a), 0.18, 1.28, 0.2, body);
  }

  const lArm = box(0.16, 0.62, 0.16, armor, -0.42, 1.0, 0, body);
  const rArm = box(0.16, 0.62, 0.16, armor, 0.42, 1.0, 0, body);
  lArm.name = "lArm";
  rArm.name = "rArm";

  // helmet / head
  if (kind === "officer" || kind === "director" || kind === "intel") {
    box(0.28, 0.32, 0.26, mat(0xc4a882), 0, 1.58, 0.02, body);
    box(0.42, 0.12, 0.42, armor, 0, 1.74, 0, body);
    box(0.42, 0.08, 0.18, dark, 0, 1.68, 0.16, body);
  } else if (kind === "darklord") {
    box(0.4, 0.38, 0.38, dark, 0, 1.62, 0.02, body);
    box(0.34, 0.12, 0.06, visor, 0, 1.64, 0.2, body);
    box(0.22, 0.16, 0.08, dark, 0, 1.5, 0.2, body);
    const cape = box(0.85, 1.35, 0.06, mat(p.cape, { roughness: 0.85, metalness: 0.05 }), 0, 1.0, -0.28, body);
    cape.name = "cape";
  } else if (kind === "crimson") {
    box(0.34, 0.36, 0.34, armor, 0, 1.7, 0, body);
    box(0.28, 0.08, 0.06, visor, 0, 1.7, 0.18, body);
    const cape = box(0.9, 1.6, 0.08, armor, 0, 1.05, -0.22, body);
    cape.name = "cape";
    box(0.06, 1.7, 0.06, mat(0xc0c0c0, { metalness: 0.8 }), 0.38, 1.0, 0.12, body);
  } else {
    // trooper helmet
    box(0.44, 0.36, 0.4, armor, 0, 1.64, 0.02, body);
    box(0.38, 0.1, 0.08, visor, 0, 1.64, 0.2, body);
    box(0.12, 0.08, 0.1, armor, -0.26, 1.58, 0.08, body);
    box(0.12, 0.08, 0.1, armor, 0.26, 1.58, 0.08, body);
  }

  root.userData = { body, legs, lLeg, rLeg, lArm, rArm, kind };
  return root;
}

function wall(parent, x, y, z, w, h, d, material) {
  return box(w, h, d, material, x, y, z, parent);
}

export function mount3D(container, sim) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.Fog(0x05070a, 28, 70);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "label-layer";
  container.appendChild(labelRenderer.domElement);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
  camera.position.set(18, 16, 18);
  camera.lookAt(0, 0.4, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minPolarAngle = 0.55;
  controls.maxZoom = 4;
  controls.minZoom = 0.6;
  controls.target.set(0, 0.4, 0);

  scene.add(new THREE.HemisphereLight(0x9bb7c9, 0x1a1210, 0.55));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.15);
  key.position.set(10, 16, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -22;
  key.shadow.camera.right = 22;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  scene.add(key);
  const red = new THREE.PointLight(0xc41e3a, 18, 28, 2);
  red.position.set(8, 3, -6);
  scene.add(red);
  const cyan = new THREE.PointLight(0x5ee7ff, 12, 22, 2);
  cyan.position.set(-6, 2.4, 1);
  scene.add(cyan);

  const deck = new THREE.Group();
  scene.add(deck);

  const floorMat = mat(0x1a1d22, { roughness: 0.35, metalness: 0.55 });
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(34, 0.2, 24), floorMat);
  floorMesh.position.y = -0.1;
  floorMesh.receiveShadow = true;
  deck.add(floorMesh);

  // hex grid overlay
  const grid = new THREE.GridHelper(34, 34, 0x2e3540, 0x22262c);
  grid.position.y = 0.01;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  deck.add(grid);

  const crest = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 48),
    new THREE.MeshStandardMaterial({ map: makeCrestTexture(), roughness: 0.4, metalness: 0.5 })
  );
  const hall = toWorld(ROOMS.reportIn.x, ROOMS.reportIn.y);
  crest.rotation.x = -Math.PI / 2;
  crest.position.set(hall.x, 0.03, hall.z);
  deck.add(crest);

  const metal = mat(0x2a3038, { roughness: 0.4, metalness: 0.7 });
  const darkMetal = mat(0x15181d, { roughness: 0.45, metalness: 0.6 });
  const glass = mat(0x8ecfff, { roughness: 0.05, metalness: 0.2, opacity: 0.18 });
  glass.transparent = true;
  const lightStrip = mat(0xf2f7ff, { emissive: 0xf2f7ff, emissiveIntensity: 1.4, roughness: 0.2 });

  function roomBox(nx0, ny0, nx1, ny1, height = 1.35) {
    const a = toWorld(nx0, ny0);
    const b = toWorld(nx1, ny1);
    const cx = (a.x + b.x) / 2;
    const cz = (a.z + b.z) / 2;
    const w = Math.abs(b.x - a.x);
    const d = Math.abs(b.z - a.z);
    // walls
    wall(deck, cx, height / 2, a.z, w, height, 0.12, metal);
    wall(deck, cx, height / 2, b.z, w, height, 0.12, metal);
    wall(deck, a.x, height / 2, cz, 0.12, height, d, metal);
    wall(deck, b.x, height / 2, cz, 0.12, height, d, metal);
    // door cuts aren't actual CSG — drop a gap marker with darker floor
    return { cx, cz, w, d, a, b };
  }

  // Briefing
  roomBox(0.08, 0.06, 0.38, 0.28, 1.85);
  const brief = toWorld(0.23, 0.17);
  box(7.2, 0.12, 1.6, darkMetal, brief.x, 0.55, brief.z, deck);
  ROOMS.briefing.forEach((s) => {
    const p = toWorld(s.x, s.y);
    box(0.42, 0.46, 0.42, darkMetal, p.x, 0.23, p.z, deck);
  });
  // glass on briefing front
  const bFront = toWorld(0.23, 0.28);
  wall(deck, bFront.x, 1.1, bFront.z, 8.8, 1.9, 0.06, glass);

  // Command
  roomBox(0.62, 0.08, 0.82, 0.28, 1.9);
  const cmd = toWorld(0.694, 0.173);
  box(2.2, 0.12, 1.1, darkMetal, cmd.x, 0.55, cmd.z + 0.4, deck);
  box(0.5, 0.5, 0.5, darkMetal, cmd.x, 0.25, cmd.z, deck);

  // Barracks
  ROOMS.barracks.forEach((s) => {
    const p = toWorld(s.x, s.y);
    box(1.1, 0.28, 0.7, metal, p.x, 0.35, p.z, deck);
    box(1.1, 0.08, 0.7, mat(0x2c3340), p.x, 0.52, p.z, deck);
  });

  // Consoles
  const screens = [];
  ROOMS.duty.forEach((s, i) => {
    const p = toWorld(s.x, s.y);
    box(1.35, 0.08, 0.8, darkMetal, p.x, 0.52, p.z - 0.15, deck);
    box(0.42, 0.42, 0.42, darkMetal, p.x, 0.21, p.z + 0.15, deck);
    const tex = makeScreenTexture(i);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshStandardMaterial({ map: tex, emissive: 0x113344, emissiveIntensity: 0.5 })
    );
    screen.position.set(p.x, 0.95, p.z - 0.52);
    screen.userData.tex = tex;
    deck.add(screen);
    screens.push(screen);
    const lamp = new THREE.PointLight(0x5ee7ff, 1.6, 3.2, 2);
    lamp.position.set(p.x, 1.2, p.z);
    deck.add(lamp);
  });

  // Reception
  const rec = toWorld(0.18, 0.72);
  box(3.4, 0.7, 1.1, darkMetal, rec.x, 0.35, rec.z, deck);

  // Mess table
  const mess = toWorld(0.76, 0.8);
  box(2.2, 0.1, 2.2, darkMetal, mess.x, 0.48, mess.z, deck);
  ROOMS.mess.forEach((s) => {
    const p = toWorld(s.x, s.y);
    box(0.38, 0.42, 0.38, darkMetal, p.x, 0.21, p.z, deck);
  });

  // light strips on a few walls
  for (let i = 0; i < 10; i++) {
    box(0.08, 2.2, 0.08, lightStrip, -15.8, 1.1, -9 + i * 1.8, deck);
    box(0.08, 2.2, 0.08, lightStrip, 15.8, 1.1, -9 + i * 1.8, deck);
  }

  // viewport "stars" slab at command back
  const stars = document.createElement("canvas");
  stars.width = 512;
  stars.height = 256;
  const sg = stars.getContext("2d");
  sg.fillStyle = "#03040a";
  sg.fillRect(0, 0, 512, 256);
  sg.fillStyle = "#ffffff";
  for (let i = 0; i < 120; i++) sg.fillRect(Math.random() * 512, Math.random() * 256, 1.4, 1.4);
  const starTex = new THREE.CanvasTexture(stars);
  const view = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 2.2),
    new THREE.MeshBasicMaterial({ map: starTex })
  );
  const viewPos = toWorld(0.72, 0.09);
  view.position.set(viewPos.x, 1.4, viewPos.z - 0.2);
  view.rotation.y = 0;
  deck.add(view);

  // tiny mouse droids
  const droids = [];
  for (let i = 0; i < 3; i++) {
    const d = new THREE.Group();
    box(0.42, 0.18, 0.32, mat(0x111111, { metalness: 0.7 }), 0, 0.12, 0, d);
    box(0.08, 0.08, 0.08, mat(0xc41e3a, { emissive: 0xc41e3a, emissiveIntensity: 0.8 }), 0.16, 0.2, 0.1, d);
    d.position.copy(toWorld(0.4 + i * 0.08, 0.5));
    deck.add(d);
    droids.push({ mesh: d, t: Math.random() * 10, r: 3 + i });
  }

  const actors = new Map();
  for (const u of sim.state.units) {
    const mesh = makePerson(u.kind);
    const label = document.createElement("div");
    label.className = "world-tag";
    label.innerHTML = `<i class="dot live"></i>${u.callsign}`;
    const obj = new CSS2DObject(label);
    obj.position.set(0, 2.15, 0);
    mesh.add(obj);
    mesh.userData.label = label;
    mesh.userData.unitId = u.id;
    scene.add(mesh);
    actors.set(u.id, mesh);

    label.addEventListener("click", () => sim.select(u.id));
  }

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects([...actors.values()], true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.unitId) o = o.parent;
      if (o?.userData.unitId) sim.select(o.userData.unitId);
    }
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    const fr = 11;
    const aspect = w / Math.max(h, 1);
    camera.left = -fr * aspect;
    camera.right = fr * aspect;
    camera.top = fr;
    camera.bottom = -fr;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let running = true;

  function sync(u, mesh, t) {
    const p = toWorld(u.x, u.y);
    mesh.position.x = p.x;
    mesh.position.z = p.z;
    mesh.scale.x = u.facing >= 0 ? 1 : -1;
    const { lLeg, rLeg, lArm, rArm, body } = mesh.userData;
    if (u.pose === "walk") {
      const s = Math.sin(t * 9);
      lLeg.rotation.x = s * 0.7;
      rLeg.rotation.x = -s * 0.7;
      lArm.rotation.x = -s * 0.5;
      rArm.rotation.x = s * 0.5;
      mesh.position.y = 0.04 + Math.abs(s) * 0.04;
      body.position.y = 0;
    } else if (u.pose === "sit") {
      lLeg.rotation.x = 1.15;
      rLeg.rotation.x = 1.15;
      lArm.rotation.x = 0.3;
      rArm.rotation.x = -0.15;
      mesh.position.y = 0.18;
      body.rotation.x = 0.08;
    } else if (u.pose === "sleep") {
      mesh.rotation.z = u.facing >= 0 ? 1.2 : -1.2;
      mesh.position.y = 0.55;
      lLeg.rotation.x = 0.2;
      rLeg.rotation.x = 0.1;
    } else {
      mesh.rotation.z = 0;
      lLeg.rotation.x = 0;
      rLeg.rotation.x = 0;
      lArm.rotation.x = 0;
      rArm.rotation.x = 0;
      mesh.position.y = 0;
      body.rotation.x = 0;
      const cape = body.getObjectByName("cape");
      if (cape) cape.rotation.x = Math.sin(t * 1.4) * 0.04;
    }
    if (u.pose !== "sleep") mesh.rotation.z = 0;
    const label = mesh.userData.label;
    label.classList.toggle("selected", u.selected);
    const dot = label.querySelector(".dot");
    dot.className = "dot " + (
      u.status === "NAP" || u.status === "MEDITATE" ? "away"
        : u.status === "MESS" ? "idle" : "live"
    );
  }

  function render() {
    if (!running) return;
    const t = clock.getElapsedTime();
    const dt = clock.getDelta();
    controls.update();
    for (const u of sim.state.units) {
      const mesh = actors.get(u.id);
      if (mesh) sync(u, mesh, t);
    }
    for (const s of screens) s.userData.tex.userData.paint(t);
    for (const d of droids) {
      d.t += dt;
      d.mesh.position.x = Math.sin(d.t * 0.4) * d.r;
      d.mesh.position.z = Math.cos(d.t * 0.33) * (d.r * 0.6);
      d.mesh.rotation.y = d.t;
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
