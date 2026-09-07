import { UNITS } from "./roster.js";

function fitContained(img, layer) {
  const nw = img.naturalWidth || 1536;
  const nh = img.naturalHeight || 1024;
  const rect = img.parentElement.getBoundingClientRect();
  const imgAspect = nw / nh;
  const stageAspect = rect.width / Math.max(rect.height, 1);
  let w;
  let h;
  let left;
  let top;
  if (stageAspect > imgAspect) {
    h = rect.height;
    w = h * imgAspect;
    left = (rect.width - w) / 2;
    top = 0;
  } else {
    w = rect.width;
    h = w / imgAspect;
    left = 0;
    top = (rect.height - h) / 2;
  }
  layer.style.left = `${left}px`;
  layer.style.top = `${top}px`;
  layer.style.width = `${w}px`;
  layer.style.height = `${h}px`;
}

export function mount2D(stage, sim) {
  stage.innerHTML = "";
  const floor = document.createElement("div");
  floor.className = "floor";
  const img = document.createElement("img");
  img.src = "./assets/ds1-floor-live.jpg";
  img.alt = "DS-1 command deck";
  img.className = "floor-art";
  floor.appendChild(img);

  const layer = document.createElement("div");
  layer.className = "actor-layer";
  floor.appendChild(layer);
  stage.appendChild(floor);

  const layout = () => fitContained(img, layer);
  img.addEventListener("load", layout);
  window.addEventListener("resize", layout);
  requestAnimationFrame(layout);

  const nodes = new Map();
  for (const u of UNITS) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `actor kind-${u.kind}`;
    el.dataset.id = u.id;
    el.innerHTML = `
      <img src="./assets/units/${u.id}.png" alt="${u.callsign}" />
      <span class="tag"><i class="dot"></i>${u.callsign}</span>
    `;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      sim.select(u.id);
    });
    layer.appendChild(el);
    nodes.set(u.id, el);
  }

  function render() {
    for (const u of sim.state.units) {
      const el = nodes.get(u.id);
      if (!el) continue;
      el.style.left = `${u.x * 100}%`;
      el.style.top = `${u.y * 100}%`;
      el.style.zIndex = String(10 + Math.round(u.y * 200) + (u.selected ? 400 : 0) + (u.pose === "walk" ? 50 : 0));
      el.classList.toggle("walk", u.pose === "walk");
      el.classList.toggle("sit", u.pose === "sit");
      el.classList.toggle("sleep", u.pose === "sleep");
      el.classList.toggle("selected", u.selected);
      el.classList.toggle("flip", u.facing < 0);
      const dot = el.querySelector(".dot");
      dot.className = "dot " + statusClass(u.status);
    }
  }

  return { render, floor };
}

function statusClass(status) {
  if (status === "DUTY" || status === "BRIEFING" || status === "WATCH" || status === "GUARD" || status === "REPORT" || status === "SORTIE" || status === "STATION") return "live";
  if (status === "MESS") return "idle";
  if (status === "NAP" || status === "MEDITATE") return "away";
  if (status === "PATROL") return "live";
  return "idle";
}
