# @graphlearning/graphl-flow

Declarative architecture diagrams for React. Describe **groups**, **items** and **edges**; the
browser lays them out and the engine draws the arrows. Scenes never contain x/y.

> Status: 0.0.x — groups, items, tones, icons, both themes, fit-to-pane and edges work.

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
own ancestor is not drawn.

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
`lang` is `python | sql | scala | java | js | ts | shell | text` — one small highlighter with seven
token colours per theme. `show` keeps only those line ranges and folds each skipped run into
`··· N lines`; `show` and `highlight` use the FILE's line numbers, and so do edges: `src.L17`.
`terminal: true` draws a terminal — `$ ` lines are commands, `! ` lines errors, the rest output.

**Charts.** A `plot`'s x/y values are DATA in the axes' own units — sample curves in the scene
file. A series is `line | scatter | area | bar | segment`. Every plot's drawing area is the same
fixed size, so charts line up across a deck. Series take the next colour of a fixed ramp
(blue, orange, violet, green) unless given a `tone`. A `segment` is a dashed construction or threshold
line — muted grey unless toned, solid with `dashed: false`, a vector with `arrow: true`. Bars label
themselves in a legend; other series label their last point.

An edge to an id the scene doesn't have logs a console error naming it.

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
| `item`  | `id`, `title`, `sub?`, `icon?`, `bullets?`, `stack?`, `tone?`, `span?` |
| `group` | `id`, `children`, `title?`, `badge?`, `dir?: 'row' \| 'col' \| 'grid'`, `cols?`, `tone?`, `span?` |
| `table` | `id`, `rows`, `columns?`, `title?`, `tone?`, `span?` — a row is `[cells…]` or `{ cells, id?, tag?, tone? }` |
| `code`  | `id`, `code`, `lang?`, `filename?`, `show?: [from, to][]`, `highlight?: number[]`, `terminal?`, `tone?`, `span?` |
| `plot`  | `id`, `x`, `y` (axes: `min`, `max`, `step?`, `label?`, or `labels` for categories), `series`, `title?`, `axes?`, `grid?` |
| `Edge`  | `from`, `to` (any node id, groups included, a table row `table.row`, or a code line `code.L12`), `label?`, `dashed?` |
| `Scene` | `nodes`, `edges?`, `title?`, `sub?`, `dir?` |

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

**Icons** share one key space across four sets; an unknown key draws no icon. Keys match
`@graphlearning/flow`'s where both have the icon, so scenes port without renaming.

| set | drawn in | keys |
|---|---|---|
| generic (lucide) | the tone accent | `activity admin bell box branch building card chart check clock cloud code cpu database disk factory file filter fingerprint folder globe key layers lock network package pie screen search server settings shield stream table terminal user users workflow zap` |
| Azure | its own colours | `adls aks analysisservices azuresql cosmos databricks datafactory defender devops eventhubs functions keyvault loganalytics monitor powerbi purview servicebus storage streamanalytics synapse vm` |
| AWS | its own tile | `apigateway athena aurora cloudformation cloudwatch dms dynamodb ec2 eks elasticache emr eventbridge firehose glue iam kinesis kms lakeformation lambda msk mwaa rds redshift s3 sagemaker secretsmanager sns sqs stepfunctions vpc` |
| brand | its own colour (ink if it would vanish) | `airflow docker duckdb flink git github githubactions grafana jupyter kafka kubernetes mongodb pandas postgresql prometheus python snowflakedb spark terraform` |

**`stack: true`** puts an item's icon on top with the text centred under it — a card in a column of
peers (the Business Consumers column).
