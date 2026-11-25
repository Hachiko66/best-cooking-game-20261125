// main.js — Warung Rush: bootstrap the canvas, run the loop, wire input + audio.
// One job: glue. The rules live in kitchen.js, the pictures in render.js.

import { VIEW } from './config.js';
import { createGame, updateGame } from './kitchen.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { ensureAudio, setMuted, startMusic, sfx } from './audio.js';
import { applyShot, mulberry32 } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = VIEW.w;
canvas.height = VIEW.h;
const ctx = canvas.getContext('2d');

// Keep the 960x640 canvas undistorted: letterbox it inside the window.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  canvas.style.width = Math.floor(VIEW.w * scale) + 'px';
  canvas.style.height = Math.floor(VIEW.h * scale) + 'px';
  canvas.style.left = Math.floor((window.innerWidth - VIEW.w * scale) / 2) + 'px';
  canvas.style.top = Math.floor((window.innerHeight - VIEW.h * scale) / 2) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const game = createGame(mulberry32(seed));
const input = createInput(canvas);

// A shot freezes the game on one posed frame: render once, never advance.
let frozen = false;
if (shotName) {
  applyShot(game, shotName, seed);
  frozen = true;
  render(ctx, game);
  announce();
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const inp = input.poll();
    if (inp.mutePressed) {
      game.muted = !game.muted;
      setMuted(game.muted);
    }
    if ((inp.startPressed || inp.interactPressed || inp.click) && game.phase === 'title') {
      ensureAudio();
      startMusic();
    }
    updateGame(game, inp, dt);
    render(ctx, game);
    announce();
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function announce() {
  if (!statusEl) return;
  const g = game;
  const carrying = g.chef.carrying
    ? g.chef.carrying.kind === 'plate'
      ? 'carrying a plate with ' + g.chef.carrying.items.length + ' items'
      : 'carrying ' + g.chef.carrying.kind
    : 'hands empty';
  statusEl.textContent =
    'Warung Rush, ' + g.phase + '. Score ' + g.score + ', ' + g.hearts + ' hearts, ' +
    g.orders.length + ' orders, ' + carrying + '.';
}

void frozen;
void sfx;
