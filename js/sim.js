/* DESIGN LOCKED 2026-09-07. Command modes including launch/sortie are frozen. See DESIGN_LOCK.md */
import { UNITS, seatOf, ROOMS } from "./roster.js";

const HALL = ROOMS.reportIn;

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function clone(p) {
  return { x: p.x, y: p.y };
}

export function createSim() {
  const units = UNITS.map((u) => {
    const home = u.home.room === "reportIn"
      ? clone(ROOMS.reportIn)
      : clone(seatOf(u.home.room, u.home.index));
    return {
      ...u,
      x: home.x,
      y: home.y,
      facing: 1,
      pose: u.home.room === "reportIn" || u.kind === "crimson" || u.kind === "darklord" ? "stand" : "sit",
      status: u.home.room === "command" || u.home.room === "duty" ? "DUTY" : u.kind === "crimson" ? "GUARD" : "WATCH",
      location: u.home.room,
      moving: false,
      path: [],
      speed: 0.18 + Math.random() * 0.04,
      idleUntil: 8 + Math.random() * 18,
      selected: false,
      task: u.role,
    };
  });

  const state = {
    units,
    mode: "stand-down", // stand-down | briefing | mess | lights-out | report-in | launch
    sortie: false,
    briefing: false,
    clock: 0,
    nextBriefing: 55,
    selectedId: null,
    logs: ["DS-1 G.I.C.O.S. live deck online. Rebel signal: NONE."],
  };

  function log(msg) {
    state.logs.unshift(imperialStamp() + "  " + msg);
    state.logs = state.logs.slice(0, 8);
  }

  function imperialStamp() {
    const t = state.clock;
    const hh = String(Math.floor(t / 3600) % 24).padStart(2, "0");
    const mm = String(Math.floor(t / 60) % 60).padStart(2, "0");
    const ss = String(Math.floor(t) % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function pathTo(unit, dest) {
    const start = { x: unit.x, y: unit.y };
    const via = clone(HALL);
    if (dist(start, dest) < 0.08) return [dest];
    // Always cut through the crest hall so they "move across the office"
    if (dist(start, via) < 0.05) return [dest];
    if (dist(dest, via) < 0.05) return [via];
    return [via, dest];
  }

  function send(unit, room, index, status, pose) {
    const dest = room === "reportIn" ? clone(ROOMS.reportIn) : clone(seatOf(room, index));
    unit.path = pathTo(unit, dest);
    unit.moving = true;
    unit.location = room;
    unit.status = status;
    unit.pose = "walk";
    unit.destPose = pose;
    unit.idleUntil = 12 + Math.random() * 22;
  }

  function sendAll(kind) {
    state.mode = kind;
    if (kind === "briefing") {
      state.briefing = true;
      state.sortie = false;
      log("Coordinated build. All units to briefing chamber. Steward presiding.");
      for (const u of units) {
        send(u, "briefing", u.briefingIndex, "BRIEFING", "sit");
      }
    } else if (kind === "stand-down") {
      state.briefing = false;
      state.sortie = false;
      log("Stand down. Return to assigned stations.");
      for (const u of units) {
        const pose = u.home.room === "duty" || u.home.room === "command" ? "sit" : "stand";
        const status = u.home.room === "duty" || u.home.room === "command" ? "DUTY" : u.kind === "crimson" ? "GUARD" : "WATCH";
        send(u, u.home.room, u.home.index, status, pose);
      }
    } else if (kind === "mess") {
      state.sortie = false;
      state.briefing = false;
      log("Recreation cycle. Officer mess is open. No rebel rations.");
      for (const u of units) {
        if (u.kind === "darklord") {
          send(u, "reportIn", 0, "WATCH", "stand");
        } else if (u.kind === "crimson") {
          send(u, u.home.room, u.home.index, "GUARD", "stand");
        } else {
          send(u, "mess", u.messIndex, "MESS", "sit");
        }
      }
    } else if (kind === "lights-out") {
      state.sortie = false;
      state.briefing = false;
      log("Lights out. Barracks. The station sleeps. Superlaser on standby.");
      for (const u of units) {
        if (u.kind === "darklord") {
          send(u, "command", 0, "MEDITATE", "stand");
        } else {
          send(u, "barracks", u.bunkIndex, "NAP", "sleep");
        }
      }
    } else if (kind === "launch") {
      state.briefing = false;
      state.sortie = true;
      log("Launch TIE-fighters. GICOS holds the station. Wings to orbit.");
      for (const u of units) {
        if (u.kind === "darklord") {
          u.path = [];
          u.moving = false;
          u.status = "STATION";
          u.pose = "stand";
          u.location = "reportIn";
          continue;
        }
        const hangarIndex = u.home.room === "reception" ? u.home.index : u.briefingIndex % 4;
        send(u, "reception", hangarIndex, "SORTIE", "stand");
      }
    } else if (kind === "report-in") {
      state.sortie = false;
      state.briefing = false;
      log("All hands, report in on the crest.");
      for (const u of units) {
        send(u, "reportIn", 0, "REPORT", "stand");
        // fan out around crest
      }
      units.forEach((u, i) => {
        const ang = (i / units.length) * Math.PI * 2;
        const dest = {
          x: HALL.x + Math.cos(ang) * 0.07,
          y: HALL.y + Math.sin(ang) * 0.05,
        };
        u.path = pathTo(u, dest);
        u.moving = true;
        u.pose = "walk";
        u.destPose = "stand";
        u.status = "REPORT";
        u.location = "reportIn";
      });
    }
  }

  function tick(dt) {
    state.clock += dt;
    if (state.mode !== "launch") state.nextBriefing -= dt;

    for (const u of units) {
      if (u.moving && u.path.length) {
        const dest = u.path[0];
        const d = dist(u, dest);
        const step = u.speed * dt;
        if (d <= step || d < 0.004) {
          u.x = dest.x;
          u.y = dest.y;
          u.path.shift();
          if (!u.path.length) {
            u.moving = false;
            u.pose = u.destPose || "stand";
          }
        } else {
          u.facing = dest.x >= u.x ? 1 : -1;
          u.x += ((dest.x - u.x) / d) * step;
          u.y += ((dest.y - u.y) / d) * step;
        }
      } else {
        u.idleUntil -= dt;
      }
    }

    // Fan-out of report-in handled above.

    if (state.mode === "launch") {
      for (const u of units) {
        if (u.kind === "darklord") {
          u.status = "STATION";
          continue;
        }
        if (!u.moving) u.status = "SORTIE";
      }
    }

    if (state.mode === "stand-down") {
      for (const u of units) {
        if (u.moving || u.idleUntil > 0) continue;
        if (u.kind === "darklord" || u.kind === "crimson") {
          // patrol the hall then return
          if (u.location !== "reportIn" && Math.random() < 0.5) {
            send(u, "reportIn", 0, "WATCH", "stand");
          } else {
            send(u, u.home.room, u.home.index, u.kind === "crimson" ? "GUARD" : "WATCH", "stand");
          }
          continue;
        }
        if (u.kind === "trooper") {
          const roll = Math.random();
          if (roll < 0.4) send(u, "reportIn", 0, "PATROL", "stand");
          else if (roll < 0.7) send(u, u.home.room, u.home.index, "WATCH", "stand");
          else send(u, "mess", u.messIndex, "MESS", "sit");
          continue;
        }
        // officers: work, then break, then nap if still idle-mode
        const roll = Math.random();
        if (roll < 0.55) {
          send(u, u.home.room, u.home.index, "DUTY", "sit");
        } else if (roll < 0.8) {
          send(u, "mess", u.messIndex, "MESS", "sit");
        } else {
          send(u, "barracks", u.bunkIndex, "NAP", "sleep");
        }
      }
    }

    if (state.mode === "stand-down" && state.nextBriefing <= 0) {
      sendAll("briefing");
      state.nextBriefing = 70 + Math.random() * 25;
      // auto stand-down after briefing
      state.briefingEnds = state.clock + 22;
    }
    if (state.briefing && state.briefingEnds && state.clock >= state.briefingEnds && state.mode === "briefing") {
      sendAll("stand-down");
      state.briefingEnds = null;
    }
  }

  function select(id) {
    state.selectedId = id;
    for (const u of units) u.selected = u.id === id;
  }

  return { state, tick, sendAll, select, log };
}
