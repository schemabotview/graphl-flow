# CLAUDE.md

`@graphlearning/graphl-flow` — a declarative diagram engine for GraphL content repos. Successor in
spirit to `ui-flow` (`@graphlearning/flow`), rebuilt small. `README.md` is the consumer contract.

## Commands

```bash
npm run dev      # fixture harness, vite :5175 — #/<fixtureId>, ?theme=dark|light, ?capture=1
npm run capture  # [ids…] [--theme dark|light] [--out dir] → 3840×2160 PNGs (own vite on :5176)
npm run build    # vite lib build + tsc declarations + copy styles.css → dist/
npx tsc --noEmit # type-only pass
```

## Architecture

`Scene` (author-written tree) → `Scene.tsx` renders nested flex/grid → (planned) measure rects →
route edges in an SVG overlay → fit to pane.

- **The browser does layout.** No sizers, no font-width tables. The engine owns only edges and fit.
- **Two node types:** `group` (container) and `item` (leaf). A new visual is an `item` variant or a
  new leaf type (a renderer + one union member) — never a new layout system.
- **Every body is CSS grid** (`bodyStyle` in `Scene.tsx`): row = one `auto` track per non-spanning
  child, col = one, grid = `cols`; `span: 'all'` is `1 / -1`. Not flex — a spanning child must not
  change the scene's natural (`max-content`) width, which the fit will scale.
- **Colour is CSS variables set from `theme.ts`.** The scene root sets `--gf-*`; a node with `tone`
  overrides `--gf-accent`/`--gf-tint` and descendants inherit — that is how tone inheritance works.
- **The fit is a PURE function** (`fit.ts`) of the pane's and the content's `offsetWidth/Height`
  (layout sizes, untouched by the transform): 4% margin per side, scale clamped 0.05–8, centred.
  Pure is what makes recordings reproducible — same natural box, same pixels.
- **Output is a YouTube 4K frame**: a 1920×1080 CSS frame shot at device scale 2. `?capture=1`
  renders only that frame at the page origin; `data-fit="ready"` (fonts loaded + fitted) is the
  recorder's signal. A capture names its theme in the URL — headless Chrome has no saved state.
- **Icons** (`icons.ts`) are imported from lucide by NAMED import only, so the bundle stays small.
- `src/index.ts` is the whole public surface: `Scene` plus the model types. Every export is a promise.
- `dev/fixtures/index.ts` is the harness catalog; every capability gets a fixture.

## Invariants

- Scenes are declarative — never x/y or pixel sizes.
- `react`, `react-dom`, `lucide-react` are **peer** deps; `vite.config.ts` `external` enforces it.
- A theme owns the shade; a `tone` owns the hue family, the same in every theme. No per-repo
  theming. Theme values stay 6-digit hex.
- IBM Plex Sans ships as a real dependency via `styles.css`.
- The viewport is locked and text is selectable: no wheel/drag handlers, `user-select: text`.

## Done means

`npm run build` clean, `npx tsc --noEmit` clean, and the fixtures render correctly at `npm run dev`.
A breaking layout change is a **major** version — content repos pin and upgrade deliberately.
