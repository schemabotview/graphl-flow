# CLAUDE.md — graphl-flow

> Workspace rules and the coupled-values table: `../CLAUDE.md`. Consumer contract: `README.md`.
> The WHY behind every rule below — history, measurements, the bug each closed: `docs/DECISIONS.md`
> (cited as D1…D38).

`@graphlearning/graphl-flow` — a declarative diagram engine for GraphL content repos. Successor in
spirit to `ui-flow` (`@graphlearning/flow`), rebuilt small.

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

| area | rule | D |
|---|---|---|
| layout | The browser does layout; the engine owns only edges and fit. No sizers, no font-width tables | 1 |
| node types | Eight: `group` (container) + `item`, `table`, `code`, `plot`, `tree`, `note`, `tty`. A new visual is an `item` variant or a new leaf (renderer + one union member) — never a new layout system | 2 |
| bodies | Every body is CSS grid (`bodyStyle`), never flex: a spanning child must not change the natural `max-content` width | 3 |
| nesting | A nested group is a plain card unless it sets its OWN `tone` (`data-toned`) | 4 |
| canvas | `theme.ts` `bg` equals the shell's `--bg` (`#1a1d23` / `#f7f8fa`) | 5 |
| focus | `data-focus` set after render on whatever carries the id; box-shadow only, NO layout effect | 6 |
| colour | CSS variables from `theme.ts`; `tone` overrides `--gf-accent`/`--gf-tint`, descendants inherit | 7 |
| fit | A PURE function (`fit.ts`) of layout sizes: 4% margin (a scene's `padding` overrides, 0–0.2), scale clamped 0.05–8, centred | 8 |
| output | A true 4K frame: 3840×2160 viewport at deviceScaleFactor 1, as the shell's recorders; `data-fit="ready"` = fonts, edges, label-gap pass, fit; a capture names its theme in the URL | 9 |
| boxes | An ITEM hugs its content (edges anchor to it); a GROUP stretches | 10 |
| gaps | A body an edge crosses gets `EDGE_GAP`; a label widens it (`LABEL_ROOM`) — a second layout pass | 11 |
| routing | Faces from the edge's two SIDES (children of the lowest common ancestor), across the LARGER gap; ports, `PORT_INSET`, `PORT_MIN_GAP`, `ANCHOR_OUTSET` 4px; rects in natural coordinates | 12 |
| tables | `tableRows` assigns each row its ADDRESS, shared by renderer and planner; rows connect left/right only; inner `<table>` is `width: 100%`; memory diagrams are COMPOSED | 13 |
| code | `codeRows` is the one source of lines (`<code>.L<n>`, FILE numbers); ONE keyword set for every language except HCL's block words and shell's own; `@Name` one token; token colours in `theme.ts` | 14 |
| plots | x/y are DATA; one fixed `PLOT_W × PLOT_H`; all plot text Plex Mono, gutters counted in chars; labels clamped inside the area | 15 |
| legibility | A property of WIDTH, not font size: 15em measure, tight chrome, 16/15px type, icons in em, `MAX_SCALE` 4; `check` floors `BODY_MIN_PX` 24, `ICON_MIN_PX` 32. When a scene fails, split it | 16 |
| placement | `spanStyle`: `span`, `minW`/`minH` FLOORS, `maxW`/`maxH` CAPS, `w`/`h`, `fill`; a cap holds a column fixed (overflow fails check); `SAME_FIT` frames share one transform; no edges between IDE columns | 17 |
| plots in panes | A plot never scales: default area or `compact` 420×280; a `w` sizes the plot to a fixed column and the drawing area takes what the gutters leave | 18 |
| notebooks | A cell is a GROUP variant (`cell: n`), not a node type; output is `code.output`, `table`, `plot` | 19 |
| consoles | `console: true` is a REAL transcript; command iff a prompt (`parsePrompt`); a `cols`-wide command wrapped; tokenized WHOLE then cut back; output is INK; a row is always one row tall | 20 |
| psql | `parsePrompt` knows `%/%R%x%# `; continuation rows join the command, tokenized as `sql`; `dedent` drops only ONE leading blank line; comments stop at `\n` | 21 |
| tty | Fixed `cols` × rows grid; takes the console's slot at the same `w`/`h` | 22 |
| shell/config | Shell has its own keywords; paths, `@` and `web-01` stay plain; `ini` line-shaped; `nginx` first word only | 23 |
| tree | Entries addressable as `<tree>.<path>` (`treeEntryIds`); file icon by extension | 24 |
| note | Dashed callout, fills its column, capped at 34em | 25 |
| unknown ids | An edge naming an unknown id logs `console.error`, never a silent skip; `check` fails on any console error | 26 |
| pulse | **`PULSE_S = 2.4` in `Edges.tsx` is a recorder contract** (ui-shell `record-course.mjs` / `record-reels.mjs`); `capture.mjs` pauses every SVG at t = 0 | 27 |
| arrowheads | The shaft stops `HEAD_TRIM` short of a headed end; `d` is the trimmed stroke, `data-route` the full route | 28 |
| slots | Each thing in a channel gets its own slot (axis + bounds, not direction); a slot keeps `HEAD_LEN` 10 to each anchor; shared channels widen to `slotRoom(n)`; heads on one face ≥ 10 apart — aim a fan-in at a taller node | 29 |
| spread | `spread` is opt-in: a flex column with `align-content: space-evenly` | 30 |
| obstacles | None: an edge crosses only the gap between two siblings; `check` fails an edge across an unrelated node | 31 |
| icons | ONE key space; `merge` THROWS on a duplicate key; named imports only; add a key when a scene needs it; `icons-<set>` fixtures draw every key | 32 |
| icon sets | `java` draws OpenJDK's mark (D33); AWS in three kinds — service tiles, group marks, resource glyphs (D34); Azure tiles need `viewBox="0 0 18 18"`, a low-contrast brand mark draws in ink (`BRAND_MIN_CONTRAST`) (D35) | 33–35 |
| gcp icons | Google Cloud's own icons, generated into `src/gcp-icons.ts` by `scripts/gen-gcp-icons.mjs` from the pinned `@iconify-json/gcp` (a dev dependency): only the keys listed ship; GCP keys that clash with AWS/Azure get a prefix (`cloudkms`, `gcpiam`) | 39 |
| sourcemap | `vite.config.ts` drops node_modules sources (simple-icons' 5 MB `index.mjs`) after the write | 36 |
| surface | `src/index.ts` is the whole public surface: `Scene` plus the model types. Every export is a promise | 37 |
| fixtures | `dev/fixtures/index.ts` is the harness catalog and what `check` sweeps; every capability gets a fixture; `CATEGORIES` sorts each into exactly one section; `dev/fixtures/studies/` holds architecture-scale cases | 38 |

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
