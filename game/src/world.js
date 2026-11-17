// Game state and rules: paddle, balls, bricks, power-ups, levels, lives.
import { CFG } from './config.js';
import { mulberry32 } from './random.js';
import { buildBricks } from './levels.js';
import { sfxPaddle, sfxBrick, sfxHard, sfxWall, sfxLose, sfxPower, sfxLaser, sfxLevel, sfxWin } from './audio.js';

export const PHASE = { TITLE: 'title', PLAY: 'play', VICTORY: 'victory', DEFEAT: 'defeat', PAUSE: 'pause' };

export function newState(seed = 7) {
  const rng = mulberry32(seed);
  return {
    seed, rng,
    phase: PHASE.TITLE,
    prevPhase: PHASE.TITLE,
    time: 0,
    level: 1,
    score: 0,
    lives: 3,
    best: 0,
    paddle: { x: CFG.W / 2, w: CFG.PADDLE.w, wide: 0, laser: 0, laserCd: 0 },
    balls: [],
    bricks: [],
    powers: [],
    bolts: [],
    particles: [],
    stars: Array.from({ length: 80 }, () => ({ x: rng() * CFG.W, y: rng() * CFG.H, s: 0.5 + rng() * 1.5, tw: rng() * Math.PI * 2 })),
    message: '',
    messageT: 0,
    ballsLost: 0,
    bricksBroken: 0,
  };
}

function stickBall(state) {
  const p = state.paddle;
  return { x: p.x, y: CFG.PADDLE.y - CFG.BALL.r - 1, vx: 0, vy: 0, r: CFG.BALL.r, stuck: true };
}

export function startGame(state, seed = 7) {
  const fresh = newState(seed);
  Object.assign(state, fresh);
  state.phase = PHASE.PLAY;
  state.bricks = buildBricks(1);
  state.balls = [stickBall(state)];
  state.message = 'SECTOR 1';
  state.messageT = 2;
}

function nextLevel(state) {
  state.level++;
  if (state.level > CFG.LEVELS) {
    state.phase = PHASE.VICTORY;
    sfxWin();
    return;
  }
  state.bricks = buildBricks(state.level);
  state.balls = [stickBall(state)];
  state.powers = [];
  state.bolts = [];
  state.score += 500 * (state.level - 1);
  state.message = `SECTOR ${state.level}`;
  state.messageT = 2;
  sfxLevel();
}

function loseBall(state) {
  state.ballsLost++;
  state.lives--;
  sfxLose();
  if (state.lives <= 0) {
    state.phase = PHASE.DEFEAT;
    return;
  }
  state.balls = [stickBall(state)];
  state.powers = [];
  state.bolts = [];
}

function burst(state, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const sp = 50 + state.rng() * 150;
    state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + state.rng() * 0.4, color });
  }
}

function dropPower(state, x, y) {
  if (state.rng() > CFG.POWER_DROP) return;
  const kinds = ['wide', 'multi', 'laser', 'slow'];
  state.powers.push({ kind: kinds[Math.floor(state.rng() * kinds.length)], x, y, vy: CFG.POWER_FALL, life: 12 });
}

function breakBrick(state, b) {
  const tier = CFG.TIERS[b.tier - 1];
  b.hp--;
  b.flash = 0.12;
  if (b.hp > 0) { sfxHard(); return; }
  state.bricks = state.bricks.filter((x) => x !== b);
  state.bricksBroken++;
  state.score += tier.score * state.level;
  burst(state, b.x + b.w / 2, b.y + b.h / 2, tier.color, 12);
  dropPower(state, b.x + b.w / 2, b.y + b.h / 2);
  sfxBrick();
  if (!state.bricks.length) nextLevel(state);
}

function launchBall(state, ball) {
  if (!ball.stuck) return;
  ball.stuck = false;
  const a = -Math.PI / 2 + (state.rng() - 0.5) * 0.5;
  ball.vx = Math.cos(a) * CFG.BALL.speed;
  ball.vy = Math.sin(a) * CFG.BALL.speed;
}

function fireLaser(state) {
  const p = state.paddle;
  if (p.laser <= 0 || p.laserCd > 0) return;
  p.laserCd = CFG.LASER_CD;
  state.bolts.push({ x: p.x - p.w / 4, y: CFG.PADDLE.y - 10, vy: -CFG.LASER_SPEED });
  state.bolts.push({ x: p.x + p.w / 4, y: CFG.PADDLE.y - 10, vy: -CFG.LASER_SPEED });
  sfxLaser();
}

