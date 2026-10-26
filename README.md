# @graphlearning/graphl-flow

Declarative architecture diagrams for React. Describe **groups**, **items** and **edges**; the
browser lays them out and the engine draws the arrows. Scenes never contain x/y.

> Status: 0.0.x — groups, items, tones, icons and both themes render; edges and fit-to-pane are not implemented yet.

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

<Scene scene={scene} theme="dark" />
```

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
