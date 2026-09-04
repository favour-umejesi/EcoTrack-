# EcoTrack

An honest ledger of what you take from the world, and the habits worth keeping.

EcoTrack helps people see what their everyday choices cost the air, in numbers that show their sources, and then nudges them toward the habits that actually help: mend, thrift, share, take the bus. It started as a freshman-year carbon calculator and is being rebuilt as a community tool against over-consumption and fast fashion.

## What it does

- **Calculator.** Log a typical week: commute, home energy, food, flights, and the clothes you buy. Every line is quantity × a published emission factor, with the factor set and grid source named on the page. Distances and gas can be entered in local units; the engine stays metric.
- **Insights.** A breakdown of where the footprint comes from, a comparison to your country's average, and field notes from the Climate Almanac, each one cited.
- **Track.** Month by month progress compared with your own baseline, never with strangers. Points only ever go up.
- **Community.** Real things members did, with a photo of the work and the estimated impact. Adopt an action and it counts toward your points.
- **Character.** Members appear as a chosen character. Email and login never show anywhere.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm test` runs the engine tests, `npm run lint` runs ESLint, and `npm run build` type-checks and produces the production build.

## Status

This is the UI-first phase. Every screen works on mock data and a pure calculation engine. There is no backend, database, or authentication yet.

| Piece | Status |
|---|---|
| Calculation engine, `src/lib/engine.ts` | Real formulas. Factor values are illustrative placeholders until the factor build script exists. |
| Calculator inputs | Real, saved in the browser so guests keep their answers between pages. |
| Country list and units, `src/data/countries.ts`, `src/lib/units.ts` | Real. Country → continent → world fallback for missing factors. |
| Field notes and Almanac answers, `src/data/mock.ts` | Hand-written stand-ins with real sources. The real version retrieves passages from a curated library. |
| Tracking history, points, streaks, community posts, profile | Mock data. |
| Sign in | A mock toggle. |
| Photos | Stand-ins; composer uploads preview locally and never leave the browser. |

## Where things live

- `src/app/` one folder per page: `/`, `/calculator`, `/insights`, `/track`, `/community`, `/community/new`, `/profile`
- `src/components/Bits.tsx` the paper scraps, stamps, tags, fields, buttons, sketches and icons that make up the visual language
- `src/components/Motion.tsx` the scroll-in motion system
- `src/lib/engine.ts` the footprint calculation and action savings formulas, with tests beside it
- `src/data/` mock content and the country list
- `public/textures/`, `public/sketch/`, `public/images/` paper textures, ink sketches cut from the original illustration, the wordmark, and placeholder photos
- `design/` source artwork: the original illustration, the cut-out wordmark and stickers, textures, and the fern engraving
- `pencil-new.pen` the design file, opened with Pencil

## Design

The look is a naturalist's ledger: aged paper, typewriter labels, rubber stamps, pinned notes, and ink sketches cut from the original EcoTrack illustration. Type is IM Fell English, Crimson Pro, Special Elite and Caveat, all from Google Fonts. Motion respects the reduced-motion setting.

## License

MIT
