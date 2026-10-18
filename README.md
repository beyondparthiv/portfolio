# Parthiv Modi · Portfolio

Personal portfolio site: plain HTML, CSS and JavaScript with no build step and no dependencies.

## Highlights

- Terminal-style boot sequence and a particle field that morphs between code glyphs
- Snap-bracket cursor that locks onto links and buttons
- A playable **StockXchange** demo terminal: live candlestick chart, rumor-driven news that resolves TRUE or FAKE at the closing bell, buy/sell/short/pass, and a leaderboard against bots (simulated prices and headlines)
- Command palette (`Ctrl+K`), an interactive terminal in the contact section, and a konami-code easter egg
- Respects `prefers-reduced-motion`; responsive down to phone widths

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

| File | What it does |
|------|--------------|
| `index.html` | Page content |
| `styles.css` | Site styles |
| `script.js` | Boot sequence, cursor, particles, nav, command palette, terminal |
| `stockx.css` / `stockx.js` | The StockXchange demo terminal |
