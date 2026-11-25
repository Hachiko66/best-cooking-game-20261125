// kitchen.js — Warung Rush: the game state and its rules.
// One job: move the chef, run orders and timers, chop/cook/plate/serve.
// It never draws anything and never touches the DOM.

import {
  VIEW, DAY_LENGTH, MAX_HEARTS, MAX_ORDERS, CHOP_TIME, COOK_TIME, BURN_TIME,
  ORDER_TIME_START, ORDER_TIME_END, SPAWN_START, SPAWN_END, CHEF_SPEED,
  CHEF_RADIUS, STATIONS, PANTRY_BINS, BURNERS, CHEF_START, SCORE,
} from './config.js';
import { INGREDIENTS, RECIPES, recipeById, plateMatchesRecipe, recipeForPlate, nextStep } from './recipes.js';
import { sfx } from './audio.js';

let orderSeq = 0;

export function createGame(rng) {
  return {
    rng: rng || Math.random,
    phase: 'title', // title | playing | paused | over | complete
    time: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    hearts: MAX_HEARTS,
    chef: {
      x: CHEF_START.x, y: CHEF_START.y,
      tx: CHEF_START.x, ty: CHEF_START.y,
      moving: false, dir: 'down',
      carrying: null, // { kind, state } or { kind: 'plate', items: [...] }
      pendingStation: null, // station to auto-use when the chef arrives
      chopHeld: 0,
    },
    orders: [],
    spawnIn: 4,
    chopping: { item: null, progress: 0 },
    burners: BURNERS.map(() => ({ item: null, progress: 0, done: false, burnIn: 0 })),
    plate: { items: [] },
    floaters: [], // { x, y, text, color, t, life }
    hint: '',
    banner: '', // 'RUSH!' while 3+ orders are urgent
    rushCount: 0,
    muted: false,
    dayPart: 'Morning',
  };
}

export function startDay(g) {
  const fresh = createGame(g.rng);
  fresh.muted = g.muted;
  Object.assign(g, fresh);
  g.phase = 'playing';
  sfx.order();
}

function dayProgress(g) {
  return Math.min(1, g.time / DAY_LENGTH);
}

function orderTime(g) {
  return ORDER_TIME_START + (ORDER_TIME_END - ORDER_TIME_START) * dayProgress(g);
}

function spawnInterval(g) {
  return SPAWN_START + (SPAWN_END - SPAWN_START) * dayProgress(g);
}

function spawnOrder(g) {
  // Weight the two-ingredient dish a little early, the rest evenly.
  const pool = g.time < 30 ? ['sate-ayam', 'nasi-goreng', 'mie-ayam', 'gado-gado'] : RECIPES.map((r) => r.id);
  const id = pool[Math.floor(g.rng() * pool.length)];
  const total = orderTime(g);
  g.orders.push({ id: 'o' + (++orderSeq), recipe: recipeById(id), left: total, total });
  sfx.order();
}

export function addFloater(g, x, y, text, color) {
  g.floaters.push({ x, y, text, color: color || '#fff3dc', t: 0, life: 1.4 });
}

function obstacles() {
  return Object.values(STATIONS).map((s) => s.rect);
}

function blockedAt(x, y) {
  if (x < 168 || x > VIEW.w - 16 || y < 202 || y > VIEW.h - 16) return true;
  for (const r of obstacles()) {
    if (x > r.x - CHEF_RADIUS && x < r.x + r.w + CHEF_RADIUS &&
        y > r.y - CHEF_RADIUS && y < r.y + r.h + CHEF_RADIUS) return true;
  }
  return false;
}

