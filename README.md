[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Hachiko66/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Hachiko66/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Warung Rush 🍜

A tiny Indonesian street-kitchen time-management game, built for make.fun's
["Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137)
bounty ($250 in USDC).

You are the cook of a small warung. Orders land on the board with a countdown —
grab ingredients from the pantry, chop them, cook them on the stove, assemble the
dish on the plating counter and serve it at the pass before the timer runs out.
Serve on time for tips and combo multipliers; let three orders die and the
kitchen closes. The day runs 150 seconds, from a calm morning into the lunch
rush and the dinner rush, with orders arriving faster and timers getting shorter.

## Dishes

- **Nasi Goreng** — cooked rice + cooked egg + chilli
- **Mie Ayam** — cooked noodles + cooked chicken + chopped greens
- **Sate Ayam** — cooked chicken + peanut sauce
- **Gado-Gado** — chopped greens + cooked egg + peanut sauce

## How to play

- **WASD / arrow keys** — move the chef. **Click** — walk to a spot (click a
  station to walk over and use it).
- **E / Space** — use the station in front of you (hold E to chop).
- **P** — pause. **M** — mute. **R** — restart after the day ends.

All art is drawn in canvas code and all sound is synthesized with WebAudio —
no network requests, no external files. The game runs entirely offline from
static files.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Node 22 or later. No build step, no dependencies.

## Layout

- `game/index.html` — the page, one canvas
- `game/src/config.js` — layout, palette and tuning
- `game/src/recipes.js` — ingredients and dishes
- `game/src/kitchen.js` — game state and rules
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sounds and music
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `game/src/main.js` — bootstrap and game loop
- `main.ts` — the make.fun hand-in program (Node 22 stdlib only)
- `screenshots/` — renders of the game's own code

## License

MIT — see [LICENSE](LICENSE).
