# Star Breaker

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/witty-otter-58/star-breaker/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/witty-otter-58/star-breaker/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Star Breaker is a brick breaker: clear every brick in all 3 sectors without
letting the ball fall. Move the paddle with the mouse or arrow keys, launch
with click or Space, and catch falling power-ups — wide paddle, multiball,
laser, slow ball. Magenta bricks take 3 hits.

Open `game/index.html` in a desktop browser — it plays fully offline, no
network requests, no build step. Sound is synthesized with WebAudio.

## How to play

- **Move** mouse or arrow keys, **launch / fire laser** click or Space
- **P** pause, **M** mute, **R** restart

## Files

- `game/index.html` — page, HUD and overlays
- `game/src/config.js` — every tuning number
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized sound effects
- `game/src/levels.js` — the three sectors' brick layouts
- `game/src/world.js` — state, paddle, balls, bricks, power-ups, lives
- `game/src/render.js` — canvas drawing
- `game/src/input.js` — keyboard/mouse and the screenshot autopilot
- `game/src/shots.js` — `?shot=` staging (title/play/victory/defeat)
- `game/src/main.js` — shell, loop, HUD, overlays
