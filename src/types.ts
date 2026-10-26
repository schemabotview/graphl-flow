/** The scene model — the whole authoring contract. Scenes never carry x/y or sizes. */

export type ThemeKey = 'dark' | 'light'

/** What a box MEANS. A theme picks the shade; the tone picks the hue family. */
export type Tone = 'source' | 'ingest' | 'store' | 'serve' | 'consume' | 'infra' | 'neutral'

interface Base {
  id: string
  /** Inherited: unset takes the nearest ancestor's tone. */
  tone?: Tone
  /** Take a whole row of the parent (a rail under a row of columns). */
  span?: 'all'
  /**
   * FLOORS in the scene's own pixels, applied after the natural size: a box never shrinks below
   * them and content still grows it. Their job is consistency — frames whose boxes match get the same
   * zoom, so a pane sits at the same pixels in every frame of a video.
   */
  minW?: number
  minH?: number
  /**
   * CAPS: a box never grows past them. Content that does not fit overflows, and `check` fails it —
   * a cap holds a column FIXED so nothing placed in it can move the rest of the frame.
   */
  maxW?: number
  maxH?: number
  /** Exact size: shorthand for min = max. A fixed column — the IDE's side pane, empty or not. */
  w?: number
  h?: number
  /** A leaf stretches to fill its grid cell instead of hugging its content (IDE panes). */
  fill?: boolean
}

/** A leaf: one card. Every field is optional except `title`. */
export interface Item extends Base {
  type: 'item'
  title: string
  sub?: string
  /** An icon key — generic (`database`), Azure (`datafactory`), AWS (`s3`) or brand (`kafka`). */
  icon?: string
  bullets?: string[]
  /** Icon on top, text centred under it — a card in a column of peers. Default: icon left. */
  stack?: boolean
}

/** A container: lays its children out in a row, a column or a grid. */
export interface Group extends Base {
  type: 'group'
  title?: string
  /** A step number drawn as a badge before the title. */
  badge?: number
  dir?: 'row' | 'col' | 'grid'
  /** Column count for `dir: 'grid'`. */
  cols?: number
  /** No frame, fill or padding — a group that only arranges its children. */
  bare?: boolean
  children: SceneNode[]
}

/** One table row: its cells, plus an optional id, a short tag in a leading gutter, and a tone. */
export interface TableRow {
  /** Overrides the row's address. Default: its first cell, when that is a plain word. */
  id?: string
  cells: (string | number)[]
  /** A short marker drawn as a pill before the row: `PK`, `FK`, `sp`, `top`… */
  tag?: string
  /** Tints the row — the changed value, the active frame. */
  tone?: Tone
}

/**
 * A grid of cells — a DB table, a stack frame, a heap object, an array, a hash map's buckets.
 * Each row is addressable by edges as `<table id>.<row id>`, which is how a pointer is drawn.
 */
export interface Table extends Base {
  type: 'table'
  title?: string
  /** Header cells. Omit for a headerless table (a stack frame, a heap object). */
  columns?: string[]
  rows: ((string | number)[] | TableRow)[]
}

/**
 * Source code or a terminal session. Lines are addressable by edges as `<code id>.L<n>` (the FILE's
 * line number), which is how an arrow points from a line into a diagram.
 */
export interface Code extends Base {
  type: 'code'
  /** The source. A template literal's common indent and outer blank lines are dropped. */
  code: string
  lang?: 'python' | 'sql' | 'scala' | 'java' | 'js' | 'ts' | 'shell' | 'text'
  /** The tab label; for a terminal, its title. */
  filename?: string
  /** Only these 1-based, inclusive line ranges; each skipped run folds to `··· N lines`. */
  show?: [number, number][]
  /** Line numbers (the file's) to tint. */
  highlight?: number[]
  /** A terminal: `$ cmd` lines are commands, `! text` errors, the rest output. No line numbers. */
  terminal?: boolean
}

/** An axis in DATA units. `labels` makes it categorical: one slot per label (bar charts). */
export interface PlotAxis {
  min?: number
  max?: number
  /** Tick spacing; default a "nice" step giving ~8 ticks. */
  step?: number
  label?: string
  labels?: string[]
}

export interface PlotSeries {
  kind: 'line' | 'scatter' | 'area' | 'bar' | 'segment'
  /** Data points (line, scatter, area, bar). Curves are sampled in the scene file. */
  points?: [number, number][]
  /** A segment's two ends. */
  from?: [number, number]
  to?: [number, number]
  /** Drawn at the last point, a segment's midpoint, or an arrow's tip. */
  label?: string
  /** Default: the next colour of the plot ramp. */
  tone?: Tone
  /** A line drawn dashed. A segment is dashed UNLESS `dashed: false`. */
  dashed?: boolean
  /** A segment with a head at `to` — a vector. */
  arrow?: boolean
}

/** A chart. Every plot's drawing area is the same fixed size, whatever its data. */
export interface Plot extends Base {
  type: 'plot'
  title?: string
  x: PlotAxis
  y: PlotAxis
  series: PlotSeries[]
  /** Default: through the origin when both numeric ranges span zero, else along the corner. */
  axes?: 'origin' | 'corner'
  /** Gridlines at the ticks. Default true. */
  grid?: boolean
  /** The second fixed size (420×280 drawing area) — a chart in a side pane, at full text size. */
  compact?: boolean
}

export interface TreeEntry {
  name: string
  children?: TreeEntry[]
  /** Draw as a folder even with no children listed. */
  folder?: boolean
  /** `active` — the open file; `new` — added in this step; `muted` — not relevant here. */
  state?: 'active' | 'new' | 'muted'
  /** A short note after the name (`M`, `U`); on a `muted` entry it reads as an italic aside. */
  note?: string
  /** An icon key. Default: by extension (`.py` → the Python mark), else a plain file or folder. */
  icon?: string
}

/** A file explorer. Each entry is addressable by edges as `<tree id>.<path>` (`ide.src/jobs/orders.py`). */
export interface Tree extends Base {
  type: 'tree'
  /** The panel heading. Default `Explorer`. */
  title?: string
  entries: TreeEntry[]
}

/** A callout: wrapping prose in a dashed frame of its tone. Fills its column's width. */
export interface Note extends Base {
  type: 'note'
  text: string
}

export type SceneNode = Item | Group | Table | Code | Plot | Tree | Note

export interface Edge {
  /** A node id, or a table row as `<table>.<row>`. */
  from: string
  to: string
  label?: string
  dashed?: boolean
}

export interface Scene {
  title?: string
  sub?: string
  /** Direction of the top-level nodes. Default `'col'`. */
  dir?: 'row' | 'col'
  nodes: SceneNode[]
  edges?: Edge[]
}
