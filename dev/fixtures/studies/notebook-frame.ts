import type { Code, Group, SceneModel, SceneNode, Tree } from '../../../src'

// Varies the FRAME the way ide-frame does, for a NOTEBOOK: explorer | notebook | SIDE PANE. A cell is
// a `group` with `cell: n` — the `[n]` gutter, the input `code`, then its outputs (an `output` code, a
// `table` for a DataFrame, a `plot`) stacked under it. Every frame has the same floors and a fixed side
// pane, and `check` asserts they all land on the SAME fit, like the IDE frames: no edges between panes.

const explorer = (active: string): Tree => ({
  type: 'tree', id: 'explorer', title: 'house-prices', fill: true, minW: 300, entries: [
    { name: '.venv', folder: true, state: 'muted', note: "this project's own Python" },
    { name: 'data', children: [{ name: 'homes.csv' }] },
    { name: 'notebooks', children: [
      { name: 'explore.ipynb', state: active === 'explore.ipynb' ? 'active' : undefined },
      { name: 'model.ipynb', state: active === 'model.ipynb' ? 'active' : undefined },
    ] },
    { name: 'pyproject.toml' },
  ],
})

const FLOORS = { notebook: { minW: 960, minH: 900 }, side: 560 }

const input = (id: string, code: string, rest: Partial<Code> = {}): Code => ({ type: 'code', id, lang: 'python', code, ...rest })
const printed = (id: string, code: string): Code => ({ type: 'code', id, output: true, code })
const cell = (id: string, n: number | true, children: SceneNode[]): Group => ({ type: 'group', id, cell: n, children })

const notebook = (filename: string, cells: Group[]): Group => ({
  type: 'group', id: 'notebook', title: filename, icon: 'jupyter', sub: 'kernel: .venv · Python 3.15', tone: 'store', fill: true, ...FLOORS.notebook, children: cells,
})

const side = (children: SceneNode[]): Group => ({ type: 'group', id: 'side', bare: true, w: FLOORS.side, children })

const frame = (tree: Tree, nb: Group, pane: SceneNode[]): SceneModel => ({ dir: 'row', nodes: [tree, nb, side(pane)] })

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
  'nb-frame': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [load, head, describe]), [
    { type: 'note', id: 'side-note', tone: 'store', text: 'A cell runs, and its result prints under it — the count says in what order.' },
  ]),
  'nb-plot': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [
    describe,
    cell('c4', 4, [input('c4-in', 'homes["price"].plot.hist(bins=range(0, 600_001, 50_000))'), {
      type: 'plot', id: 'c4-out', x: { min: 0, max: 600, step: 100, label: 'price (k)' }, y: { min: 0, max: 500, step: 100, label: 'homes' },
      series: [{ kind: 'bar', points: BINS.map(([x, y]) => [x - 25, y]), label: 'homes' }],
    }]),
  ]), [
    { type: 'plot', id: 'side-plot', tone: 'store', compact: true, title: 'mean vs median', x: { min: 0, max: 600, step: 200, label: 'price (k)' }, y: { min: 0, max: 500, step: 250 }, series: [
      { kind: 'area', points: BINS.map(([x, y]) => [x - 25, y]) },
      { kind: 'segment', from: [163, 0], to: [163, 500], label: 'median', dashed: false },
      // Shorter, so its midpoint label sits under the median's instead of on it.
      { kind: 'segment', from: [181, 0], to: [181, 300], label: 'mean' },
    ] },
    { type: 'note', id: 'side-note', tone: 'store', text: 'A long right tail pulls the mean above the median.' },
  ]),
  'nb-error': frame(explorer('explore.ipynb'), notebook('explore.ipynb', [
    describe,
    cell('c5', 5, [input('c5-in', 'homes["prise"].mean()', { highlight: [1] }), printed('c5-out', `
      ! KeyError: 'prise'
      ! Cell In[5], line 1
    `)]),
    cell('c6', true, [input('c6-in', 'homes["price"].mean()')]),
  ]), [
    { type: 'table', id: 'columns', title: 'homes.columns', rows: [['area'], ['sqft'], ['beds'], ['built'], ['garage'], { id: 'price', cells: ['price'], tone: 'consume' }] },
    { type: 'note', id: 'side-note', tone: 'consume', text: 'A column is looked up by its exact name. [ ] — not run yet.' },
  ]),
}
