/* DESIGN LOCKED 2026-09-07. Views LIVE DECK / HOLOGRAM / OUTSIDE / UNIT SET and commands are frozen. See DESIGN_LOCK.md */
import { createSim } from "./sim.js";
import { mount2D } from "./view2d.js";

const sim = createSim();
const stage2d = document.getElementById("stage-2d");
const stage3d = document.getElementById("stage-3d");
const stageOrbit = document.getElementById("stage-orbit");
const stageSheet = document.getElementById("stage-sheet");
const view2d = mount2D(stage2d, sim);
let view3d = null;
let viewOrbit = null;
let mode = "deck";
let loadingHolo = false;
let loadingOrbit = false;

const rosterEl = document.getElementById("roster-list");
const dossierEl = document.getElementById("dossier");
const logsEl = document.getElementById("logs");
const clockEl = document.getElementById("clock");
const badge = document.getElementById("build-badge");

function showStageError(el, text) {
  el.innerHTML = `<div class="stage-error">${text}</div>`;
}

function renderRoster() {
  rosterEl.innerHTML = sim.state.units.map((u) => `
    <button class="unit-row ${u.selected ? "selected" : ""}" data-id="${u.id}">
      <img src="./assets/units/${u.id}.png" alt="${u.callsign}" />
      <div class="meta">
        <strong>${u.callsign}</strong>
        <span>${u.job}</span>
      </div>
      <div class="st">${u.status}</div>
    </button>
  `).join("");
  rosterEl.querySelectorAll(".unit-row").forEach((btn) => {
    btn.addEventListener("click", () => sim.select(btn.dataset.id));
  });
}

function renderDossier() {
  const u = sim.state.units.find((x) => x.id === sim.state.selectedId) || sim.state.units[0];
  dossierEl.innerHTML = `
    <div class="who">
      <img src="./assets/units/${u.id}.png" alt="${u.callsign}" />
      <div>
        <h3>${u.name}</h3>
        <div class="job">${u.callsign === "VADER" ? "Vader · " : ""}${u.job}</div>
        <p>${u.role}</p>
      </div>
    </div>
  `;
  logsEl.innerHTML = sim.state.logs.map((l) => `<div>${l}</div>`).join("");
}

function renderSheet() {
  stageSheet.innerHTML = `
    <div class="sheet-head">DS-1 COMMAND · YOUR BOTS</div>
    <div class="sheet-grid">
      ${sim.state.units.map((u) => `
        <button class="sheet-card ${u.selected ? "selected" : ""}" data-id="${u.id}" type="button">
          <span class="sheet-art"><img src="./assets/units/${u.id}.png" alt="${u.name}" /></span>
          <span class="sheet-tag">${u.callsign}</span>
          <span class="sheet-name">${u.name}</span>
        </button>
      `).join("")}
    </div>
  `;
  stageSheet.querySelectorAll(".sheet-card").forEach((btn) => {
    btn.addEventListener("click", () => sim.select(btn.dataset.id));
  });
}

async function ensureHolo() {
  if (view3d || loadingHolo) return view3d;
  loadingHolo = true;
  try {
    const { mount3D } = await import("./view3d.js");
    view3d = mount3D(stage3d, sim);
  } catch (err) {
    console.error(err);
    showStageError(stage3d, "Hologram failed to load. LIVE DECK still runs.");
  }
  loadingHolo = false;
  return view3d;
}

async function ensureOrbit() {
  if (viewOrbit || loadingOrbit) return viewOrbit;
  loadingOrbit = true;
  try {
    const { mountOrbit } = await import("./view-orbit.js?v=swarm18");
    viewOrbit = mountOrbit(stageOrbit, sim);
  } catch (err) {
    console.error(err);
    showStageError(stageOrbit, "OUTSIDE failed to load. Tap Launch TIE-fighters again.");
  }
  loadingOrbit = false;
  return viewOrbit;
}

async function setMode(next) {
  mode = next;
  document.querySelectorAll(".view-toggle button").forEach((b) => {
    b.classList.toggle("on", b.dataset.view === next);
  });
  stage2d.classList.toggle("hidden", next !== "deck");
  stage3d.classList.toggle("hidden", next !== "holo");
  stageOrbit.classList.toggle("hidden", next !== "orbit");
  stageSheet.classList.toggle("hidden", next !== "sheet");
  if (next === "sheet") renderSheet();
  if (next === "holo") {
    await ensureHolo();
    view3d?.resize();
    view3d?.render();
  }
  if (next === "orbit") {
    await ensureOrbit();
    viewOrbit?.resize();
    viewOrbit?.render();
  }
}

document.querySelectorAll("[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sim.sendAll(btn.dataset.cmd);
    document.querySelectorAll("[data-cmd]").forEach((b) => b.classList.toggle("active", b === btn));
    if (btn.dataset.cmd === "launch") setMode("orbit");
  });
});
document.querySelectorAll(".view-toggle button").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.view));
});

document.getElementById("roster-toggle")?.addEventListener("click", () => {
  document.querySelector(".roster")?.classList.toggle("open");
});
renderRoster();
renderDossier();
renderSheet();

let last = performance.now();
let rosterTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  sim.tick(dt);
  view2d.render();
  if (mode === "holo") view3d?.render();
  if (mode === "orbit") viewOrbit?.render();
  const nowDate = new Date();
  clockEl.textContent = nowDate.toLocaleTimeString("en-GB", { hour12: false });
  badge.classList.toggle("on", sim.state.briefing);
  rosterTick += dt;
  if (rosterTick > 0.35) {
    rosterTick = 0;
    renderRoster();
    renderDossier();
    if (mode === "sheet") renderSheet();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setMode("deck");
