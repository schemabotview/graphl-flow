# CLAUDE.md

`@graphlearning/graphl-flow` — a declarative diagram engine for GraphL content repos. Successor in
spirit to `ui-flow` (`@graphlearning/flow`), rebuilt small. `README.md` is the consumer contract.

## Commands

```bash
npm run dev      # fixture gallery, vite :5175 — sidebar + theme toggle; #/<fixtureId>, ?theme=, ?capture=1
npm run capture  # [ids…] [--theme dark|light] [--out dir] → 3840×2160 PNGs (own vite on :5176)
npm run build    # vite lib build + tsc declarations + copy styles.css → dist/
npm run check    # every fixture × 2 themes at 3840×2160, measured (own vite on :5178)
npx tsc --noEmit # type-only pass
```

## Architecture

`Scene` (author-written tree) → `Scene.tsx` renders nested grids → measure node rects → `routing.ts`
routes (pure) → `Edges.tsx` draws an SVG + HTML labels inside the scaled content → fit to pane.

- **The browser does layout.** No sizers, no font-width tables. The engine owns only edges and fit.
- **Seven node types:** `group` (container), `item`, `table`, `code`, `plot`, `tree` and `note` (leaves). A new visual is an `item` variant or a
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
- **Routing** (`routing.ts`, pure): pick faces from the edge's two SIDES — the children of its lowest
  common ancestor holding each end — never from the nodes themselves: two nested nodes in adjacent
  columns can sit diagonally with the larger gap vertical, and the edge then cuts through the column
  between (the first barclays-azure render did). Leave across the sides' LARGER gap; a face with ONE edge anchors at its
  centre — or, when both ends are alone and the faces overlap, straight across the overlap's middle
  (no jog between items of different heights) — several get ports sliding to the far end (clamped `PORT_INSET`), spread evenly if any two
  fall within `PORT_MIN_GAP`. Endpoints sit `ANCHOR_OUTSET` (4px) outside the box. Rects are measured
  in the content's natural coordinates (bounding rect ÷ fit scale), so edges scale with the scene.
