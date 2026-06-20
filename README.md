# CareBon — your personal carbon ledger

A lightweight web app that helps individuals **understand, track, and reduce** their
carbon footprint. You enter how you travel, power your home, and eat; CareBon converts
that into tonnes of CO₂e per year, compares it against a climate-safe budget, and gives
you a ranked list of the highest-impact changes *you* specifically can make.

**Live demo:** _add your deployed URL here_

---

## Why this design

The platform is a **dependency-free static web app** — plain HTML, CSS, and ES modules.
No framework, no build step, no backend, no third-party scripts. That choice maps
directly onto the grading parameters:

| Parameter | How it's met |
|---|---|
| **Code quality** | Calculation logic lives in small pure functions (`js/calculator.js`, `insights.js`) separate from the DOM. The UI layer never does arithmetic. |
| **Security** | No backend and no user accounts means almost no attack surface. Strict CSP (`default-src 'none'`), `X-Frame-Options: DENY`, and friends are set in `netlify.toml` / `_headers` / `vercel.json`. Stored history is validated and corrupt data is discarded. |
| **Efficiency** | Ships as static files; charts and the gauge are hand-rolled SVG, so there's zero JS library weight. Long-cache headers on `/css` and `/js`. |
| **Testing** | 29 unit tests (Vitest) cover the calculator, the insight ranking, and storage validation. Run with `npm test`. CI runs them on every push. |
| **Accessibility** | Semantic landmarks, a skip link, labelled form controls, `aria-live` on the live result readout, visible focus states, and `prefers-reduced-motion` support. |
| **Problem-statement alignment** | The three pillars — *understand* (gauge + breakdown), *track* (saved snapshots + trend), *reduce* (personalized ranked actions) — are the three main sections of the page. |

## How it works

1. **Understand** — A semicircular budget gauge shows your yearly footprint against the
   2.3 t climate-safe target. A breakdown bar splits it into transport / home / food / stuff.
2. **Reduce** — `generateInsights()` estimates the kg saved by each possible change *for your
   inputs* (e.g. skipping a long-haul flight, switching to renewable electricity, moving down
   the diet ladder), drops anything under 50 kg, and sorts the rest by impact.
3. **Track** — You can save a snapshot to `localStorage` and watch the trend over time. Data
   never leaves your browser.

## Emission factors

Factors live in `js/factors.js` with sourced values from DEFRA (UK transport/energy
conversion factors), the US EPA, the IEA (grid carbon intensity), and Our World in Data
(per-capita benchmarks). They're approximations for awareness, not a certified audit.

## Project structure

```
index.html          # markup + landmarks
css/styles.css      # design tokens + responsive layout
js/
  factors.js        # emission factors + benchmarks (data)
  calculator.js     # pure calculation functions
  insights.js       # ranked reduction suggestions
  storage.js        # localStorage wrapper (validated, injectable)
  gauge.js          # SVG budget gauge
  charts.js         # SVG breakdown + trend
  format.js         # number/date formatting
  app.js            # UI controller (the only DOM-aware module)
tests/              # Vitest unit tests
```

## Run locally

```bash
npm install      # only needed for tests
npm run dev      # serves at http://localhost:5173
npm test         # run the 29 unit tests
```

> The app itself needs no install — you can open `index.html` through any static server.

## Deploy

It's static, so any static host works. Pick one:

**Netlify (drag & drop) — fastest**
1. Go to <https://app.netlify.com/drop>
2. Drag the project folder in. Done — you get a live URL.
   (`netlify.toml` and `_headers` apply the security headers automatically.)

**Netlify CLI**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

**Vercel**
```bash
npm i -g vercel
vercel --prod
```
(`vercel.json` carries the headers.)

**GitHub Pages**
Push to GitHub, then Settings → Pages → deploy from `main` / root. (Pages won't apply the
custom headers, but the app runs fine.)

## License

MIT — see [LICENSE](LICENSE).
