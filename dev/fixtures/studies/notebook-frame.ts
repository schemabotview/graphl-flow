import type { Code, Edge, Group, SceneModel, SceneNode, Tree } from '../../../src'
import { EXPLORER_W, FRAME_H, SIDE_PLOT_W, SIDE_W, WORK_W } from './ide-frame'

// Varies the FRAME the way ide-frame does, for a NOTEBOOK, on the SAME grid (1344 × 756 at a 1%
// margin, so the same zoom as an IDE frame): compact explorer | notebook (WORK_W) | side pane titled
// with the mental model, holding a diagram (`spread`). A cell is a `group` with `cell: n` — the `[n]`
// gutter, the input `code`, then its outputs (an `output` code, a `table` for a DataFrame, a `plot`)
// stacked under it. Every column is fixed (`w`) with a full-height floor, and `check` asserts every
// frame lands on the SAME fit, like the IDE frames: no edges between panes.

const explorer = (active: string): Tree => ({
  type: 'tree', id: 'explorer', title: 'house-prices', compact: true, fill: true, w: EXPLORER_W, minH: FRAME_H, entries: [
    { name: '.venv', folder: true, state: 'muted' },
    { name: 'data', children: [{ name: 'homes.csv' }] },
    { name: 'notebooks', children: [
      { name: 'explore.ipynb', state: active === 'explore.ipynb' ? 'active' : undefined },
      { name: 'model.ipynb', state: active === 'model.ipynb' ? 'active' : undefined },
    ] },
    { name: 'pyproject.toml' },
  ],
})

const input = (id: string, code: string, rest: Partial<Code> = {}): Code => ({ type: 'code', id, lang: 'python', code, ...rest })
const printed = (id: string, code: string): Code => ({ type: 'code', id, output: true, code })
const cell = (id: string, n: number | true, children: SceneNode[]): Group => ({ type: 'group', id, cell: n, children })

const notebook = (filename: string, cells: Group[]): Group => ({
  type: 'group', id: 'notebook', title: filename, icon: 'jupyter', sub: 'kernel: .venv · Python 3.15', tone: 'store', fill: true, w: WORK_W, minH: FRAME_H, children: cells,
})

const side = (model: string, children: SceneNode[]): Group =>
  ({ type: 'group', id: 'side', title: model, tone: 'store', spread: true, w: SIDE_W, minH: FRAME_H, children })

const frame = (tree: Tree, nb: Group, model: string, pane: SceneNode[], edges: Edge[] = []): SceneModel =>
  ({ dir: 'row', padding: 0.01, nodes: [tree, nb, side(model, pane)], edges })

const load = cell('c1', 1, [input('c1-in', `
  import pandas as pd

  homes = pd.read_csv("../data/homes.csv")
  homes.shape
`), printed('c1-out', '(1460, 7)')])

const head = cell('c2', 2, [input('c2-in', 'homes.head()'), { type: 'table', id: 'c2-out', columns: ['', 'area', 'sqft', 'beds', 'built', 'garage', 'price'], rows: [
  [0, 'Riverside', 1710, 3, 2003, 2, 208500],
  [1, 'Old Town', 1262, 3, 1976, 2, 181500],
  [2, 'Riverside', 1786, 3, 2001, 2, 223500],
  [3, 'Hillcrest', 1717, 3, 1915, 3, 140000],
  [4, 'Northgate', 2198, 4, 2000, 3, 250000],
] }])

const describe = cell('c3', 3, [input('c3-in', 'homes["price"].describe().round()'), printed('c3-out', `
  count      1460.0
  mean     180921.0
  std       79443.0
  min       34900.0
  50%      163000.0
  max      755000.0
  Name: price, dtype: float64
`)])

// A right-skewed price histogram, bins of 50k.
const BINS: [number, number][] = [[50, 6], [100, 160], [150, 470], [200, 400], [250, 210], [300, 110], [350, 52], [400, 24], [450, 10], [500, 5], [550, 3]]

export const NOTEBOOK_FRAMES: Record<string, SceneModel> = {
  'nb-frame': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [load, head, describe]), 'A cell runs; its count says in what order', [
    { type: 'group', id: 'kernel', title: 'the kernel, after [3]', spread: true, minH: 520, children: [
      { type: 'item', id: 'k1', icon: 'python', title: '[1] read_csv', sub: 'binds homes' },
      { type: 'item', id: 'k2', icon: 'python', title: '[2] head()', sub: 'reads homes' },
      { type: 'item', id: 'k3', icon: 'python', title: '[3] describe()', sub: 'reads homes' },
    ] },
  ], [{ from: 'k1', to: 'k2' }, { from: 'k2', to: 'k3' }]),
  'nb-plot': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [
    describe,
    cell('c4', 4, [input('c4-in', 'homes["price"].plot.hist(bins=range(0, 600_001, 50_000))'), {
      type: 'plot', id: 'c4-out', compact: true, x: { min: 0, max: 600, step: 100, label: 'price (k)' }, y: { min: 0, max: 500, step: 100, label: 'homes' },
      series: [{ kind: 'bar', points: BINS.map(([x, y]) => [x - 25, y]), label: 'homes' }],
    }]),
  ]), 'A long right tail pulls the mean above the median', [
    { type: 'plot', id: 'side-plot', compact: true, w: SIDE_PLOT_W, title: 'mean vs median', x: { min: 0, max: 600, step: 200, label: 'price (k)' }, y: { min: 0, max: 500, step: 250 }, series: [
      { kind: 'area', points: BINS.map(([x, y]) => [x - 25, y]) },
      { kind: 'segment', from: [163, 0], to: [163, 500], label: 'median', dashed: false },
      // Shorter, so its midpoint label sits under the median's instead of on it.
      { kind: 'segment', from: [181, 0], to: [181, 300], label: 'mean' },
    ] },
  ]),
  'nb-error': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [
    describe,
    cell('c5', 5, [input('c5-in', 'homes["prise"].mean()', { highlight: [1] }), printed('c5-out', `
      ! KeyError: 'prise'
      ! Cell In[5], line 1
    `)]),
    cell('c6', true, [input('c6-in', 'homes["price"].mean()')]),
  ]), 'A column is looked up by its exact name', [
    { type: 'table', id: 'columns', title: 'homes.columns', rows: [['area'], ['sqft'], ['beds'], ['built'], ['garage'], { id: 'price', cells: ['price'], tone: 'consume' }] },
  ]),
}
