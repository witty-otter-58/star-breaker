// ?shot=title|play|victory|defeat — stage a real scene for screenshots.
// The autopilot plays by the real rules; nothing is faked, only driven faster.
import { CFG } from './config.js';
import { PHASE, newState, startGame, step } from './world.js';
import { autopilot } from './input.js';

export function applyShot(state, input, shot) {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed') || 7);
  if (shot === 'title') {
    Object.assign(state, newState(seed));
    state.phase = PHASE.TITLE;
    startGame(state, seed);
    // Park the game on the title screen with a live sector behind it.
    state.phase = PHASE.TITLE;
    state.drift = true;
    return;
  }
  if (shot === 'play') {
    startGame(state, seed);
    // Fast-forward just long enough for real action (ball flying, a few
    // bricks gone, paddle moving) while the field is still mostly full.
    runAutopilot(state, input, 45);
    return;
  }
  if (shot === 'victory') {
    startGame(state, seed);
    runAutopilot(state, input, 1800);
    return;
  }
  if (shot === 'defeat') {
    startGame(state, seed);
    runAutopilot(state, input, 120, true);
    return;
  }
}

// Drive the autopilot for up to maxSeconds of game time, several steps per
// call so a full game finishes in well under a second of wall time.
function runAutopilot(state, input, maxSeconds, park = false) {
  const dt = 1 / 60;
  let guard = 0;
  const maxSteps = maxSeconds * 60;
  while (guard++ < maxSteps) {
    if (state.phase === PHASE.VICTORY || state.phase === PHASE.DEFEAT) break;
    if (state.phase !== PHASE.PLAY) break;
    if (park) {
      // Park the paddle at the far left so balls drop: the defeat path.
      input.mouseX = 30;
      input.left = false;
      input.right = false;
      input.action = state.balls.some((b) => b.stuck);
    } else {
      autopilot(state, input);
    }
    step(state, input, dt);
  }
}

// Gentle title-screen drift: the ball bounces on its own behind the overlay.
export function driftTitle(state, dt) {
  if (!state.drift) return;
  state.time += dt;
  const b = state.balls[0];
  if (!b) return;
  if (b.stuck) {
    b.stuck = false;
    b.vx = 260;
    b.vy = -340;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
  if (b.x > CFG.W - b.r) { b.x = CFG.W - b.r; b.vx = -Math.abs(b.vx); }
  if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
  if (b.y > CFG.H - b.r) { b.y = CFG.H - b.r; b.vy = -Math.abs(b.vy); }
  state.paddle.x = b.x;
}
