# CLAUDE.md

`@graphlearning/graphl-flow` — a declarative diagram engine for GraphL content repos. Successor in
spirit to `ui-flow` (`@graphlearning/flow`), rebuilt small. `README.md` is the consumer contract.

## Commands

```bash
npm run dev      # fixture gallery, vite :5175 — sidebar + theme toggle; #/<fixtureId>, ?theme=, ?capture=1
npm run capture  # [ids…] [--theme dark|light] [--out dir] → 3840×2160 PNGs (own vite on :5177;
                 # 5176 is @graphlearning/shell's dev harness)
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
- **Nested groups**: a group inside a group draws as a plain card (`surface`) — unless it sets its
  OWN `tone` (`data-toned`), which restores its tint and coloured border. Inherited tone colours the
  card's contents only. Group heads carry `badge`, `icon`, `title` and `sub`.
- **The canvas is the PLATFORM's.** `theme.ts` `bg` equals @graphlearning/shell's `--bg`
  (`#1a1d23` dark, `#f7f8fa` light), so a scene sits in the shell's frame with no edge. Change one,
  change both.
- **`focus`** (a `<Scene>` prop — the shell passes `section.focus`) sets `data-focus` on whatever
  element carries that id, after render, so it reaches nodes, rows, lines and entries without any
  renderer knowing. Drawn by box-shadow: NO layout effect. `check` asserts `spark-focus` lands on
  exactly `spark-topology`'s fit (`SAME_FIT` groups, `dev/fixtures/index.ts`).
- **Colour is CSS variables set from `theme.ts`.** The scene root sets `--gf-*`; a node with `tone`
  overrides `--gf-accent`/`--gf-tint` and descendants inherit — that is how tone inheritance works.
- **The fit is a PURE function** (`fit.ts`) of the pane's and the content's `offsetWidth/Height`
  (layout sizes, untouched by the transform): 4% margin per side, scale clamped 0.05–8, centred.
  Pure is what makes recordings reproducible — same natural box, same pixels.
- **Output is a true 4K frame (3840×2160 pixels), recorded the way ui-shell records it**: a
  3840×2160 viewport at deviceScaleFactor 1, as `record-course.mjs` and `shots-4k.mjs` do —
  `capture.mjs` and `check.mjs` both use exactly that. (1920×1080 at deviceScaleFactor 2 gives the
  same pixel count and measured identical sharpness; it was dropped so a still and the video are the
  same frame.) `?capture=1` renders only the scene, filling the viewport. `data-fit="ready"` is the
  recorder's signal: fonts loaded, edges routed, the label-gap pass settled, and the fit applied.
  A capture names its theme in the URL — headless Chrome has no saved state.
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
  ONE keyword set serves every language — 0.5 added Java's (the primitive types, `record`, `sealed`,
  `switch`, `final`…), thin enough before that `int x` read as two plain names; the price is a word
  another language uses as a NAME, which the set already charged (`count`, `set`, `order`). `@Name`
  is ONE token drawn as a keyword — a Java annotation and a Python decorator are the same mark — and
  a number carries its separators and suffix (`1_000_000L`, `3.14f`), which `\d[\d.]*` had split
  into a number and a name.
- **Plots** (`Plot.tsx`): x/y are DATA; the drawing area is one fixed `PLOT_W × PLOT_H` for every
  plot. Inside the SVG the browser does not lay out, so ALL plot text is Plex Mono and the gutters are
  COUNTED in characters (`CHAR_W` rounded up); `check` measures every `<text>` against its SVG, which
  is how an end label pushed above the area (O(n²) ending at y.max) was caught — labels are clamped
  inside the area. Ramp order ingest/infra/serve/store keeps green and orange apart and leaves red
  for warnings; it advances only for series that use it. A plain segment is a muted construction line.
  The overflow sweep skips SVG elements (their client box is meaningless).
