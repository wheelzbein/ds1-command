/* DESIGN LOCKED 2026-09-07. Room seats, callsigns, and unit art ids are frozen. See DESIGN_LOCK.md */
export const ROOMS = {
  briefing: [
    { x: 0.157, y: 0.125 }, { x: 0.193, y: 0.124 }, { x: 0.23, y: 0.124 },
    { x: 0.265, y: 0.124 }, { x: 0.304, y: 0.125 }, { x: 0.124, y: 0.169 },
    { x: 0.335, y: 0.168 }, { x: 0.152, y: 0.221 }, { x: 0.189, y: 0.221 },
    { x: 0.228, y: 0.222 }, { x: 0.265, y: 0.221 }, { x: 0.302, y: 0.222 },
  ],
  command: [{ x: 0.694, y: 0.173 }],
  barracks: [
    { x: 0.835, y: 0.127 }, { x: 0.913, y: 0.13 }, { x: 0.84, y: 0.196 },
    { x: 0.919, y: 0.198 }, { x: 0.845, y: 0.268 }, { x: 0.927, y: 0.271 },
    { x: 0.852, y: 0.342 }, { x: 0.934, y: 0.343 },
  ],
  duty: [
    { x: 0.072, y: 0.357 }, { x: 0.189, y: 0.356 }, { x: 0.309, y: 0.367 },
    { x: 0.387, y: 0.353 }, { x: 0.059, y: 0.425 }, { x: 0.189, y: 0.423 },
    { x: 0.309, y: 0.425 }, { x: 0.386, y: 0.422 }, { x: 0.06, y: 0.496 },
    { x: 0.18, y: 0.484 },
  ],
  reception: [
    { x: 0.124, y: 0.753 }, { x: 0.224, y: 0.643 }, { x: 0.221, y: 0.73 },
    { x: 0.336, y: 0.674 },
  ],
  mess: [
    { x: 0.732, y: 0.723 }, { x: 0.784, y: 0.718 }, { x: 0.707, y: 0.785 },
    { x: 0.824, y: 0.767 }, { x: 0.727, y: 0.858 }, { x: 0.821, y: 0.837 },
    { x: 0.783, y: 0.876 },
  ],
  reportIn: { x: 0.474, y: 0.488 },
};

export const UNITS = [
  {
    id: "vader",
    callsign: "VADER",
    name: "G.I.C.O.S.",
    job: "Overlord",
    role: "Your command system. Escalations only. Stays Vader.",
    kind: "darklord",
    home: { room: "reportIn", index: 0 },
    briefingIndex: 4,
    messIndex: 1,
    bunkIndex: 0,
  },
  {
    id: "tarkin",
    callsign: "STEWARD",
    name: "The Steward",
    job: "Station command",
    role: "Owns the deck. Approves coordinated builds.",
    kind: "officer",
    home: { room: "command", index: 0 },
    briefingIndex: 0,
    messIndex: 0,
    bunkIndex: 1,
  },
  {
    id: "krennic",
    callsign: "GARDNER",
    name: "The Gardner",
    job: "Operations",
    role: "Build console, station systems, the garden of the deck.",
    kind: "director",
    home: { room: "duty", index: 3 },
    briefingIndex: 1,
    messIndex: 2,
    bunkIndex: 2,
  },
  {
    id: "piett",
    callsign: "GROK",
    name: "Grok bot",
    job: "Calling / sessions",
    role: "Active sessions, handoffs, outbound calls.",
    kind: "officer",
    home: { room: "duty", index: 2 },
    briefingIndex: 2,
    messIndex: 3,
    bunkIndex: 3,
  },
  {
    id: "veers",
    callsign: "TRADING",
    name: "Trading bot",
    job: "Markets",
    role: "Treasury and live market orders.",
    kind: "officer",
    home: { room: "duty", index: 7 },
    briefingIndex: 3,
    messIndex: 4,
    bunkIndex: 4,
  },
  {
    id: "motti",
    callsign: "APPROVAL",
    name: "Live order approval gate",
    job: "Approvals",
    role: "Nothing fires without a gate check.",
    kind: "officer",
    home: { room: "duty", index: 6 },
    briefingIndex: 6,
    messIndex: 6,
    bunkIndex: 6,
  },
  {
    id: "surgeon",
    callsign: "HEALTH",
    name: "Health insurance bot",
    job: "Benefits Chief",
    role: "Coverage, bills, and insurance.",
    kind: "medical",
    home: { room: "duty", index: 5 },
    briefingIndex: 7,
    messIndex: 0,
    bunkIndex: 7,
  },
  {
    id: "yularen",
    callsign: "MEDIC",
    name: "Health bot",
    job: "Medical",
    role: "Health follow-ups and medical disputes.",
    kind: "intel",
    home: { room: "duty", index: 1 },
    briefingIndex: 5,
    messIndex: 5,
    bunkIndex: 5,
  },
  {
    id: "jerjerrod",
    callsign: "STRUCTURES",
    name: "Current structures viability",
    job: "Station integrity",
    role: "Keeps the station operational.",
    kind: "officer",
    home: { room: "duty", index: 4 },
    briefingIndex: 8,
    messIndex: 1,
    bunkIndex: 1,
  },
  {
    id: "tk421",
    callsign: "SPAM",
    name: "Spam call management",
    job: "Signal security",
    role: "Keeps junk calls off the deck.",
    kind: "trooper",
    home: { room: "reception", index: 2 },
    briefingIndex: 9,
    messIndex: 2,
    bunkIndex: 0,
  },
  {
    id: "hangar",
    callsign: "WATCH",
    name: "Deck watch",
    job: "Reception",
    role: "Blast door and hangar watch.",
    kind: "trooper",
    home: { room: "reception", index: 0 },
    briefingIndex: 10,
    messIndex: 3,
    bunkIndex: 2,
  },
  {
    id: "crimson",
    callsign: "SECURITY",
    name: "Application security",
    job: "Guard",
    role: "Reviews and holds the door. No one slips the commander.",
    kind: "crimson",
    home: { room: "reception", index: 1 },
    briefingIndex: 11,
    messIndex: 4,
    bunkIndex: 3,
  },
];

export function seatOf(room, index) {
  if (room === "reportIn") return ROOMS.reportIn;
  const list = ROOMS[room];
  if (!list) rettrn ROOMS.reportIn;
  return list[index % list.length];
}

function lock(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(lock);
  }
  return value;
}

lock(ROOMS);
lock(UNITS);
