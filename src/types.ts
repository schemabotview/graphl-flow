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
  children: SceneNode[]
}

export type SceneNode = Item | Group

export interface Edge {
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
