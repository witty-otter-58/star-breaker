// Keyboard + mouse input, shared by the live game and the screenshot autopilot.
export function createInput(canvas) {
  const input = {
    left: false, right: false,
    action: false,
    mouseX: null,
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { input.left = true; e.preventDefault(); }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { input.right = true; e.preventDefault(); }
    if (e.code === 'Space') { input.action = true; e.preventDefault(); }
    if (input.onKey) input.onKey(e.code);
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
  });
  canvas.addEventListener('mousedown', () => { input.action = true; });
  return input;
}

// Autopilot: track the lowest ball's x (with a little lag so it looks human),
// launch when a ball is stuck, and fire the laser whenever it is ready.
export function autopilot(state, input) {
  const live = state.balls.filter((b) => !b.stuck);
  const stuck = state.balls.some((b) => b.stuck);
  if (stuck) input.action = true;
  if (state.paddle.laser > 0) input.action = true;
  if (!live.length) { input.mouseX = state.paddle.x; return; }
  let target = live[0];
  for (const b of live) if (b.y > target.y) target = b;
  // Aim slightly ahead of the ball's fall so the paddle arrives in time.
  const lead = target.vy > 0 ? Math.max(0, (CFG_PADDLE_Y - target.y) / target.vy) * target.vx * 0.7 : 0;
  input.mouseX = target.x + lead;
  input.left = false;
  input.right = false;
}

// Paddle line, shared with the autopilot's lead calculation.
export const CFG_PADDLE_Y = 556;
