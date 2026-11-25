// shots.js — Warung Rush: deterministic states for reproducible screenshots.
// One job: given ?shot=<name>&seed=<n>, pose the game so a screenshot shows
// the kitchen at its best. The states are built from the game's own rules.

import { createGame, startDay } from './kitchen.js';
import { recipeById } from './recipes.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function order(game, recipeId, left, total) {
  const recipe = recipeById(recipeId);
  return { id: 'shot-' + recipeId, recipe, left, total };
}

// Pose the chef near a station, carrying an item.
function poseChef(game, x, y, carrying) {
  game.chef.x = x;
  game.chef.y = y;
  game.chef.tx = x;
  game.chef.ty = y;
  game.chef.moving = false;
  game.chef.carrying = carrying || null;
}

export function applyShot(game, name, seed) {
  const rng = mulberry32(seed || 1);
  game.rng = rng;
  startDay(game);
  game.time = 0;

  if (name === 'start') {
    game.phase = 'title';
    game.orders = [order(game, 'nasi-goreng', 44, 52), order(game, 'mie-ayam', 38, 52)];
    poseChef(game, 480, 470, null);
    return game;
  }

  if (name === 'play') {
    // The cover: 3 orders with timers, a plate mid-assembly, a finished dish
    // on the plating counter, the chef carrying a fried egg toward it.
    game.time = 42;
    game.dayPart = 'Morning';
    game.score = 340;
    game.combo = 2;
    game.bestCombo = 2;
    game.served = 3;
    game.orders = [
      order(game, 'nasi-goreng', 34, 52),
      order(game, 'mie-ayam', 26, 52),
      order(game, 'sate-ayam', 41, 46),
    ];
    game.plate.items = [
      { kind: 'rice', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
    ];
    // Something on the stove and the board too, so the kitchen feels alive.
    game.burners[0] = { item: { kind: 'noodles', state: 'raw' }, progress: 2.0, done: false, burnIn: 0 };
    game.chopping.item = { kind: 'chicken', state: 'raw' };
    game.chopping.progress = 1.1;
    poseChef(game, 560, 300, { kind: 'chilli', state: 'ready' });
    game.chef.dir = 'up';
    return game;
  }

  if (name === 'rush') {
    // The rush: four orders, three about to expire, timers burning red.
    game.time = 118;
    game.dayPart = 'Dinner Rush';
    game.score = 890;
    game.combo = 4;
    game.bestCombo = 4;
    game.served = 8;
    game.orders = [
      order(game, 'nasi-goreng', 7, 46),
      order(game, 'mie-ayam', 9, 46),
      order(game, 'gado-gado', 11, 46),
      order(game, 'sate-ayam', 33, 46),
    ];
    game.rushCount = 3;
    game.banner = 'RUSH!';
    game.burners[0] = { item: { kind: 'chicken', state: 'cooked' }, progress: 3.2, done: true, burnIn: 6 };
    game.burners[1] = { item: { kind: 'rice', state: 'raw' }, progress: 2.1, done: false, burnIn: 0 };
    game.chopping.item = { kind: 'veg', state: 'raw' };
    game.chopping.progress = 1.4;
    poseChef(game, 300, 300, null);
    game.chef.dir = 'up';
    return game;
  }

  if (name === 'serve') {
    // The serve: a finished plate in hand at the pass, points floating up.
    game.time = 65;
    game.dayPart = 'Lunch Rush';
    game.score = 640;
    game.combo = 3;
    game.bestCombo = 3;
    game.served = 5;
    game.orders = [
      order(game, 'nasi-goreng', 22, 48),
      order(game, 'gado-gado', 30, 48),
    ];
    poseChef(game, 800, 240, {
      kind: 'plate',
      items: [
        { kind: 'rice', state: 'cooked' },
        { kind: 'egg', state: 'cooked' },
        { kind: 'chilli', state: 'ready' },
      ],
    });
    game.chef.dir = 'right';
    game.floaters = [
      { x: 740, y: 310, text: '+175  x1.50', color: '#ffd94d', t: 0.2, life: 1.4 },
      { x: 740, y: 336, text: 'TIP! +$25', color: '#8be28b', t: 0.2, life: 1.4 },
    ];
    return game;
  }

  if (name === 'chop') {
    // Chopping and cooking in progress, mid-prep.
    game.time = 20;
    game.dayPart = 'Morning';
    game.score = 120;
    game.combo = 1;
    game.bestCombo = 1;
    game.served = 1;
    game.hint = 'Hold E to chop…';
    game.orders = [
      order(game, 'mie-ayam', 40, 52),
      order(game, 'nasi-goreng', 47, 52),
    ];
    game.chopping.item = { kind: 'chicken', state: 'raw' };
    game.chopping.progress = 1.2;
    game.burners[0] = { item: { kind: 'noodles', state: 'raw' }, progress: 1.8, done: false, burnIn: 0 };
    game.burners[1] = { item: { kind: 'egg', state: 'raw' }, progress: 0.6, done: false, burnIn: 0 };
    poseChef(game, 282, 250, null);
    game.chef.dir = 'up';
    return game;
  }

  // Unknown shot name: plain mid-game.
  game.time = 10;
  game.orders = [order(game, 'nasi-goreng', 40, 52)];
  poseChef(game, 480, 470, null);
  return game;
}

export function shotNames() {
  return ['start', 'play', 'rush', 'serve', 'chop'];
}
