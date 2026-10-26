# @graphlearning/graphl-flow

Declarative architecture diagrams for React. Describe **groups**, **items** and **edges**; the
browser lays them out and the engine draws the arrows. Scenes never contain x/y.

> Status: 0.0.x scaffold — edges, fit-to-pane and theming are not implemented yet.

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

`tone` sets what a box means: `source`, `ingest`, `store`, `serve`, `consume`, `infra`, `neutral`.
The theme (`dark` | `light`) picks the shade; repos cannot recolour.
