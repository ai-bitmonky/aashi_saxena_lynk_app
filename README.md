# LYNK — One route. Every mode.

LYNK compares metro, bus, auto and cab routes across Delhi NCR by **cost, time, reliability and convenience** in one place. Pick a trip, skip the modes you don't want, flip between Cheapest / Fastest / Convenient, see why a route scored what it did, then follow it step by step — with a live re-route offer, a rating and a fare split at the end.

No login, no sign-up: everything works anonymously. Your theme, saved modes and recent trips stay in your browser (`localStorage`).

> **Sample data.** Fares, times, reliability scores and station links are illustrative, not live. Only two pilot corridors are wired in (Dwarka Sec 21 → Connaught Place, Jahangirpuri → Majnu ka Tilla).

## Mobile and desktop views

LYNK ships two purpose-built views of the same engine:

| Screen width | View |
| --- | --- |
| **≥ 1024px** | **Desktop** — map-first layout with a route list and a side panel |
| **< 1024px** | **Mobile** — full-screen native-style app (phones full-bleed; tablets and narrow windows centred at max 600px) |

How `/` decides:

1. **Server first guess** — the `lynk_view` cookie if set, otherwise the user-agent / `Sec-CH-UA-Mobile` (phones and tablets → mobile, everything else → desktop).
2. **Client check** — before first paint the page measures the screen with `matchMedia('(min-width: 1024px)')`. If the other view fits, it stores `lynk_view` and reloads once. It keeps listening, so resizing a window across 1024px (or rotating a tablet) switches view too. A full reload is used on purpose: each view installs its own globals and document listeners. A session counter stops reload loops.

To force a view (handy for demos): **`/mobile`** and **`/desktop`** always show that view and never auto-switch.

The app is installable as a PWA (manifest, icons, standalone display, safe-area aware).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000  (runs the LYNK build step first)
npm run lint
npm run build    # production build (runs the LYNK build step first)
npm run start
```

## Where the code lives

```
lynk/                    UI source — the single source of truth
  shared/engine.js       data, scoring, state and actions (used by both views)
  shared/map.js          inline-SVG map (window.LynkMap, used by both views)
  mobile/                styles.css, native.css (app shell), body.html, ui.js, boot.js
  desktop/               styles.css, native.css, body.html, ui.js, init.js
  generated/             build output (git-ignored)
scripts/build-lynk.mjs   the LYNK build step
components/LynkApp.tsx   renders one view: its CSS, its markup, its script
components/ViewGuard.tsx client screen-width guard (auto view only)
lib/variant.ts           view rules (cookie, user-agent, 1024px breakpoint)
app/                     routes: / (auto), /mobile, /desktop, manifest, icons
```

The UI is plain browser JavaScript that shares globals by design (`UI`, `A`, `S`, document-level click delegation). Only one view's CSS and script is ever on a page.

### The build step

`npm run build:lynk` (run automatically by `predev` and `prebuild`) concatenates each view in order — mobile: `ui → engine → map → boot`, desktop: `ui → engine → map → init` — into one classic script and writes:

- `public/lynk/<view>.<hash>.js` — content-hashed, served with a long immutable cache
- `lynk/generated/manifest.json` — view → script file name
- `lynk/generated/<view>.css.ts` and `<view>.html.ts` — the view's CSS and markup as strings for server rendering

Both output folders are git-ignored; Vercel regenerates them during `npm run build`. Edit files under `lynk/`, never the generated ones.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fai-bitmonky%2Faashi_saxena_lynk_app&project-name=lynk)

Zero config: import the repo in Vercel (or use the button). The framework preset is detected as Next.js and `npm run build` runs the LYNK build step through `prebuild`. No environment variables are needed.
