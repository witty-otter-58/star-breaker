// Canvas drawing: starfield, bricks, paddle, balls, power-ups, bolts.
import { CFG } from './config.js';
import { PHASE } from './world.js';

export function render(ctx, state) {
  ctx.fillStyle = CFG.COLORS.bg;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  for (const s of state.stars) {
    const a = 0.35 + 0.35 * Math.sin(state.time * 1.5 + s.tw);
    ctx.fillStyle = `rgba(139,147,184,${a.toFixed(2)})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.strokeStyle = CFG.COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 60; x < CFG.W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); ctx.stroke();
  }

  // Bricks with a crack flash when freshly hit.
  for (const br of state.bricks) {
    const tier = CFG.TIERS[br.tier - 1];
    ctx.fillStyle = br.flash > 0 ? '#ffffff' : tier.color;
    ctx.fillRect(br.x, br.y, br.w, br.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(br.x, br.y + br.h - 5, br.w, 5);
    if (br.hp < br.maxHp) {
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(br.x + 8, br.y + 4);
      ctx.lineTo(br.x + br.w / 2, br.y + br.h / 2);
      ctx.lineTo(br.x + br.w - 8, br.y + br.h - 6);
      ctx.stroke();
    }
    if (br.flash > 0) br.flash -= 1 / 60;
  }

  // Power-ups.
  const pcol = { wide: '#3dff8e', multi: '#ff4fd8', laser: '#ffb347', slow: '#39e6ff' };
  const plabel = { wide: 'W', multi: 'M', laser: 'L', slow: 'S' };
  for (const pw of state.powers) {
    ctx.fillStyle = pcol[pw.kind];
    ctx.beginPath();
    ctx.arc(pw.x, pw.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#04121a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plabel[pw.kind], pw.x, pw.y + 0.5);
  }

  // Laser bolts.
  ctx.fillStyle = '#ffb347';
  for (const bolt of state.bolts) ctx.fillRect(bolt.x - 2, bolt.y - 12, 4, 12);

  // Paddle.
  const p = state.paddle;
  ctx.fillStyle = p.laser > 0 ? '#ffb347' : '#39e6ff';
  ctx.beginPath();
  ctx.roundRect(p.x - p.w / 2, CFG.PADDLE.y, p.w, CFG.PADDLE.h, 7);
  ctx.fill();
  if (p.wide > 0) {
    ctx.strokeStyle = '#3dff8e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x - p.w / 2, CFG.PADDLE.y, p.w, CFG.PADDLE.h, 7);
    ctx.stroke();
  }

  // Balls.
  for (const b of state.balls) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#39e6ff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r - 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles.
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life * 2);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  // Sector banner.
  if (state.messageT > 0 && state.message) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, CFG.W / 2, 320);
    ctx.globalAlpha = 1;
  }

  // Stuck-ball hint.
  if (state.phase === PHASE.PLAY && state.balls.some((b) => b.stuck)) {
    ctx.fillStyle = '#8b93b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click or press Space to launch', CFG.W / 2, CFG.H - 90);
  }
}
