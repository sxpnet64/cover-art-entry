# cover-art-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sxpnet64/cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sxpnet64/cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio turns your own photos into a multi-panel GTA-style poster cover: three panel layouts, per-panel crop and positioning (zoom, pan, or drag right on the preview), one photo filling every panel or a different photo per panel, an editable bold caption with a Vice City sunset or neon grade — and exports a PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080, fully offline. All artwork is drawn in code; no Rockstar logo, artwork or font is used, and photos are read on your machine, never uploaded. Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — upload a photo (or load a sample), pick a layout, crop each panel, edit the caption, and hit Export PNG. To hand the entry in, run `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, which copies app/ and screenshots/ to the output directory and writes dossier.json.

---

<sub>Entered on [make.fun](https://make.fun/?ref=86976acr&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
