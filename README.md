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
An edge leaves across the larger gap between its two boxes. A face with several edges gives each its
own port, and their labels move off the line (above/below) so they don't collide. The gap an edge
runs through widens automatically, to fit its label when it has one. An edge between a node and its
own ancestor is not drawn.

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
| `item`  | `id`, `title`, `sub?`, `icon?`, `bullets?`, `tone?`, `span?` |
| `group` | `id`, `children`, `title?`, `badge?`, `dir?: 'row' \| 'col' \| 'grid'`, `cols?`, `tone?`, `span?` |
| `Edge`  | `from`, `to` (any node id, groups included), `label?`, `dashed?` |
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

**Icons** are a curated lucide set, by key: `activity bell box building card chart check clock cloud
code cpu database disk factory file filter fingerprint folder git globe key layers lock monitor
network package pie search server settings shield stream table terminal user admin users workflow
zap`. An unknown key draws no icon.
