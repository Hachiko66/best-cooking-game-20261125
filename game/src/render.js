// render.js — Warung Rush: everything the player sees, drawn on one canvas.
// One job: paint the kitchen, the chef, the food and the HUD. No game rules here.

import { VIEW, PALETTE, STATIONS, PANTRY_BINS, BURNERS, DAY_LENGTH, MAX_HEARTS } from './config.js';
import { INGREDIENTS, recipeForPlate } from './recipes.js';
import { nearestStation, nearestBin } from './kitchen.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// ---- food icons (simple vector shapes, drawn fresh each frame) ----

export function drawIngredient(ctx, kind, x, y, s, state) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 24; // unit
  if (state === 'burnt') {
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.arc(0, 0, 9 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(-6 * u, -4 * u); ctx.lineTo(6 * u, 4 * u); ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'rice') {
    ctx.fillStyle = '#c65b2e';
    ctx.beginPath(); ctx.arc(0, 3 * u, 11 * u, 0, Math.PI); ctx.fill(); // bowl
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(0, 1 * u, 9 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8ddc2';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 3.4 * u, -2 * u, 2.4 * u, 0, Math.PI * 2); ctx.fill(); }
  } else if (kind === 'noodles') {
    ctx.fillStyle = '#3f6fb5';
    ctx.beginPath(); ctx.arc(0, 3 * u, 11 * u, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2.4 * u; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(-8 * u + i * 8 * u, 2 * u);
      ctx.quadraticCurveTo(-5 * u + i * 8 * u, -6 * u, -2 * u + i * 8 * u, 1 * u);
    }
    ctx.stroke();
  } else if (kind === 'chicken') {
    ctx.fillStyle = state === 'cooked' ? '#c96f2e' : '#e8a87c';
    ctx.beginPath(); ctx.ellipse(-2 * u, 0, 8 * u, 6.5 * u, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5efe0'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(5 * u, -4 * u); ctx.lineTo(11 * u, -9 * u); ctx.stroke();
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(12 * u, -10 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.fillStyle = '#e8a87c';
      ctx.beginPath(); ctx.arc(2 * u, 2 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-4 * u, 4 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 8.5 * u, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = state === 'cooked' ? '#f2a007' : '#ffe9a8';
    ctx.beginPath(); ctx.arc(1 * u, 0, 5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'veg') {
    ctx.fillStyle = '#3f9e4d';
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.rotate((i - 1) * 0.6);
      ctx.beginPath(); ctx.ellipse(0, -6 * u, 4 * u, 9 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#58b368';
    ctx.beginPath(); ctx.arc(0, 3 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chilli') {
    ctx.strokeStyle = '#d93a2b'; ctx.lineWidth = 4.5 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-9 * u, -6 * u); ctx.quadraticCurveTo(2 * u, 8 * u, 10 * u, -4 * u); ctx.stroke();
    ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 2.5 * u;
    ctx.beginPath(); ctx.moveTo(-9 * u, -6 * u); ctx.lineTo(-12 * u, -10 * u); ctx.stroke();
  } else if (kind === 'peanut') {
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.arc(0, 3 * u, 11 * u, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#b5762e';
    ctx.beginPath(); ctx.arc(0, 1 * u, 9 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.arc(-3 * u, -1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 * u, -2 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlateIcon(ctx, x, y, r, dishColor) {
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9bfa8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = dishColor;
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.fill();
}

// ---- the kitchen ----

function drawFloor(ctx) {
  const tile = 48;
  for (let y = 100; y < VIEW.h; y += tile) {
    for (let x = 0; x < VIEW.w; x += tile) {
      const even = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // A small rug in the middle of the floor.
  ctx.fillStyle = '#b23a2e';
  rr(ctx, 340, 420, 280, 110, 14); ctx.fill();
  ctx.fillStyle = '#d9a441';
  rr(ctx, 352, 432, 256, 86, 10); ctx.fill();
  ctx.fillStyle = '#b23a2e';
  rr(ctx, 364, 444, 232, 62, 8); ctx.fill();
}

function drawCounter(ctx, rect, label, highlight) {
  ctx.fillStyle = PALETTE.counterEdge;
  rr(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10); ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, 10);
  text(ctx, label, rect.x + rect.w - 8, rect.y + rect.h - 8, 10, '#ffe9c4', 'right');
  if (highlight) {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 3;
    rr(ctx, rect.x - 5, rect.y - 5, rect.w + 10, rect.h + 10, 12); ctx.stroke();
  }
}

function drawPantry(ctx, g, highlight) {
  const r = STATIONS.pantry.rect;
  ctx.fillStyle = '#6b4423';
  rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  const selected = highlight ? nearestBin(g) : null;
  for (const bin of PANTRY_BINS) {
    const ing = INGREDIENTS[bin.kind];
    ctx.fillStyle = '#5d3a1e';
    rr(ctx, bin.x - 2, bin.y - 2, bin.w + 4, bin.h + 4, 6); ctx.fill();
    ctx.fillStyle = '#fff3dc';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 5); ctx.fill();
    drawIngredient(ctx, bin.kind, bin.x + 24, bin.y + bin.h / 2, 30, 'raw');
    text(ctx, ing.short, bin.x + 44, bin.y + bin.h / 2 + 4, 11, '#2b2118');
    if (selected === bin) {
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 3;
      rr(ctx, bin.x - 4, bin.y - 4, bin.w + 8, bin.h + 8, 7); ctx.stroke();
    }
  }
  text(ctx, 'PANTRY', r.x + r.w / 2, r.y + r.h + 16, 11, '#ffe9c4', 'center');
  if (highlight) {
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
    rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 12); ctx.stroke();
  }
}

function drawStove(ctx, g, highlight) {
  const r = STATIONS.stove.rect;
  drawCounter(ctx, r, 'STOVE', highlight);
  BURNERS.forEach((b, i) => {
    const burner = g.burners[i];
    ctx.fillStyle = '#2b2118';
    ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = burner.item && burner.done ? '#ff7b2f' : '#3a3a3a';
    ctx.beginPath(); ctx.arc(b.x, b.y, 20, 0, Math.PI * 2); ctx.fill();
    if (burner.item) {
      drawIngredient(ctx, burner.item.kind, b.x, b.y - 2, 30, burner.item.state);
      if (burner.done) {
        text(ctx, 'READY!', b.x, b.y - 32, 11, '#8be28b', 'center');
        if (burner.burnIn < 3) text(ctx, Math.ceil(burner.burnIn) + 's!', b.x, b.y - 44, 11, '#ff6b5e', 'center');
      } else {
        // Progress bar floating just above the burner, clear of the label.
        const frac = burner.progress / 3.2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(b.x - 22, b.y - 38, 44, 6);
        ctx.fillStyle = '#ffd94d';
        ctx.fillRect(b.x - 22, b.y - 38, 44 * Math.min(1, frac), 6);
      }
    }
  });
}

function drawChopping(ctx, g, highlight) {
  const r = STATIONS.chopping.rect;
  drawCounter(ctx, r, 'CHOPPING BOARD', highlight);
  ctx.fillStyle = '#e8c98f';
  rr(ctx, r.x + 18, r.y + 8, r.w - 36, r.h - 30, 6); ctx.fill();
  ctx.strokeStyle = '#b89a5e'; ctx.lineWidth = 2;
  rr(ctx, r.x + 18, r.y + 8, r.w - 36, r.h - 30, 6); ctx.stroke();
  if (g.chopping.item) {
    drawIngredient(ctx, g.chopping.item.kind, r.x + r.w / 2, r.y + 26, 34, g.chopping.item.state);
    const frac = g.chopping.progress / 2.2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(r.x + 14, r.y + 40, r.w - 28, 6);
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(r.x + 14, r.y + 40, (r.w - 28) * Math.min(1, frac), 6);
    text(ctx, 'HOLD E — CHOP!', r.x + r.w / 2, r.y + 14, 10, '#2b2118', 'center');
  } else {
    // A knife resting on the board.
    ctx.strokeStyle = '#9aa5ad'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r.x + 40, r.y + 30); ctx.lineTo(r.x + 95, r.y + 22); ctx.stroke();
    ctx.strokeStyle = '#5d3a1e'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(r.x + 95, r.y + 22); ctx.lineTo(r.x + 118, r.y + 18); ctx.stroke();
  }
}

function drawPlating(ctx, g, highlight) {
  const r = STATIONS.plating.rect;
  drawCounter(ctx, r, 'PLATING', highlight);
  const cx = r.x + r.w / 2;
  const cy = r.y + 30;
  drawPlateIcon(ctx, cx, cy, 24, '#e8ddc2');
  g.plate.items.forEach((item, i) => {
    drawIngredient(ctx, item.kind, cx - 26 + i * 26, cy, 24, item.state);
  });
  // A finished dish on the plate gets a green tick.
  if (g.plate.items.length > 0 && recipeForPlate(g.plate.items)) {
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath(); ctx.arc(cx + 26, cy - 20, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 21, cy - 20); ctx.lineTo(cx + 25, cy - 16); ctx.lineTo(cx + 31, cy - 24); ctx.stroke();
  }
}

function drawServing(ctx, g, highlight) {
  const r = STATIONS.serving.rect;
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10); ctx.fill();
  ctx.fillStyle = '#c9a06a';
  rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  // A bell and a heat lamp.
  ctx.fillStyle = '#f2b705';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 34, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(r.x + r.w / 2 - 14, r.y + 34, 28, 4);
  ctx.fillStyle = '#ff6b5e';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 60, 6, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'SERVE', r.x + r.w / 2, r.y + 92, 12, '#2b2118', 'center');
  text(ctx, 'PASS', r.x + r.w / 2, r.y + 108, 12, '#2b2118', 'center');
  // A waiting tray.
  ctx.fillStyle = '#8a5a33';
  rr(ctx, r.x + 10, r.y + 130, r.w - 20, 44, 6); ctx.fill();
  if (highlight) {
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
    rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 12); ctx.stroke();
  }
}

function drawTrash(ctx, highlight) {
  const r = STATIONS.trash.rect;
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10); ctx.fill();
  ctx.fillStyle = '#6e7a82';
  rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 6); ctx.fill();
  ctx.fillStyle = '#4a545a';
  rr(ctx, r.x + 4, r.y + 2, r.w - 8, 12, 6); ctx.fill();
  text(ctx, 'TRASH', r.x + r.w / 2, r.y + r.h - 8, 11, '#ffe9c4', 'center');
  if (highlight) {
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
    rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 12); ctx.stroke();
  }
}

// ---- the chef ----

function drawChef(ctx, g) {
  const c = g.chef;
  ctx.save();
  ctx.translate(c.x, c.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 14, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath(); ctx.arc(0, 2, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath(); ctx.arc(0, 6, 13, 0, Math.PI); ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -12, 11, 0, Math.PI * 2); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -22, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -25, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -22, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-10, -24, 20, 6);
  // Face: eyes toward the walking direction.
  const ex = c.dir === 'left' ? -3 : c.dir === 'right' ? 3 : 0;
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(-4 + ex, -12, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + ex, -12, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(ex, -8, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Carried item floats above the toque.
  if (c.carrying) {
    if (c.carrying.kind === 'plate') {
      drawPlateIcon(ctx, 0, -44, 15, '#e8ddc2');
      c.carrying.items.forEach((item, i) => {
        drawIngredient(ctx, item.kind, -12 + i * 12, -44, 20, item.state);
      });
    } else {
      drawIngredient(ctx, c.carrying.kind, 0, -42, 30, c.carrying.state);
    }
  }
  ctx.restore();
}

// ---- order board & HUD ----

function drawOrderBoard(ctx, g) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, VIEW.w, 100);
  ctx.fillStyle = PALETTE.boardEdge;
  ctx.fillRect(0, 96, VIEW.w, 4);
  text(ctx, 'WARUNG RUSH', 16, 30, 19, '#ffd94d');
  text(ctx, 'orders', 16, 50, 11, '#c9bfa8');
  // Order tickets — kept clear of the score block on the right.
  const tickets = g.orders;
  tickets.forEach((o, i) => {
    const x = 190 + i * 152;
    const urgent = o.left <= 12;
    const frac = Math.max(0, o.left / o.total);
    ctx.fillStyle = urgent ? '#7a1f16' : '#fff3dc';
    rr(ctx, x, 10, 148, 76, 8); ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : '#c9bfa8';
    ctx.lineWidth = urgent ? 3 : 1.5;
    rr(ctx, x, 10, 148, 76, 8); ctx.stroke();
    drawPlateIcon(ctx, x + 24, 34, 15, o.recipe.color);
    text(ctx, o.recipe.name, x + 44, 30, 13, urgent ? '#ffd94d' : '#2b2118');
    const needs = o.recipe.needs.map((n) => INGREDIENTS[n.kind].short).join(' + ');
    text(ctx, needs, x + 44, 48, 8.5, urgent ? '#ffcfc9' : '#5d4a33');
    // Timer bar.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 10, 60, 128, 10);
    ctx.fillStyle = urgent ? '#ff3b2f' : frac > 0.5 ? '#3f9e4d' : '#f2a007';
    ctx.fillRect(x + 10, 60, 128 * frac, 10);
    text(ctx, Math.ceil(o.left) + 's', x + 138, 78, 12, urgent ? '#ff6b5e' : '#2b2118', 'right');
  });
  if (tickets.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 210, 52, 14, '#c9bfa8');
  }
  // Score, day timer, hearts, combo on the right.
  const rx = VIEW.w - 16;
  text(ctx, 'SCORE ' + g.score, rx, 26, 18, '#fff3dc', 'right');
  const dayLeft = Math.max(0, DAY_LENGTH - g.time);
  const mm = Math.floor(dayLeft / 60);
  const ss = Math.floor(dayLeft % 60).toString().padStart(2, '0');
  text(ctx, '⏱ ' + mm + ':' + ss + '  •  ' + g.dayPart, rx, 48, 13, dayLeft < 20 ? '#ff6b5e' : '#c9bfa8', 'right');
  let hearts = '';
  for (let i = 0; i < MAX_HEARTS; i++) hearts += i < g.hearts ? '♥' : '♡';
  text(ctx, hearts, rx, 72, 16, '#ff6b5e', 'right');
  if (g.combo >= 2) {
    text(ctx, 'COMBO x' + (1 + (g.combo - 1) * 0.25).toFixed(2).replace(/0$/, ''), rx, 92, 13, '#ffd94d', 'right');
  }
}

function drawFloaters(ctx, g) {
  for (const f of g.floaters) {
    const alpha = 1 - f.t / f.life;
    ctx.globalAlpha = Math.max(0, alpha);
    text(ctx, f.text, f.x, f.y, 17, f.color, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawHintBar(ctx, g) {
  const near = nearestStation(g);
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  rr(ctx, 16, VIEW.h - 34, VIEW.w - 32, 24, 8); ctx.fill();
  const left = g.hint || (near ? STATIONS[near].label : 'WASD / arrows to move • click to walk • E to use a station • P pause • M mute');
  text(ctx, left, 28, VIEW.h - 17, 13, '#ffe9c4');
  text(ctx, 'Served ' + g.served + '  •  Best combo x' + (1 + Math.max(0, g.bestCombo - 1) * 0.25).toFixed(2).replace(/0$/, ''), VIEW.w - 28, VIEW.h - 17, 13, '#c9bfa8', 'right');
}

function drawBanner(ctx, g) {
  if (!g.banner) return;
  // A dark pill in the open floor, so the banner never covers a counter.
  const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 130);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#2b0d08';
  rr(ctx, 330, 218, 300, 64, 12); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ff3b2f';
  ctx.lineWidth = 3;
  rr(ctx, 330, 218, 300, 64, 12); ctx.stroke();
  ctx.globalAlpha = pulse;
  text(ctx, '🔥 ' + g.banner + ' 🔥', VIEW.w / 2, 248, 30, '#ff3b2f', 'center');
  ctx.globalAlpha = 1;
  text(ctx, g.rushCount + ' orders about to expire!', VIEW.w / 2, 270, 13, '#ffd94d', 'center');
}

// ---- screens ----

function overlay(ctx, alpha) {
  ctx.fillStyle = 'rgba(20,12,6,' + alpha + ')';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function drawTitle(ctx, g) {
  overlay(ctx, 0.55);
  text(ctx, '🍜  WARUNG RUSH  🍜', VIEW.w / 2, 180, 44, '#ffd94d', 'center');
  text(ctx, 'A tiny Indonesian street-kitchen rush', VIEW.w / 2, 214, 17, '#fff3dc', 'center');
  const lines = [
    'Take orders from the board, then run the kitchen:',
    'PANTRY → grab ingredients   •   CHOPPING BOARD → hold E to chop',
    'STOVE → cook rice, noodles, egg & chicken   •   PLATING → build the dish',
    'SERVING PASS → serve before the timer runs out!',
    '',
    'Nasi Goreng = rice + egg + chilli      Mie Ayam = noodles + chicken + greens',
    'Sate Ayam = chicken + peanut sauce     Gado-Gado = greens + egg + peanut sauce',
    '',
    'Serve on time for tips and combos. 3 missed orders and the day is over.',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW.w / 2, 258 + i * 24, l.startsWith('Nasi') ? 14 : 15, l.startsWith('Nasi') ? '#ffd98a' : '#fff3dc', 'center'));
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) text(ctx, 'Press ENTER or click to start cooking!', VIEW.w / 2, 500, 20, '#8be28b', 'center');
  text(ctx, 'WASD / arrows move  •  E use station  •  P pause  •  M mute', VIEW.w / 2, 536, 13, '#c9bfa8', 'center');
}

function drawPaused(ctx) {
  overlay(ctx, 0.6);
  text(ctx, 'PAUSED', VIEW.w / 2, 300, 44, '#ffd94d', 'center');
  text(ctx, 'Press P to keep cooking', VIEW.w / 2, 340, 17, '#fff3dc', 'center');
}

function drawEnd(ctx, g) {
  overlay(ctx, 0.65);
  const won = g.phase === 'complete';
  text(ctx, won ? '🎉  DAY COMPLETE!  🎉' : '💔  THE KITCHEN CLOSED  💔', VIEW.w / 2, 220, 38, won ? '#8be28b' : '#ff6b5e', 'center');
  text(ctx, won ? 'You survived the rush — the warung lives to cook another day!' : 'Too many orders lost. The crowd drifted away…', VIEW.w / 2, 258, 16, '#fff3dc', 'center');
  text(ctx, 'SCORE  ' + g.score, VIEW.w / 2, 330, 34, '#ffd94d', 'center');
  text(ctx, 'Dishes served: ' + g.served + '    Best combo: x' + (1 + Math.max(0, g.bestCombo - 1) * 0.25).toFixed(2).replace(/0$/, ''), VIEW.w / 2, 372, 16, '#fff3dc', 'center');
  text(ctx, 'Press R or ENTER to cook again', VIEW.w / 2, 430, 18, '#8be28b', 'center');
}

export function render(ctx, g) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx);
  const near = g.phase === 'playing' ? nearestStation(g) : null;
  drawPantry(ctx, g, near === 'pantry');
  drawChopping(ctx, g, near === 'chopping');
  drawStove(ctx, g, near === 'stove');
  drawPlating(ctx, g, near === 'plating');
  drawServing(ctx, g, near === 'serving');
  drawTrash(ctx, near === 'trash');
  drawChef(ctx, g);
  drawOrderBoard(ctx, g);
  drawFloaters(ctx, g);
  drawBanner(ctx, g);
  drawHintBar(ctx, g);
  if (g.phase === 'title') drawTitle(ctx, g);
  else if (g.phase === 'paused') drawPaused(ctx);
  else if (g.phase === 'over' || g.phase === 'complete') drawEnd(ctx, g);
}
