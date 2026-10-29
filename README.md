# @graphlearning/graphl-flow

Declarative architecture diagrams for React. Describe **groups**, **items** and **edges**; the
browser lays them out and the engine draws the arrows. Scenes never contain x/y.

> 0.1.0 — seven node types (`group`, `item`, `table`, `code`, `plot`, `tree`, `note`), edges,
> two themes, fit-to-frame for 4K recording. Content repos pin a version and upgrade deliberately.

## Install

```bash
npm i @graphlearning/graphl-flow react react-dom lucide-react
```

```tsx
import '@graphlearning/graphl-flow/styles.css' // once, at the app root
import { Scene, type SceneModel } from '@graphlearning/graphl-flow'

const scene: SceneModel = {
  title: 'Batch & Real-Time',
  dir: 'row',
  nodes: [
    { type: 'group', id: 'src', title: 'Data Sources', tone: 'source', children: [
      { type: 'item', id: 'crm', title: 'CRM' },
    ] },
    { type: 'group', id: 'ing', title: 'Ingestion', badge: 1, tone: 'ingest', children: [
      { type: 'item', id: 'adf', title: 'Azure Data Factory', sub: 'Scheduled pipelines' },
    ] },
  ],
  edges: [{ from: 'src', to: 'ing' }],
}

<div style={{ width: 3840, height: 2160 }}>  {/* the Scene fills its parent — give it a size */}
  <Scene scene={scene} theme="dark" />
</div>
```

**Edges** connect any two nodes by id — items or groups, at any depth — as right-angle arrows.
An edge leaves across the larger gap between the two columns (or rows) it connects, so it stays in
the gaps rather than cutting through a neighbour; ends that face each other connect straight. A face with several edges gives each its
own port, and their labels move off the line (above/below) so they don't collide. The gap an edge
runs through widens automatically, to fit its label when it has one. An edge between a node and its
own ancestor is not drawn. `bidirectional: true` puts a head at both ends.

**Pulse.** A dot travels every edge once per **2.4 s**, linear — both ways on a bidirectional edge.
That period is the recorder's loop (`PULSE_S` in `@graphlearning/shell`'s recorders), so a looped
video has no jump at the join. `pulse: false` on a scene turns it off. `npm run capture` freezes the
animation at t = 0, so stills are reproducible.

**`dashed: true`** draws a group's frame dashed — a boundary that is a PLACE, not a thing (an AWS
Region or Availability Zone, as AWS's own diagrams draw them). Only the line style changes, so
dashing a group never moves anything.

**`spread: true`** on a group spaces its children evenly over its full height when the group is
stretched taller than them (a short column beside a tall one).

**Tables and memory.** A `table` is a DB schema, a stack frame, a heap object, an array or a hash
map's buckets. Every row is addressable as `<table id>.<first cell>` (or `.<id>` when you set one), so
a pointer is just an edge: `{ from: 'main.nums', to: 'list' }`. There is no memory node type —
stack and heap are groups of tables:

```ts
{ type: 'group', id: 'stack', title: 'Stack', children: [
  { type: 'table', id: 'main', title: '<module>', rows: [['nums', '●'], ['total', 3]] },
] },
{ type: 'table', id: 'list', title: 'list', columns: ['index', 'ref'], rows: [['0', '●'], ['1', '●']] },
// edges: [{ from: 'main.nums', to: 'list' }]
```

A row connects through its left or right end only. Lay a pointer's target BESIDE its row (the next
column), not below it — an edge is routed in the gap between two siblings, never around a third.
`tag` draws a short pill before a row (`PK`, `FK`, `sp`); `tone` on a row tints it.

