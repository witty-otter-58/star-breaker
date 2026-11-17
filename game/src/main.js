// Shell: game loop, HUD, overlays, pause, best score, screenshot staging.
import { CFG } from './config.js';
import { PHASE, newState, startGame, step } from './world.js';
import { render } from './render.js';
import { createInput, autopilot } from './input.js';
import { applyShot, driftTitle } from './shots.js';
import { ensureAudio, startPad, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const state = newState(7);
state.best = Number(localStorage.getItem('star-breaker-best') || 0);

const $ = (id) => document.getElementById(id);
const overlays = {
  title: $('ov-title'), victory: $('ov-victory'),
  defeat: $('ov-defeat'), pause: $('ov-pause'),
};

function show(name) {
  for (const [k, el] of Object.entries(overlays)) el.classList.toggle('show', k === name);
}

function syncHud() {
  $('hud-score').textContent = state.score.toLocaleString();
  $('hud-lives').textContent = '●'.repeat(Math.max(0, state.lives)) + '○'.repeat(Math.max(0, 3 - state.lives));
  $('hud-level').textContent = `${Math.min(state.level, CFG.LEVELS)}/${CFG.LEVELS}`;
  $('hud-bricks').textContent = state.bricks.length;
  const p = state.paddle;
  const powers = [];
  if (p.wide > 0) powers.push(`Wide ${Math.ceil(p.wide)}s`);
  if (p.laser > 0) powers.push(`Laser ${Math.ceil(p.laser)}s`);
  if (state.balls.some((b) => b.slowT > 0)) powers.push('Slow');
  $('hud-power').textContent = powers.length ? powers.join(' · ') : '—';
  $('hud-best').textContent = state.best > 0 ? state.best.toLocaleString() : '—';
}

function afterPhaseChange() {
  if (state.phase === PHASE.PLAY) { show(null); }
  else if (state.phase === PHASE.VICTORY) {
    saveBest();
    $('vic-line').textContent = 'Every brick is dust. You win.';
    $('vic-stats').textContent = `Score ${state.score.toLocaleString()} · ${state.bricksBroken} bricks broken · ${state.ballsLost} balls lost · best ${state.best.toLocaleString()}`;
    show('victory');
  } else if (state.phase === PHASE.DEFEAT) {
    saveBest();
    $('def-line').textContent = `The last ball slipped past your paddle in sector ${state.level}.`;
    $('def-stats').textContent = `Score ${state.score.toLocaleString()} · ${state.bricksBroken} bricks broken · reached sector ${state.level}/${CFG.LEVELS}`;
    show('defeat');
  }
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('star-breaker-best', String(state.best)); } catch { /* private mode */ }
  }
}

function launch() {
  ensureAudio();
  startPad();
  startGame(state, 7);
  show(null);
}

$('btn-start').addEventListener('click', launch);
$('btn-again-v').addEventListener('click', launch);
$('btn-again-d').addEventListener('click', launch);
$('btn-resume').addEventListener('click', () => {
  state.phase = state.prevPhase;
  show(null);
});

input.onKey = (code) => {
  if (code === 'KeyM') { const m = toggleMute(); document.querySelector('.sub').textContent = m ? 'muted — press M to unmute' : 'brick breaker · 3 sectors · clear them all'; }
  if (code === 'KeyP') {
    if (state.phase === PHASE.PLAY) { state.prevPhase = PHASE.PLAY; state.phase = PHASE.PAUSE; show('pause'); }
    else if (state.phase === PHASE.PAUSE) { state.phase = state.prevPhase; show(null); }
  }
  if (code === 'KeyR' && state.phase !== PHASE.TITLE) launch();
  if (code === 'Enter' && state.phase === PHASE.TITLE) launch();
};

// Screenshot staging: ?shot=title|play|victory|defeat runs the real game fast.
const shot = new URLSearchParams(location.search).get('shot');
let staged = false;
if (shot) {
  try {
    applyShot(state, input, shot);
    staged = true;
    if (state.phase === PHASE.VICTORY || state.phase === PHASE.DEFEAT) afterPhaseChange();
    else show(null);
  } catch (err) {
    console.error('shot staging failed', err);
  }
}

let last = performance.now();
let prevPhase = state.phase;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!staged) {
    if (state.phase === PHASE.TITLE) driftTitle(state, dt);
    else if (state.phase === PHASE.PLAY) step(state, input, dt);
  } else if (state.phase === PHASE.PLAY) {
    // Keep a staged play scene alive: the autopilot keeps playing.
    autopilot(state, input);
    step(state, input, dt);
  }
  if (state.phase !== prevPhase) { afterPhaseChange(); prevPhase = state.phase; }
  render(ctx, state);
  syncHud();
  requestAnimationFrame(frame);
}
syncHud();
requestAnimationFrame(frame);
