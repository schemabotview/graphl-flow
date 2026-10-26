# CLAUDE.md

`@graphlearning/graphl-flow` — a declarative diagram engine for GraphL content repos. Successor in
spirit to `ui-flow` (`@graphlearning/flow`), rebuilt small. `README.md` is the consumer contract.

## Commands

```bash
npm run dev      # fixture harness, vite :5175 — #/<fixtureId>, ?theme=dark|light, ?capture=1
npm run capture  # [ids…] [--theme dark|light] [--out dir] → 3840×2160 PNGs (own vite on :5176)
npm run build    # vite lib build + tsc declarations + copy styles.css → dist/
npm run check    # every fixture × 2 themes at 3840×2160, measured (own vite on :5178)
npx tsc --noEmit # type-only pass
```

## Architecture

`Scene` (author-written tree) → `Scene.tsx` renders nested grids → measure node rects → `edges.ts`
routes (pure) → `Edges.tsx` draws an SVG + HTML labels inside the scaled content → fit to pane.

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
- **Output is a YouTube 4K frame, recorded the way ui-shell records it**: a 3840×2160 viewport at
  deviceScaleFactor 1 (`record-course.mjs`, `shots-4k.mjs`). Measured identical in sharpness to
  1920×1080 @2×, but match the shell so a still and the video are the same frame. `?capture=1`
  renders only the scene, filling the viewport; `data-fit="ready"` (fonts loaded + fitted) is the
  recorder's signal. A capture names its theme in the URL — headless Chrome has no saved state.
- **An ITEM hugs its content; a GROUP stretches.** The item's box is what an edge anchors to — a
  stretched unframed leaf would end every arrow at empty space (the first edge build did exactly that
  while every endpoint assertion passed).
- **The gap is where an arrow is drawn.** A body some edge runs ACROSS (the edge's lowest common
  ancestor, derived from the scene) gets `EDGE_GAP`; a labelled edge widens it to the label's
  MEASURED size + `LABEL_ROOM` a side, on the axis it crosses. That is a second layout pass;
  `data-fit="ready"` waits for it to settle.
- **Routing** (`edges.ts`, pure): pick faces from the edge's two SIDES — the children of its lowest
  common ancestor holding each end — never from the nodes themselves: two nested nodes in adjacent
  columns can sit diagonally with the larger gap vertical, and the edge then cuts through the column
  between (the first barclays-azure render did). Leave across the sides' LARGER gap; a face with ONE edge anchors at its
  centre — or, when both ends are alone and the faces overlap, straight across the overlap's middle
  (no jog between items of different heights) — several get ports sliding to the far end (clamped `PORT_INSET`), spread evenly if any two
  fall within `PORT_MIN_GAP`. Endpoints sit `ANCHOR_OUTSET` (4px) outside the box. Rects are measured
  in the content's natural coordinates (bounding rect ÷ fit scale), so edges scale with the scene.
- **Icons** (`icons.tsx`): lucide / Azure / AWS / brand (simple-icons) in ONE key space — `merge`
  THROWS on a key defined twice, so a shadowed icon is a page error the check catches. Keys follow
  `@graphlearning/flow` where both have the icon (lucide `monitor`/`git` became `screen`/`branch`,
  since Azure `monitor` and brand `git` own those names). Every icon is a named or per-file import,
  so only registered ones ship (~50 vendor drawings ≈ 170 kB, 53 kB gzip); add a key when a scene
  needs it. `icons-<set>` fixtures render every key, so the sweep draws each one in both themes.
- **Azure tiles need `viewBox="0 0 18 18"`** — the package ships none. A **brand** mark under
  `BRAND_MIN_CONTRAST` against the surface draws in ink (Kafka/GitHub on dark, DuckDB on light).
- **simple-icons' 5 MB `index.mjs`** would ride in the sourcemap's `sourcesContent`;
  `vite.config.ts` drops node_modules sources after the write (Vite's printed map size is pre-drop).
- `src/index.ts` is the whole public surface: `Scene` plus the model types. Every export is a promise.
- `dev/fixtures/index.ts` is the harness catalog and what `check` sweeps; every capability gets a
  fixture. `dev/fixtures/studies/` holds architecture-scale cases — `barclays-azure` varies SCALE
  (50+ nodes, three nesting levels, five columns over two `span: 'all'` rails).

## Invariants

- Scenes are declarative — never x/y or pixel sizes.
- `react`, `react-dom`, `lucide-react` are **peer** deps; `vite.config.ts` `external` enforces it.
- A theme owns the shade; a `tone` owns the hue family, the same in every theme. No per-repo
  theming. Theme values stay 6-digit hex.
- IBM Plex Sans ships as a real dependency via `styles.css`.
- The viewport is locked and text is selectable: no wheel/drag handlers, `user-select: text`.

## Done means

`npm run build` clean, `npx tsc --noEmit` clean, `npm run check` passes, AND the fixtures look right
(`npm run capture`, then look). Check is a floor, not proof: the first edge build passed every
endpoint assertion with arrows ending at empty space. When a capture shows a defect the check missed,
add the assertion that catches it, and confirm it FAILS on the old code before trusting it.
A breaking layout change is a **major** version — content repos pin and upgrade deliberately.
