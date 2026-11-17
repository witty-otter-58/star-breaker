// All tuning numbers for Star Breaker live here.
export const CFG = {
  W: 960,
  H: 600,
  LEVELS: 3,
  PADDLE: { w: 110, h: 14, y: 556, speed: 560, wideW: 170, wideTime: 12 },
  BALL: { r: 8, speed: 430, maxSpeed: 640 },
  BRICK: { cols: 10, rows: 6, w: 88, h: 24, gap: 6, x0: 20, y0: 62 },
  // Brick hit points by colour tier.
  TIERS: [
    { hp: 1, color: '#39e6ff', score: 50 },
    { hp: 2, color: '#ffb347', score: 100 },
    { hp: 3, color: '#ff4fd8', score: 150 },
  ],
  POWER_DROP: 0.18,
  POWER_FALL: 150,
  LASER_CD: 0.4,
  LASER_SPEED: 700,
  SLOW_TIME: 8,
  COLORS: { bg: '#070818', grid: '#12142e' },
};