export function step(state, input, dt) {
  if (state.phase !== PHASE.PLAY) return;
  state.time += dt;
  const p = state.paddle;
  if (state.messageT > 0) state.messageT -= dt;
  if (p.wide > 0) p.wide -= dt;
  if (p.laser > 0) p.laser -= dt;
  if (p.laserCd > 0) p.laserCd -= dt;
  p.w = p.wide > 0 ? CFG.PADDLE.wideW : CFG.PADDLE.w;

  // Paddle: mouse sets a target, arrows nudge it.
  if (input.mouseX !== null && input.mouseX !== undefined) {
    const target = input.mouseX;
    const diff = target - p.x;
    const maxStep = CFG.PADDLE.speed * dt;
    p.x += Math.max(-maxStep, Math.min(maxStep, diff));
  }
  if (input.left) p.x -= CFG.PADDLE.speed * dt;
  if (input.right) p.x += CFG.PADDLE.speed * dt;
  p.x = Math.max(p.w / 2, Math.min(CFG.W - p.w / 2, p.x));

  // Launch / laser on action.
  if (input.action) {
    input.action = false;
    for (const b of state.balls) if (b.stuck) launchBall(state, b);
    fireLaser(state);
  }

  // Slow-ball timer lives on the balls themselves; apply via a flag.
  let slow = false;
  for (const b of state.balls) if (b.slowT > 0) { slow = true; break; }

  // Balls.
  for (const b of state.balls) {
    if (b.stuck) {
      b.x = p.x;
      b.y = CFG.PADDLE.y - b.r - 1;
      continue;
    }
    if (b.slowT > 0) b.slowT -= dt;
    const sp = slow ? 0.6 : 1;
    b.x += b.vx * sp * dt;
    b.y += b.vy * sp * dt;
    // Walls.
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); sfxWall(); }
    if (b.x > CFG.W - b.r) { b.x = CFG.W - b.r; b.vx = -Math.abs(b.vx); sfxWall(); }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); sfxWall(); }
    // Paddle.
    if (b.vy > 0 && b.y + b.r >= CFG.PADDLE.y && b.y - b.r <= CFG.PADDLE.y + CFG.PADDLE.h &&
        Math.abs(b.x - p.x) <= p.w / 2 + b.r) {
      let off = Math.max(-1, Math.min(1, (b.x - p.x) / (p.w / 2)));
      // Never let the ball leave dead vertical: a straight up-and-down loop
      // through one cleared column would stall the game forever.
      if (Math.abs(off) < 0.12) off = (state.rng() < 0.5 ? -1 : 1) * 0.12;
      const ang = -Math.PI / 2 + off * 1.05;
      const speed = Math.min(CFG.BALL.maxSpeed, Math.hypot(b.vx, b.vy) + 6);
      b.vx = Math.cos(ang) * speed;
      b.vy = Math.sin(ang) * speed;
      b.y = CFG.PADDLE.y - b.r - 0.5;
      sfxPaddle();
    }
    // Bricks: circle vs AABB, resolve on the shallow axis.
    for (const br of state.bricks) {
      const nx = Math.max(br.x, Math.min(b.x, br.x + br.w));
      const ny = Math.max(br.y, Math.min(b.y, br.y + br.h));
      const dx = b.x - nx, dy = b.y - ny;
      if (dx * dx + dy * dy < b.r * b.r) {
        const overlapX = br.w / 2 + b.r - Math.abs(b.x - (br.x + br.w / 2));
        const overlapY = br.h / 2 + b.r - Math.abs(b.y - (br.y + br.h / 2));
        if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
        breakBrick(state, br);
        if (state.phase !== PHASE.PLAY) return;
        break;
      }
    }
  }
  // Balls that fell.
  const fallen = state.balls.filter((b) => !b.stuck && b.y - b.r > CFG.H);
  if (fallen.length) {
    state.balls = state.balls.filter((b) => !fallen.includes(b));
    if (!state.balls.length) loseBall(state);
    if (state.phase !== PHASE.PLAY) return;
  }

  // Laser bolts vs bricks.
  for (const bolt of state.bolts) {
    bolt.y += bolt.vy * dt;
    for (const br of state.bricks) {
      if (bolt.x >= br.x && bolt.x <= br.x + br.w && bolt.y >= br.y && bolt.y <= br.y + br.h) {
        bolt.y = -9999;
        breakBrick(state, br);
        if (state.phase !== PHASE.PLAY) return;
        break;
      }
    }
  }
  state.bolts = state.bolts.filter((b) => b.y > -100);

  // Power-ups fall and are caught by the paddle.
  for (const pw of state.powers) {
    pw.y += pw.vy * dt;
    pw.life -= dt;
    if (Math.abs(pw.x - p.x) <= p.w / 2 + 10 && pw.y >= CFG.PADDLE.y - 10 && pw.y <= CFG.PADDLE.y + CFG.PADDLE.h + 14) {
      pw.life = 0;
      sfxPower();
      if (pw.kind === 'wide') p.wide = CFG.PADDLE.wideTime;
      else if (pw.kind === 'laser') p.laser = 12;
      else if (pw.kind === 'slow') { for (const b of state.balls) b.slowT = CFG.SLOW_TIME; }
      else if (pw.kind === 'multi') {
        const src = state.balls.find((b) => !b.stuck) || state.balls[0];
        if (src && !src.stuck) {
          for (const ang of [-0.5, 0.5]) {
            const sp = Math.hypot(src.vx, src.vy);
            const base = Math.atan2(src.vy, src.vx) + ang;
            state.balls.push({ x: src.x, y: src.y, vx: Math.cos(base) * sp, vy: Math.sin(base) * sp, r: src.r, stuck: false, slowT: 0 });
          }
        }
      }
      state.score += 25;
    }
  }
  state.powers = state.powers.filter((pw) => pw.life > 0 && pw.y < CFG.H + 20);

  // Particles.
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);
}