function moveChef(g, dt, input) {
  const c = g.chef;
  let vx = 0;
  let vy = 0;
  if (input.moveX !== 0 || input.moveY !== 0) {
    vx = input.moveX;
    vy = input.moveY;
    c.pendingStation = null; // keys override a click target
  } else if (c.moving) {
    const dx = c.tx - c.x;
    const dy = c.ty - c.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      c.moving = false;
      if (c.pendingStation) {
        const st = c.pendingStation;
        c.pendingStation = null;
        useStation(g, st);
      }
    } else {
      vx = dx / d;
      vy = dy / d;
    }
  }
  if (vx === 0 && vy === 0) return;
  const nx = c.x + vx * CHEF_SPEED * dt;
  const ny = c.y + vy * CHEF_SPEED * dt;
  if (!blockedAt(nx, c.y)) c.x = nx;
  if (!blockedAt(c.x, ny)) c.y = ny;
  if (Math.abs(vx) > Math.abs(vy)) c.dir = vx > 0 ? 'right' : 'left';
  else c.dir = vy > 0 ? 'down' : 'up';
}

export function nearestStation(g) {
  const c = g.chef;
  let best = null;
  let bestD = Infinity;
  for (const [key, s] of Object.entries(STATIONS)) {
    const d = Math.hypot(c.x - s.front.x, c.y - s.front.y);
    if (d < s.reach && d < bestD) {
      best = key;
      bestD = d;
    }
  }
  return best;
}

