// config.js — Warung Rush: fixed layout, palette and tuning.
// One job: every number the rest of the game reads, in one place.

export const VIEW = { w: 960, h: 640 };

export const PALETTE = {
  wall: '#7c4a21',
  floorA: '#e8b06a',
  floorB: '#dfa45e',
  board: '#2b2118',
  boardEdge: '#4a3423',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  counterEdge: '#5d3a1e',
  steel: '#9aa5ad',
  steelDark: '#6e7a82',
  cream: '#fff3dc',
  ink: '#2b2118',
  red: '#d93a2b',
  green: '#3f9e4d',
  gold: '#f2b705',
  teal: '#2a9d8f',
};

export const DAY_LENGTH = 150; // seconds per day
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const CHOP_TIME = 2.2; // seconds holding E at the board
export const COOK_TIME = 3.2; // seconds on a burner
export const BURN_TIME = 9; // seconds after cooked before it burns
export const ORDER_TIME_START = 52; // seconds an order lives at day start
export const ORDER_TIME_END = 38; // seconds an order lives at day end
export const SPAWN_START = 14; // seconds between new orders at day start
export const SPAWN_END = 7; // seconds between new orders at day end
export const CHEF_SPEED = 265; // px per second
export const CHEF_RADIUS = 17;

// Stations. Each has a solid rect (an obstacle) and a front point the chef
// stands near to use it. Coordinates are in canvas pixels.
export const STATIONS = {
  pantry: {
    label: 'PANTRY',
    rect: { x: 16, y: 118, w: 134, h: 402 },
    front: { x: 168, y: 320 },
    reach: 78,
  },
  chopping: {
    label: 'CHOPPING BOARD',
    rect: { x: 200, y: 118, w: 164, h: 66 },
    front: { x: 282, y: 210 },
    reach: 74,
  },
  stove: {
    label: 'STOVE',
    rect: { x: 400, y: 118, w: 220, h: 66 },
    front: { x: 510, y: 210 },
    reach: 74,
  },
  plating: {
    label: 'PLATING',
    rect: { x: 656, y: 118, w: 164, h: 66 },
    front: { x: 738, y: 210 },
    reach: 74,
  },
  serving: {
    label: 'SERVING PASS',
    rect: { x: 856, y: 118, w: 88, h: 190 },
    front: { x: 838, y: 213 },
    reach: 72,
  },
  trash: {
    label: 'TRASH',
    rect: { x: 856, y: 516, w: 88, h: 80 },
    front: { x: 838, y: 556 },
    reach: 72,
  },
};

// Pantry bins: seven ingredients on one tall shelf, a single column of wide
// bins so the chef picks one by standing level with it.
export const PANTRY_BINS = [
  { kind: 'rice', x: 26, y: 122, w: 114, h: 50 },
  { kind: 'noodles', x: 26, y: 178, w: 114, h: 50 },
  { kind: 'chicken', x: 26, y: 234, w: 114, h: 50 },
  { kind: 'egg', x: 26, y: 290, w: 114, h: 50 },
  { kind: 'veg', x: 26, y: 346, w: 114, h: 50 },
  { kind: 'chilli', x: 26, y: 402, w: 114, h: 50 },
  { kind: 'peanut', x: 26, y: 458, w: 114, h: 50 },
];

// Stove burner centres, relative to the stove rect.
export const BURNERS = [
  { x: 462, y: 151 },
  { x: 558, y: 151 },
];

// Where the chef starts each day.
export const CHEF_START = { x: 480, y: 470 };

// Score tuning.
export const SCORE = {
  base: 100, // per dish, before multipliers
  timeBonusMax: 50, // extra for serving with the timer nearly full
  tipBonus: 25, // extra for serving with more than half the time left
  comboStep: 0.25, // +25% per consecutive on-time serve
  comboCap: 3,
};
