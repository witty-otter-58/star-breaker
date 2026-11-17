// Synthesized sound effects with WebAudio — no audio files needed.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfxPaddle() { tone(330, 0.06, 'square', 0.05, 440); }
export function sfxBrick() { tone(520, 0.08, 'triangle', 0.07, 260); }
export function sfxHard() { tone(180, 0.1, 'sawtooth', 0.08, 90); }
export function sfxWall() { tone(240, 0.05, 'sine', 0.04); }
export function sfxLose() { tone(220, 0.4, 'sawtooth', 0.1, 55); }
export function sfxPower() { tone(660, 0.12, 'sine', 0.09, 990); }
export function sfxLaser() { tone(990, 0.08, 'square', 0.05, 440); }
export function sfxLevel() { tone(440, 0.15, 'sine', 0.08, 660); setTimeout(() => tone(660, 0.2, 'sine', 0.08, 880), 110); }
export function sfxWin() { tone(523, 0.15, 'sine', 0.09); setTimeout(() => tone(659, 0.15, 'sine', 0.09), 130); setTimeout(() => tone(784, 0.3, 'sine', 0.09), 260); }

// A quiet ambient pad: two detuned sines through a low gain, started once.
let padOn = false;
export function startPad() {
  if (!ctx || padOn) return;
  padOn = true;
  const g = ctx.createGain();
  g.gain.value = 0.016;
  g.connect(ctx.destination);
  for (const f of [65.4, 65.9, 130.8]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g);
    o.start();
  }
}