- **Tables** (`Table.tsx`): `tableRows` assigns each row its ADDRESS (`table.row` — explicit `id`,
  else the first cell when it is a plain word, unique in the table) and is shared by the renderer
  (`data-id` on the `<tr>`) and the edge planner (rows are their table's children), so the two cannot
  disagree. Memory diagrams are COMPOSED — groups of tables plus edges from rows — never a node type.
  A row connects only left/right (`lateral` in the router): its top and bottom are inside its table.
  The inner `<table>` is `width: 100%`, or a title wider than the cells leaves the rows' faces short
  of the border and the arrow starts inside the box (memory-hashmap did; `check` now asserts it).
- **Code** (`Code.tsx`, `highlight.ts`): `codeRows` is the one source of drawn lines (shared with
  the planner via `codeLineIds`, like `tableRows`); lines are `<code>.L<n>` with the FILE's number
  and connect left/right like rows. The highlighter is a regex + keyword set ported from
  `@graphlearning/flow`; the comment marker is the only per-language rule, and shell has no
  `method` class (`job.py` is a file). Token colours live in `theme.ts` (`code`), never as CSS
  literals. Folds print `··· N lines` with U+00B7. The line-number gutter is `content-box` with a
  `min-width` — under the scene's `border-box`, `width: 3ch` held the padding and clipped `10`.
- **Plots** (`Plot.tsx`): x/y are DATA; the drawing area is one fixed `PLOT_W × PLOT_H` for every
  plot. Inside the SVG the browser does not lay out, so ALL plot text is Plex Mono and the gutters are
  COUNTED in characters (`CHAR_W` rounded up); `check` measures every `<text>` against its SVG, which
  is how an end label pushed above the area (O(n²) ending at y.max) was caught — labels are clamped
  inside the area. Ramp order ingest/infra/serve/store keeps green and orange apart and leaves red
  for warnings; it advances only for series that use it. A plain segment is a muted construction line.
  The overflow sweep skips SVG elements (their client box is meaningless).
- **Placement shared by every node** (`spanStyle`): `span`, the `minW`/`minH` FLOORS, the
  `maxW`/`maxH` CAPS (`w`/`h` = both), and `fill` (stretch to the cell instead of hugging). A cap
  holds a column FIXED: content wider than it OVERFLOWS (check fails it) instead of moving the frame
  — the IDE side pane is `w: 560`, and a too-wide table placed in it failed the check while the fit
  stayed put. A `bare` group has no frame, fill or padding — use it
  for groups that only arrange. Floors exist for CONSISTENCY: the fit is a pure function of the
  natural box, so frames with identical floors get identical zoom; `check` asserts every frame in
  `SAME_FIT` (`studies/ide-frame.ts`, exposed by the gallery as `data-same-fit`) lands on the same
  transform, and fails when the floors are removed. `ide-side-edge` is deliberately outside the set:
  an edge widens the gap it crosses (`EDGE_GAP`), so a frame with a cross-column arrow has its own fit.
- **A plot never scales.** It has TWO fixed sizes: the default area and `compact` (420×280) for a
  side pane. Scaling a full plot into 560px shrank its text to ~65% — unreadable on video.
- **Tree** (`Tree.tsx`): entries addressable as `<tree>.<path>` via `treeEntryIds` (shared with the
  planner like `tableRows`/`codeRows`); a `folder` with no listed children draws collapsed; a file's
  icon defaults by extension (`.py` → the Python mark) through the shared icon key space.
- **Note**: dashed callout, fills its column (capped at 34em so it stays a paragraph elsewhere).
- **An edge naming an unknown id logs `console.error`** — never a silent skip (a fixture pointed at
  line 18 of a 17-line file and drew 2 of 3 edges). `check` fails on any console error, and reports
  each with its fixture and theme.
- **Elbows sit mid-CHANNEL** — the gap between the edge's two sides — not midway between the nodes.
  There is no obstacle avoidance: an edge crosses only the gap between two siblings, so a scene lays
  a pointer's target beside its row. `check` fails any edge that crosses an unrelated node.
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
- `dev/fixtures/index.ts` is the harness catalog and what `check` sweeps (scripts enumerate the
  gallery's `a[data-fixture]`); `CATEGORIES` sorts each fixture into exactly one sidebar section and
  throws otherwise. The gallery keeps its selection in STATE and only mirrors it to the hash, so a
  static build of it works where the URL cannot route; every capability gets a
  fixture. `dev/fixtures/studies/` holds architecture-scale cases — `barclays-azure` varies SCALE
  (50+ nodes, three nesting levels, five columns over two `span: 'all'` rails); `ide-frame` and
  the `ide-side-*` frames vary the FRAME (explorer | editor over terminal | fixed side pane).

## Invariants

- Scenes are declarative — never x/y or pixel sizes.
- `react`, `react-dom`, `lucide-react` are **peer** deps; `vite.config.ts` `external` enforces it.
- A theme owns the shade; a `tone` owns the hue family, the same in every theme. No per-repo
  theming. Theme values stay 6-digit hex.
- IBM Plex Sans and Mono ship as real dependencies via `styles.css` (Mono: table cells and code).
- **No two module paths may differ only by case** (extension ignored). macOS/Windows resolve
  `./Edges` case-insensitively — it found `edges.ts`, not `Edges.tsx`. `check` fails on a clash.
- The viewport is locked and text is selectable: no wheel/drag handlers, `user-select: text`.

## Done means

`npm run build` clean, `npx tsc --noEmit` clean, `npm run check` passes, AND the fixtures look right
(`npm run capture`, then look). Check is a floor, not proof: the first edge build passed every
endpoint assertion with arrows ending at empty space. When a capture shows a defect the check missed,
add the assertion that catches it, and confirm it FAILS on the old code before trusting it.
A breaking layout change is a **major** version — content repos pin and upgrade deliberately.
