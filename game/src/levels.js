// Brick layouts: three sectors, each a 10x6 grid of tiers (0 = empty).
// Tier 1 = cyan (1 hit), tier 2 = amber (2 hits), tier 3 = magenta (3 hits).
import { CFG } from './config.js';

const L1 = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
  [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
];

const L2 = [
  [3, 0, 2, 0, 3, 3, 0, 2, 0, 3],
  [0, 2, 0, 2, 0, 0, 2, 0, 2, 0],
  [2, 0, 3, 0, 2, 2, 0, 3, 0, 2],
  [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
];

const L3 = [
  [3, 3, 2, 2, 3, 3, 2, 2, 3, 3],
  [3, 2, 1, 1, 2, 2, 1, 1, 2, 3],
  [2, 1, 1, 3, 1, 1, 3, 1, 1, 2],
  [2, 1, 3, 1, 1, 1, 1, 3, 1, 2],
  [3, 2, 1, 1, 2, 2, 1, 1, 2, 3],
  [3, 3, 2, 2, 3, 3, 2, 2, 3, 3],
];

const LAYOUTS = [L1, L2, L3];

export function buildBricks(level) {
  const layout = LAYOUTS[level - 1];
  const bricks = [];
  for (let row = 0; row < CFG.BRICK.rows; row++) {
    for (let col = 0; col < CFG.BRICK.cols; col++) {
      const tier = layout[row][col];
      if (!tier) continue;
      bricks.push({
        col, row,
        x: CFG.BRICK.x0 + col * (CFG.BRICK.w + CFG.BRICK.gap),
        y: CFG.BRICK.y0 + row * (CFG.BRICK.h + CFG.BRICK.gap),
        w: CFG.BRICK.w, h: CFG.BRICK.h,
        tier,
        hp: tier,
        maxHp: tier,
        flash: 0,
      });
    }
  }
  return bricks;
}
