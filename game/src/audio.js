// audio.js — Warung Rush: every sound is synthesized with WebAudio.
// One job: bleeps, sizzles and a little gamelan-flavoured tune. No audio files.

let ctx = null;
let muted = false;
let musicTimer = null;

// A short pentatonic riff, played as soft triangle plucks. Gamelan-flavoured:
// pelog-ish steps over a low gong note every bar.
const TUNE = [
  [0, 523.25], [1, 587.33], [2, 698.46], [3, 587.33],
  [4, 523.25], [5, 440.0], [6, 523.25], [7, 698.46],
  [8, 783.99], [9, 698.46], [10, 587.33], [11, 523.25],
  [12, 440.0], [13, 392.0], [14, 440.0], [15, 523.25],
];
const BEAT = 0.21; // seconds per step

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(m) {
  muted = !!m;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, lowpass) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(660, 0.09, 'sine', 0.16); tone(880, 0.08, 'sine', 0.12, 0.05); },
  putdown() { tone(440, 0.08, 'sine', 0.14); },
  chop() { noiseBurst(0.06, 0.5, 1800); tone(180, 0.05, 'square', 0.08); },
  chopped() { tone(523, 0.1, 'triangle', 0.18); tone(784, 0.12, 'triangle', 0.16, 0.07); },
  sizzle() { noiseBurst(0.35, 0.16, 5200); },
  cooked() { tone(1046, 0.14, 'sine', 0.2); tone(1318, 0.2, 'sine', 0.18, 0.09); },
  plated() { tone(587, 0.09, 'triangle', 0.16); tone(740, 0.09, 'triangle', 0.14, 0.06); },
  served() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.18, i * 0.07)); },
  wrong() { tone(220, 0.18, 'sawtooth', 0.12, 0, 160); },
  expired() { tone(330, 0.25, 'sawtooth', 0.14, 0, 220); tone(247, 0.3, 'sawtooth', 0.12, 0.12, 180); },
  order() { tone(880, 0.1, 'sine', 0.14); tone(1174, 0.14, 'sine', 0.12, 0.08); },
  click() { tone(700, 0.05, 'square', 0.08); },
  burn() { noiseBurst(0.4, 0.3, 900); tone(140, 0.35, 'sawtooth', 0.12, 0, 90); },
  gameover() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.16)); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.1)); },
};

export function startMusic() {
  if (!ctx || musicTimer) return;
  let step = 0;
  const tick = () => {
    if (!ctx || muted) return;
    const [beat, freq] = TUNE[step % TUNE.length];
    void beat;
    tone(freq, 0.24, 'triangle', 0.055);
    if (step % 16 === 0) tone(130.81, 1.4, 'sine', 0.09); // low gong
    if (step % 4 === 2) tone(freq / 2, 0.2, 'sine', 0.03);
    step++;
  };
  tick();
  musicTimer = window.setInterval(tick, BEAT * 1000);
}

export function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