export function nearestBin(g) {
  const c = g.chef;
  let best = null;
  let bestD = Infinity;
  for (const b of PANTRY_BINS) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

function stationForPoint(p) {
  for (const [key, s] of Object.entries(STATIONS)) {
    const r = s.rect;
    if (p.x >= r.x - 10 && p.x <= r.x + r.w + 10 && p.y >= r.y - 10 && p.y <= r.y + r.h + 10) return key;
  }
  return null;
}

export function clickAt(g, p) {
  const c = g.chef;
  const st = stationForPoint(p);
  if (st) {
    const front = STATIONS[st].front;
    c.tx = front.x;
    c.ty = front.y;
    c.pendingStation = st;
    c.moving = true;
  } else {
    c.tx = Math.max(170, Math.min(VIEW.w - 18, p.x));
    c.ty = Math.max(204, Math.min(VIEW.h - 18, p.y));
    c.pendingStation = null;
    c.moving = true;
  }
}

// The E key (or a click arrival) uses whichever station is in reach.
export function useStation(g, key) {
  const c = g.chef;
  const st = key || nearestStation(g);
  if (!st) return;

  if (st === 'pantry') {
    if (c.carrying) { g.hint = 'Hands full — serve or trash it first!'; return; }
    const bin = nearestBin(g);
    if (!bin) return;
    const ing = INGREDIENTS[bin.kind];
    c.carrying = { kind: bin.kind, state: ing.chop || ing.cook ? 'raw' : 'ready' };
    sfx.pickup();
    addFloater(g, c.x, c.y - 34, ing.name + '!', '#ffd98a');
    return;
  }

  if (st === 'chopping') {
    if (g.chopping.item && !c.carrying) {
      c.carrying = g.chopping.item; // pick the half-chopped item back up
      g.chopping.item = null;
      g.chopping.progress = 0;
      sfx.pickup();
      return;
    }
    if (c.carrying && c.carrying.kind !== 'plate' && nextStep(c.carrying) === 'chop') {
      g.chopping.item = c.carrying;
      c.carrying = null;
      g.chopping.progress = 0;
      sfx.chop();
      return;
    }
    if (c.carrying && c.carrying.kind !== 'plate') {
      g.hint = 'This needs the stove, not the board!';
    }
    return;
  }

  if (st === 'stove') {
    // Pick up a finished burner first.
    if (!c.carrying) {
      const done = g.burners.find((b) => b.item && b.done);
      if (done) {
        c.carrying = done.item;
        done.item = null;
        done.progress = 0;
        done.done = false;
        done.burnIn = 0;
        sfx.pickup();
        return;
      }
    }
    if (c.carrying && c.carrying.kind !== 'plate' && nextStep(c.carrying) === 'cook') {
      const free = g.burners.find((b) => !b.item);
      if (!free) { g.hint = 'Both burners are busy!'; return; }
      free.item = c.carrying;
      free.progress = 0;
      free.done = false;
      c.carrying = null;
      sfx.sizzle();
      return;
    }
    if (c.carrying && c.carrying.kind !== 'plate') {
      g.hint = 'This needs chopping first!';
    }
    return;
  }

  if (st === 'plating') {
    if (c.carrying && c.carrying.kind === 'plate') return; // already holding the plate
    if (c.carrying && nextStep(c.carrying) === null) {
      if (g.plate.items.length >= 3) { g.hint = 'The plate is full — serve it!'; return; }
      g.plate.items.push(c.carrying);
      c.carrying = null;
      sfx.plated();
      const done = recipeForPlate(g.plate.items);
      if (done) addFloater(g, STATIONS.plating.front.x, 240, done.name + ' ready!', '#8be28b');
      return;
    }
    if (!c.carrying && g.plate.items.length > 0) {
      c.carrying = { kind: 'plate', items: g.plate.items };
      g.plate.items = [];
      sfx.pickup();
      return;
    }
    if (c.carrying) g.hint = 'Finish this ingredient first!';
    return;
  }

  if (st === 'serving') {
    if (!c.carrying || c.carrying.kind !== 'plate') {
      g.hint = 'Bring a finished plate here!';
      return;
    }
    servePlate(g);
    return;
  }

  if (st === 'trash') {
    if (c.carrying) {
      c.carrying = null;
      sfx.putdown();
      addFloater(g, c.x, c.y - 34, 'Tossed', '#c9c9c9');
    }
    return;
  }
}

function servePlate(g) {
  const c = g.chef;
  const items = c.carrying.items;
  const dish = recipeForPlate(items);
  c.carrying = null;
  if (!dish) {
    g.hearts -= 1;
    g.combo = 0;
    sfx.wrong();
    addFloater(g, STATIONS.serving.front.x, 250, 'Wrong dish! -1 ♥', '#ff6b5e');
    if (g.hearts <= 0) endGame(g, false);
    return;
  }
  const orderIdx = g.orders.findIndex((o) => o.recipe.id === dish.id);
  if (orderIdx === -1) {
    // A real dish, but nobody ordered it right now.
    g.combo = 0;
    sfx.wrong();
    addFloater(g, STATIONS.serving.front.x, 250, 'No order for ' + dish.name, '#ff6b5e');
    return;
  }
  const order = g.orders[orderIdx];
  g.orders.splice(orderIdx, 1);
  const frac = order.left / order.total;
  const mult = Math.min(SCORE.comboCap, 1 + g.combo * SCORE.comboStep);
  const points = Math.round((dish.price + frac * SCORE.timeBonusMax + (frac > 0.5 ? SCORE.tipBonus : 0)) * mult);
  g.score += points;
  g.served += 1;
  g.combo += 1;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  sfx.served();
  addFloater(g, STATIONS.serving.front.x, 250, '+' + points + (mult > 1 ? '  x' + mult.toFixed(2).replace(/0$/, '') : ''), '#ffd94d');
  if (frac > 0.5) addFloater(g, STATIONS.serving.front.x, 276, 'TIP! +$' + SCORE.tipBonus, '#8be28b');
}

function endGame(g, completed) {
  g.phase = completed ? 'complete' : 'over';
  if (completed) sfx.win();
  else sfx.gameover();
}

function updateOrders(g, dt) {
  g.spawnIn -= dt;
  if (g.spawnIn <= 0 && g.orders.length < MAX_ORDERS) {
    spawnOrder(g);
    g.spawnIn = spawnInterval(g) * (0.85 + g.rng() * 0.3);
  }
  let urgent = 0;
  for (let i = g.orders.length - 1; i >= 0; i--) {
    const o = g.orders[i];
    o.left -= dt;
    if (o.left <= 12) urgent++;
    if (o.left <= 0) {
      g.orders.splice(i, 1);
      g.hearts -= 1;
      g.combo = 0;
      sfx.expired();
      addFloater(g, 480, 130, 'Order expired! -1 ♥', '#ff6b5e');
    }
  }
  g.rushCount = urgent;
  g.banner = urgent >= 3 ? 'RUSH!' : '';
  if (g.hearts <= 0) endGame(g, false);
}

function updateCooking(g, dt, input) {
  // Chopping: hold E near the board to work the knife.
  const nearBoard = nearestStation(g) === 'chopping';
  if (g.chopping.item && nearBoard && input.interactHeld && !g.chef.carrying) {
    g.chopping.progress += dt;
    if (Math.random() < dt * 6) sfx.chop();
    if (g.chopping.progress >= CHOP_TIME) {
      g.chopping.item.state = 'chopped';
      g.chef.carrying = g.chopping.item;
      g.chopping.item = null;
      g.chopping.progress = 0;
      sfx.chopped();
    }
  }
  // Burners cook on their own; burn if left too long after done.
  for (const b of g.burners) {
    if (!b.item) continue;
    if (!b.done) {
      b.progress += dt;
      if (b.progress >= COOK_TIME) {
        b.item.state = 'cooked';
        b.done = true;
        b.burnIn = BURN_TIME;
        sfx.cooked();
      }
    } else {
      b.burnIn -= dt;
      if (b.burnIn <= 0) {
        b.item = { kind: b.item.kind, state: 'burnt' };
        b.done = false;
        b.progress = 0;
        sfx.burn();
        addFloater(g, STATIONS.stove.front.x, 240, 'Burnt!', '#ff6b5e');
      }
    }
  }
}

function updateHint(g) {
  const c = g.chef;
  const st = nearestStation(g);
  if (!st) { g.hint = ''; return; }
  if (st === 'pantry') g.hint = c.carrying ? 'Hands full!' : 'E: grab an ingredient';
  else if (st === 'chopping') {
    if (g.chopping.item) g.hint = 'Hold E to chop…';
    else if (c.carrying && nextStep(c.carrying) === 'chop') g.hint = 'E: place on board, hold E to chop';
    else g.hint = 'Chop chicken & greens here';
  } else if (st === 'stove') {
    const done = g.burners.find((b) => b.item && b.done);
    if (!c.carrying && done) g.hint = 'E: pick up the cooked dish';
    else if (c.carrying && nextStep(c.carrying) === 'cook') g.hint = 'E: put it on the stove';
    else g.hint = 'Cook rice, noodles, egg & chicken';
  } else if (st === 'plating') {
    if (!c.carrying && g.plate.items.length > 0) g.hint = 'E: pick up the plate';
    else if (c.carrying && c.carrying.kind !== 'plate' && nextStep(c.carrying) === null) g.hint = 'E: add to the plate';
    else g.hint = 'Assemble dishes here';
  } else if (st === 'serving') g.hint = 'E: serve the plate!';
  else if (st === 'trash') g.hint = 'E: toss what you carry';
}

export function updateGame(g, input, dt) {
  if (g.phase === 'title') {
    if (input.startPressed || input.interactPressed) {
      startDay(g);
    }
    return;
  }
  if (g.phase === 'paused') {
    if (input.pausePressed || input.startPressed) g.phase = 'playing';
    return;
  }
  if (g.phase === 'over' || g.phase === 'complete') {
    if (input.restartPressed || input.startPressed) startDay(g);
    return;
  }

  // Playing.
  if (input.pausePressed) { g.phase = 'paused'; return; }
  if (input.click) clickAt(g, input.click);
  if (input.interactPressed) useStation(g, null);

  g.time += dt;
  g.dayPart = g.time < 50 ? 'Morning' : g.time < 100 ? 'Lunch Rush' : 'Dinner Rush';

  moveChef(g, dt, input);
  updateOrders(g, dt);
  updateCooking(g, dt, input);
  updateHint(g);

  for (let i = g.floaters.length - 1; i >= 0; i--) {
    const f = g.floaters[i];
    f.t += dt;
    f.y -= 22 * dt;
    if (f.t >= f.life) g.floaters.splice(i, 1);
  }

  if (g.time >= DAY_LENGTH && g.phase === 'playing') endGame(g, true);
}

export function urgentOrders(g) {
  return g.orders.filter((o) => o.left <= 12).length;
}
