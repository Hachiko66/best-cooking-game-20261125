// input.js — Warung Rush: keyboard (WASD/arrows + E/Space) and mouse click-to-move.
// One job: turn raw browser events into a clean per-frame input snapshot.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0, // -1..1 from keys
    moveY: 0,
    interactHeld: false,
    interactPressed: false, // true for exactly one frame after a press
    click: null, // { x, y } canvas coords, consumed by the game
    clickStation: null,
    pausePressed: false,
    restartPressed: false,
    startPressed: false,
    mutePressed: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function onKeyDown(e) {
    if (e.repeat) {
      if (KEYMAP[e.code]) e.preventDefault();
      return;
    }
    if (KEYMAP[e.code]) {
      keys.add(KEYMAP[e.code]);
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyE' || e.code === 'Space') {
      if (!state.interactHeld) state.interactPressed = true;
      state.interactHeld = true;
      e.preventDefault();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      state.pausePressed = true;
    } else if (e.code === 'KeyR') {
      state.restartPressed = true;
    } else if (e.code === 'Enter') {
      state.startPressed = true;
    } else if (e.code === 'KeyM') {
      state.mutePressed = true;
    }
  }

  function onKeyUp(e) {
    if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
    if (e.code === 'KeyE' || e.code === 'Space') state.interactHeld = false;
  }

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onMouseDown(e) {
    const p = canvasPoint(e);
    state.click = p;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  // Read the held keys into a movement vector. Call once per frame.
  function poll() {
    state.moveX = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    state.moveY = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (state.moveX !== 0 && state.moveY !== 0) {
      const inv = 1 / Math.SQRT2;
      state.moveX *= inv;
      state.moveY *= inv;
    }
    return state;
  }

  // Clear the one-frame edge flags after the game has read them.
  function endFrame() {
    state.interactPressed = false;
    state.pausePressed = false;
    state.restartPressed = false;
    state.startPressed = false;
    state.mutePressed = false;
    state.click = null;
    state.clickStation = null;
  }

  return { state, poll, endFrame };
}