- **Legibility is a property of WIDTH, not font size.** The fit scales the whole scene, so raising
  every font by X% widens the boxes by ~X% and the zoom drops to match; only the CHROME (padding,
  gaps, icons) is fixed. The levers: the reading measure (`.gf-item > div { max-width: 15em }` — wrap,
  don't widen), tight chrome (`GAP` 10, `EDGE_GAP` 32, group padding 10), a type scale of 16px body /
  15px secondary, icons in EM (row 2em, card 3em, chip 1.15em, group head 1.25em) so they keep their
  ratio to text, and `MAX_SCALE` 4 so a small scene is not a poster. Barclays went 20px → 25px body
  text at 4K. `check` enforces floors in the 4K frame: body text ≥ `BODY_MIN_PX` (24 = 12px at
  1080p) and item icons ≥ `ICON_MIN_PX` (32); both are env-overridable, and a 26px floor fails
  Barclays — it is the densest scene the engine should be asked to render. A 16:9 frame holds less
  than a 3:2 reference image at the same text size; when a scene fails, split it.
- **Placement shared by every node** (`spanStyle`): `span`, the `minW`/`minH` FLOORS, the
  `maxW`/`maxH` CAPS (`w`/`h` = both), and `fill` (stretch to the cell instead of hugging). A cap
  holds a column FIXED: content wider than it OVERFLOWS (check fails it) instead of moving the frame
  — the IDE side pane is `w: 560`, and a too-wide table placed in it failed the check while the fit
  stayed put. A `bare` group has no frame, fill or padding — use it
  for groups that only arrange. Floors exist for CONSISTENCY: the fit is a pure function of the
  natural box, so frames with identical floors get identical zoom; `check` asserts every frame in
  `SAME_FIT` (`studies/ide-frame.ts`, exposed by the gallery as `data-same-fit`) lands on the same
  transform, and fails when the floors are removed. `SAME_FIT` is EVERY IDE frame, so no IDE frame
  draws an edge between columns (it widens the gap it crosses, `EDGE_GAP`, and moves the panes);
  `highlight` + narration point at code instead. Edges inside the side pane stay inside its fixed
  column and are fine (`ide-side-memory`).
- **A plot never scales.** It has TWO fixed sizes: the default area and `compact` (420×280) for a
  side pane. Scaling a full plot into 560px shrank its text to ~65% — unreadable on video.
- **Notebook cells** (0.4): a cell is a GROUP variant (`cell: n` → `data-cell`), not a node type: a
  `[n]` gutter fixed in `ch` (so every input starts at the same x) beside a col body holding the input
  `code` (bar hidden, stretched) and its outputs. Printed output is `code.output` — plain ink text, no
  frame, `! ` errors, lines still addressable. A DataFrame is a `table`, a chart a `plot`: no new
  output types. `notebook-frame.ts` is the study; its frames are a `SAME_FIT` group, like the IDE's.
- **Tree** (`Tree.tsx`): entries addressable as `<tree>.<path>` via `treeEntryIds` (shared with the
  planner like `tableRows`/`codeRows`); a `folder` with no listed children draws collapsed; a file's
  icon defaults by extension (`.py` → the Python mark, `.java` → Java's) through the shared icon
  key space.
- **Note**: dashed callout, fills its column (capped at 34em so it stays a paragraph elsewhere).
- **An edge naming an unknown id logs `console.error`** — never a silent skip (a fixture pointed at
  line 18 of a 17-line file and drew 2 of 3 edges). `check` fails on any console error, and reports
  each with its fixture and theme.
- **The edge pulse's period is a RECORDER CONTRACT.** `PULSE_S = 2.4` in `Edges.tsx` must equal
  `PULSE_S` in ui-shell's `record-course.mjs` / `record-reels.mjs`; changing it here alone breaks no
  build and puts a visible jump at every loop join of every recorded video. Linear `animateMotion`,
  same as @graphlearning/flow's FlowEdge; a bidirectional edge runs a second dot backwards
  (`keyPoints="1;0"`) and uses one marker with `orient="auto-start-reverse"`. `capture.mjs` pauses
  every SVG at t = 0 so a still is reproducible (repeat captures differ only by blur anti-aliasing,
  ≤ 8/255).
- **Arrowheads: the shaft stops `HEAD_TRIM` short of a headed end**, inside the head, and the
  marker's `refX` moves back by the same amount so the tip lands on the endpoint. Untrimmed, the
  2px stroke poked out past the tip as a blunt stub (near its point the triangle is narrower than the
  line) — on every arrow, visible at 4K. The path's `d` is the TRIMMED stroke; `data-route` holds the
  full route, which the pulse travels and `check` measures endpoints against.
- **Channel SLOTS.** Everything that lands in a channel — an elbow's cross segment, a straight edge's
  label — gets its own evenly spaced slot (edge order, deterministic). Keyed by axis + bounds, NOT
  direction (driver → workers and workers → driver share one gap). Without slots Spark's dashed back
  edge ran under the `tasks` label; `check` now fails any edge running under another edge's label.
  **A slot keeps a full arrowhead's run (`HEAD_LEN` 10) to each anchor**, and a SHARED channel's gap
  widens to `slotRoom(n)` = 2 × (4 + 10) + (n − 1) × `SLOT_GAP` 8 in the same second layout pass as
  labels (one slot needs 28, inside `EDGE_GAP`, so only shared channels grow). In 0.2 three arrows
  fanning into one node through a 32px gap left a 4px last run; the 6px `HEAD_TRIM` reversed the
  shaft and the head pointed back into the gap with every face assertion green (python-ct's
  main.py frame). `trim` now never pulls past a run's other end, and `check` fails a drawn shaft
  that runs against its route (`edge-fan-in`, `edge-fan-in-h`). 0.3.0: of every fixture only
  `edge-fan-in`'s frame moved — a scene's box grows only where a shared channel had to widen.
  Heads on ONE face must also sit ≥ 10 apart (`check`: "arrowheads crowd"): ports spread within a
  face, and four arrows into a one-line card land ~6px apart in one blob. The router cannot make
  room without growing the node, so aim a fan-in at a taller node (`edge-fan-in-h`'s sink is stacked).
- **`spread`** makes a group a flex column whose body takes the stretched height and spaces its
  rows (`align-content: space-evenly`). Opt-in: on a plain grid body, `align-content: normal` would
  STRETCH the tracks and every nested group with them.
- **Elbows sit mid-CHANNEL**
  There is no obstacle avoidance: an edge crosses only the gap between two siblings, so a scene lays
  a pointer's target beside its row. `check` fails any edge that crosses an unrelated node.
- **Icons** (`icons.tsx`): lucide / Azure / AWS / brand (simple-icons) in ONE key space — `merge`
  THROWS on a key defined twice, so a shadowed icon is a page error the check catches. Keys follow
  `@graphlearning/flow` where both have the icon (lucide `monitor`/`git` became `screen`/`branch`,
  since Azure `monitor` and brand `git` own those names). Every icon is a named or per-file import,
  so only registered ones ship (~70 vendor drawings ≈ 200 kB, 65 kB gzip); add a key when a scene
  needs it. `icons-<set>` fixtures render every key, so the sweep draws each one in both themes.
- **Java's mark is OpenJDK's** — simple-icons ships no Java icon (the trademark is Oracle's), so
  `java` draws `siOpenjdk`, with `maven` and `junit` added beside it (0.5). `code-java` is the
  fixture: a Maven project tree, a record with a switch expression, and a `@Test`.
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
  the `ide-side-*` frames (and `nb-*`, the notebook) vary the FRAME (explorer | editor over terminal | fixed side pane);
  `spark-topology` (ported from @graphlearning/flow) varies the SHAPE — a repeated unit three levels
  deep (worker → executor → task chips), an edge against the flow, edges leaving a group from inside.

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

## Releasing

1. `npm run check` passes and the changed fixtures look right (`npm run capture`).
2. `npm version <patch|minor|major> --no-git-tag-version`, commit, push.
3. Smoke-test the TARBALL, not the repo: `npm pack`, install it into a fresh Vite + React app with
   the peer deps, `tsc` with `skipLibCheck: false` (checks our `.d.ts`), `vite build`, and render a
   scene using every node type. 0.1.0 was verified this way. Never publish an untested tarball — a
   consumer resolves `styles.css`'s font imports through OUR dependencies, which the repo cannot show.
4. `npm publish` (`prepublishOnly` rebuilds `dist/`; `publishConfig.access` is public).

