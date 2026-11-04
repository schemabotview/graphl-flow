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
  /** A small framed pill — a thing COUNTED, not described (`Task 1`, `Local disk`). */
  chip?: boolean
  /**
   * Not there yet: drawn greyed (icon desaturated, text dimmed) at its full size and place — a part
   * of an architecture the system does not have yet. Paint only, so muting moves nothing.
   */
  muted?: boolean
}

/** A container: lays its children out in a row, a column or a grid. */
export interface Group extends Base {
  type: 'group'
  title?: string
  /** A step number drawn as a badge before the title. */
  badge?: number
  /** A line under the title: what the group is for. */
  sub?: string
  /** An icon key drawn before the title. */
  icon?: string
  dir?: 'row' | 'col' | 'grid'
  /** Column count for `dir: 'grid'`. */
  cols?: number
  /** No frame, fill or padding — a group that only arranges its children. */
  bare?: boolean
  /**
   * The frame drawn dashed: a boundary that is a PLACE, not a thing (an AWS Availability Zone, a
   * Region). Same width as the solid frame, so dashing a group never moves anything.
   */
  dashed?: boolean
  /**
   * Not there yet: the frame drawn as a plain grey outline (no tint, a dimmed heading) at its full
   * size and place — a network or a service the system does not have yet. Children are NOT dimmed
   * by it: mute each item that is not there either. Paint only, so muting moves nothing.
   */
  muted?: boolean
  /** Distribute the children over the group's full height when it is stretched taller than them. */
  spread?: boolean
  /**
   * A notebook cell: the execution count drawn as `[n]` in a gutter (`true`: not run yet, `[ ]`),
   * the children — the input `code` first, then its outputs — stacked beside it. No frame or head.
   */
  cell?: number | true
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
  lang?: 'python' | 'sql' | 'scala' | 'java' | 'js' | 'ts' | 'shell' | 'hcl' | 'ini' | 'nginx' | 'nft' | 'text'
  /** The tab label; for a terminal, its title. */
  filename?: string
  /** Only these 1-based, inclusive line ranges; each skipped run folds to `··· N lines`. */
  show?: [number, number][]
  /** Line numbers (the file's) to tint. */
  highlight?: number[]
  /**
   * Soft-wrap a line wider than the pane, as an editor's word wrap does: the rest continues under
   * the line's own text, beside an empty gutter, and the file's line numbers stay the file's. Each
   * wrapped piece is a ROW — a template that counts rows must count them. Editor panes only.
   */
  wrap?: boolean
  /** A terminal: `$ cmd` lines are commands, `! text` errors, the rest output. No line numbers. */
  terminal?: boolean
  /** A notebook cell's printed output: plain text, no frame or line numbers; `! text` is an error. */
  output?: boolean
  /**
   * A REAL console transcript, row for row as an 80-column terminal drew it: a row starting with a
   * prompt is a command (`ana@web-01:~$`, `[ana@web-02 ~]$`, zsh's `ana@mac ~ %`; `#` is root — or psql's
   * `syndica=>`, whose continuation rows `syndica-*>` are more lines of the same statement),
   * everything else output, drawn in ink. A command row exactly `cols` wide WRAPPED, so the next row
   * continues the command. No `$ ` convention and no `!` marks: the transcript is not edited.
   */
  console?: boolean
  /** The console's width in columns, for wrapped command rows. Default 80. */
  cols?: number
}

/**
 * A full-screen program (`top`, `less`, `nano`) as a terminal screen showed it: exactly `rows`, each
 * drawn in a fixed `cols`-wide grid, with the program's inverse-video and bold runs. Captured from a
 * real virtual terminal, never typed. Rows are addressable as `<tty>.R<n>` (1-based) for `focus`.
 */
export interface Tty extends Base {
  type: 'tty'
  /** The window title. */
  title?: string
  /** The screen's rows, top to bottom; shorter rows are padded, so the grid is always cols × rows. */
  screen: string[]
  /** Default 80. */
  cols?: number
  /** Inverse-video runs: [row, from, to] — 0-based row, columns [from, to). */
  inverse?: [number, number, number][]
  /** Bold runs, the same shape. */
  bold?: [number, number, number][]
}

/**
 * A picture the PROGRAM drew — an SVG file it wrote, a page it served — as a screenshot, framed by
 * the window that shows it: a viewer tab named for the file, or a browser's URL bar. Captured, never
 * drawn by the engine, so it can never be mistaken for the frame's own diagram. Give it a `w`
 * and `h` — required: a figure sized by its image would make the window's bar as small as the image
 * is large. The image is fitted inside, centred, never stretched. Shoot it at the pixels the window's
 * body lands on in the 4K frame: `check` fails a figure drawn larger than its image (blurry) or of
 * another shape (letterboxed), and names the size to shoot.
 */
export interface Figure extends Base {
  type: 'figure'
  /** The image's URL, or one per theme (the program shot in each). */
  src: string | Record<ThemeKey, string>
  /** What the picture shows: the image's alt text, and the name check reports it by. */
  alt: string
  /** The window: `tab` (default) — a viewer tab named `title`; `browser` — a URL bar holding `title`. */
  chrome?: 'tab' | 'browser'
  /** The tab's file name (`out/checkout.svg`) or the URL (`localhost:5173`). */
  title?: string
  w: number
  h: number
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
  /** The second fixed size (420×280 drawing area) — a chart in a side pane, at full text size. With
   *  `w`, the plot is that wide (borders included) and its drawing area takes what the gutters leave:
   *  a chart in a column narrower than the compact size. */
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
  /** Smaller type and indent (13px rows, 11px per level): a sidebar beside a code pane, not the subject. */
  compact?: boolean
}

/** A callout: wrapping prose in a dashed frame of its tone. Fills its column's width. */
export interface Note extends Base {
  type: 'note'
  text: string
}

export type SceneNode = Item | Group | Table | Code | Plot | Tree | Note | Tty | Figure

export interface Edge {
  /** A node id, or a table row as `<table>.<row>`. */
  from: string
  to: string
  label?: string
  dashed?: boolean
  /** A head at both ends (and a pulse each way) — a read/write, a request/response. */
  bidirectional?: boolean
}

export interface Scene {
  title?: string
  sub?: string
  /** Direction of the top-level nodes. Default `'col'`. */
  dir?: 'row' | 'col'
  nodes: SceneNode[]
  edges?: Edge[]
  /** A dot travels every edge once per 2.4 s (the recorder's loop). Default true. */
  pulse?: boolean
  /**
   * The fit's margin per side, as a fraction of the pane (0–0.2). Default `FIT_PADDING` (0.04). A
   * fixed frame template sized to the pane's aspect (an IDE frame) lowers it to fill the recording.
   */
  padding?: number
}