**Code.** `code` takes the source as a (template-literal) string; its common indent is dropped.
`lang` is `python | sql | scala | java | js | ts | shell | hcl | ini | nginx | nft | text` — one small highlighter with seven
token colours per theme, sharing one keyword set (Java's primitive types, `record`, `sealed` and
`switch` included); an `@Name` — a Java annotation, a Python decorator — draws as a keyword, and a
number keeps its separators and suffix (`1_000_000L`). `show` keeps only those line ranges and folds
each skipped run into `··· N lines`; `show` and `highlight` use the FILE's line numbers, and so do
edges: `src.L17`.
`terminal: true` draws a terminal — `$ ` lines are commands, `! ` lines errors, the rest output;
`show` folds a terminal too (0.6), so a long plan keeps its command, resource line and summary.
Shell (0.7) has its own keywords (`if then fi for do done case`…), never the shared set: before it,
`/var/www` drew `var` as a keyword. Config languages (0.7) — `ini` (a systemd unit: `[Section]`,
`Key=`), `nginx` (a statement's first word is the directive) and `nft` (nftables) — have their own
words too; in shell and config files `@` and `.` are parts of an address, not an annotation or a
member access.

**Consoles (0.7).** `console: true` draws a REAL transcript, row for row as an 80-column terminal
showed it — no `$ ` convention, no `!` marks, nothing edited. A row that starts with a prompt is a
command — `ana@web-01:~$` (Debian), `[ana@web-02 ~]$` (Red Hat), `ana@mac ~ %` (zsh) — drawn in the
prompt's colours, red for root's `#`; every other row is output, in ink. A command row exactly `cols`
(default 80) wide wrapped, so the rows after it continue the command, and the command is highlighted
whole across the wrap. `show`, `highlight` and `focus` (`con.L12`) work as on code.

A full-screen program is a **`tty`**: `screen` (its rows), `cols?` (80), `inverse?` and `bold?` runs
as `[row, from, to)` — a fixed grid, padded to `cols`, so two captures of `top` are the same box.
Its rows are `tty.R<n>`.

**Console frames (0.7).** Two columns, both FIXED: the console (or a `tty` in its slot, same `w`/`h`) |
the PICTURE of what it just showed — a `bare` group of the rest of 16:9. No edges between them; ring
the console line with `focus`. See `dev/fixtures/studies/console-frame.ts`.

**IDE frames.** Three columns: `tree` | (editor `code` over terminal `code`, in a `bare` group) |
a SIDE PANE — a `bare` group with a fixed width `w`. The IDE alone is narrower than 16:9; the side
pane fills the frame and holds whatever the moment needs (a `note`, a `compact` plot, a small memory
diagram) or nothing. See `dev/fixtures/studies/ide-frame.ts`.

**Notebook frames.** The same three columns with a notebook in the middle: `tree` | a group (the
notebook: `title: 'explore.ipynb'`, `icon: 'jupyter'`) of CELLS | the fixed side pane. A cell is a
`group` with `cell: n`, the execution count drawn as `[n]` in a gutter (`cell: true` draws `[ ]`, not
run yet). Its first child is the input `code` (drawn without a tab bar, stretched to the cell),
followed by its outputs: `{ type: 'code', output: true }` for printed text (`! ` lines are errors), a
`table` for a DataFrame, or a `plot`. See `dev/fixtures/studies/notebook-frame.ts`.

`minW`/`minH` are FLOORS and `maxW`/`maxH` CAPS, in the scene's own pixels; `w`/`h` set both. Give
every frame of a video the same floors and a fixed side pane, and they get the same zoom: no pane
moves between cuts, whatever the side pane holds. Prose wraps to the pane; tables and code do not,
so keep them narrow. A plot never scales — use `compact: true` (a 420×280 area) in a side pane.
Don't draw an edge between the IDE's columns: an arrow widens the gap it crosses and moves every
pane. Point at code with `highlight` and the narration; edges INSIDE the side pane are fine.

**Charts.** A `plot`'s x/y values are DATA in the axes' own units — sample curves in the scene
file. A series is `line | scatter | area | bar | segment`. Every plot's drawing area is the same
fixed size, so charts line up across a deck. Series take the next colour of a fixed ramp
(blue, orange, violet, green) unless given a `tone`. A `segment` is a dashed construction or threshold
line — muted grey unless toned, solid with `dashed: false`, a vector with `arrow: true`. Bars label
themselves in a legend; other series label their last point.

An edge to an id the scene doesn't have logs a console error naming it.

**Legibility on video.** The fit scales the whole scene to the frame, so what decides how big text
looks is how WIDE the scene is for the text it holds — not the font size. Item text wraps at a
reading measure (15em) instead of widening its column; icons are sized in em, so they keep their
ratio to the text; a small scene stops growing at 4×. Keep scenes legible: the engine's own check
fails any fixture whose smallest body text renders under 24px in the 4K frame (12px at 1080p). If a
diagram hits that, split the slide or trim bullets — a denser scene can only get smaller.

**Focus.** `<Scene scene={…} focus="driver" />` singles out one node — any id, a table row or a code
line included — with a ring and a glow in its own tone. It is drawn with box-shadow, so it moves
nothing: every section of a course can focus a different node on the same scene without a jump.

**Fit.** `Scene` fills its parent and scales the scene to fit, centred, with a 4% margin. The scale
depends only on the parent's size and the scene's natural size, so the same scene in the same frame
always lands on the same pixels. The view is locked (no zoom/pan); page scroll passes through and text
stays selectable. The root carries `data-fit="ready"` once fonts have loaded, edges are routed and the fit is applied —
wait on it before recording.

**Recording at 4K.** Give the Scene a 3840×2160 box and record at device scale 1 — the frame
`@graphlearning/shell`'s recorders use. In this repo: `npm run capture -- <fixtureId> --theme dark`
writes `captures/<id>-<theme>.png`.

## Model

| Type    | Fields |
|---------|--------|
| `item`  | `id`, `title`, `muted?`, `sub?`, `icon?`, `bullets?`, `stack?`, `chip?`, `tone?`, `span?` |
| `group` | `id`, `children`, `title?`, `sub?`, `icon?`, `badge?`, `dir?: 'row' \| 'col' \| 'grid'`, `cols?`, `bare?`, `dashed?`, `muted?`, `spread?`, `cell?: number \| true`, `tone?`, `span?` |
| `table` | `id`, `rows`, `columns?`, `title?`, `tone?`, `span?` — a row is `[cells…]` or `{ cells, id?, tag?, tone? }` |
| `code`  | `id`, `code`, `lang?`, `filename?`, `show?: [from, to][]`, `highlight?: number[]`, `terminal?`, `output?`, `console?`, `cols?`, `tone?`, `span?` |
| `tty`   | `id`, `screen: string[]`, `title?`, `cols?`, `inverse?`, `bold?` (`[row, from, to][]`) — a full-screen program's grid |
| `plot`  | `id`, `x`, `y` (axes: `min`, `max`, `step?`, `label?`, or `labels` for categories), `series`, `title?`, `axes?`, `grid?` |
| `tree`  | `id`, `entries` (`name`, `children?`, `folder?`, `state?: active \| new \| muted`, `note?`, `icon?`), `title?` |
| `note`  | `id`, `text`, `tone?` — a dashed callout of wrapping prose |
| any node | `minW?`/`minH?` (floors), `maxW?`/`maxH?` (caps), `w?`/`h?` (exact), `fill?`, `span?`, `tone?`; groups also `bare?` |
| `Edge`  | `from`, `to` (a node id; a table row `table.row`; a code line `code.L12`; a tree entry `tree.src/a.py`; a tty row `top.R7`), `label?`, `dashed?`, `bidirectional?` |
| `Scene` | `nodes`, `edges?`, `title?`, `sub?`, `dir?`, `pulse?` |

**Layout.** A group lays its children out as `dir: 'col'` (default), `'row'` (one column per child)
or `'grid'` (`cols`, default 2). `span: 'all'` gives a child a full row — a rail under columns.
Siblings in a row stretch to equal height.

**Tone** sets what a box means and is inherited by everything inside it:

| tone | hue | | tone | hue |
|---|---|---|---|---|
| `neutral` | grey | | `serve` | violet |
| `source` | slate | | `consume` | red |
| `ingest` | blue | | `infra` | orange |
| `store` | green | | | |

The theme (`dark` | `light`) picks the shade; repos cannot recolour.

**Icons** share one key space across five sets; an unknown key draws no icon. Keys match
`@graphlearning/flow`'s where both have the icon, so scenes port without renaming.

| set | drawn in | keys |
|---|---|---|
| generic (lucide) | the tone accent | `activity admin bell box branch building card chart check clock cloud code archive cert cpu database disk factory file filter fingerprint firewall folder gauge globe key laptop layers lock log memory network package pie power screen search server settings shield stream table terminal timer user users workflow zap` |
| Azure | its own colours | `adls aks analysisservices azuresql cosmos databricks datafactory defender devops eventhubs functions keyvault loganalytics monitor powerbi purview servicebus storage streamanalytics synapse vm` |
| AWS service | its own tile | `acm apigateway athena aurora backup budgets cloudformation cloudfront cloudtrail cloudwatch costexplorer dms dynamodb ec2 ecr ecs eks elasticache elb emr eventbridge fargate firehose glue iam identitycenter kinesis kms lakeformation lambda msk mwaa organizations rds redshift route53 s3 sagemaker secretsmanager sns sqs ssm stepfunctions vpc waf xray` |
| AWS group mark | its own tile (for a group's `icon`) | `account autoscaling privatesubnet publicsubnet region` |
| AWS resource | a single-colour glyph, no tile | `alb bucket container ecsservice ecstask hostedzone iamrole igw message natgateway permissions queue router sts topic vpcendpoint` |
| brand | its own colour (ink if it would vanish) | `airflow almalinux apple arch bash debian docker duckdb fedora flink git github githubactions grafana java junit jupyter kafka kubernetes letsencrypt linux macos maven mongodb nginx pandas postgresql prometheus python redhat rocky snowflakedb spark terraform ubuntu zsh` |

**`muted: true`** draws an item greyed, or a group as a plain grey outline — a part the system does
not have yet, at its full size and place (paint only, so muting moves nothing; a muted group does not
dim its children). An architecture that grows course by course draws its
whole final shape from the start.

**`chip: true`** draws an item as a small framed pill — a thing counted, not described (`Task 1`,
`Local disk`); chips fill their grid cell, so a row of them lines up.

A nested group is a plain card, unless it names its OWN `tone` — then it is a coloured column again
(the Spark study's four columns, and its green worker nodes inside the orange Worker column).

**`stack: true`** puts an item's icon on top with the text centred under it — a card in a column of
peers (the Business Consumers column).
