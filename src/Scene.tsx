import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ICONS } from './icons'
import { Edges } from './Edges'
import { TableView, tableRows } from './Table'
import { CodeView, codeLineIds } from './Code'
import { PlotView } from './Plot'
import { TreeView, treeEntryIds } from './Tree'
import { routeEdges, type Rect } from './routing'
import { fitTransform, type Size } from './fit'
import { THEMES, type Theme } from './theme'
import type { Group, Item, Scene as SceneModel, SceneNode, ThemeKey } from './types'

// Layout is CSS grid all the way down: a row is N auto columns (one per non-spanning child),
// a col is one, a grid is `cols`. `span: 'all'` runs 1 / -1. Grid — not flex — because a
// spanning child must not change the natural width the fit will later scale.

type Dir = 'row' | 'col' | 'grid'

/**
 * The gap an arrow is drawn in. A body whose children an edge runs BETWEEN gets at least EDGE_GAP,
 * and, on the axis a LABELLED edge crosses it, the label's measured size plus LABEL_ROOM a side.
 */
const GAP = 12
const EDGE_GAP = 44
const LABEL_ROOM = 24

type Gaps = Record<string, { col: number; row: number }>

function bodyStyle(dir: Dir, children: SceneNode[], cols: number | undefined, gap?: { col: number; row: number }): CSSProperties {
  const n = dir === 'grid' ? cols ?? 2 : dir === 'row' ? Math.max(1, children.filter((c) => c.span !== 'all').length) : 1
  return { gridTemplateColumns: `repeat(${n}, auto)`, columnGap: gap?.col ?? GAP, rowGap: gap?.row ?? GAP }
}

/**
 * Each edge's lowest common ancestor ('' for the scene root) — the body it runs across — and the two
 * children of it that hold its ends, which the router picks faces from. Derived from the scene, never
 * authored, so spacing stays declarative. undefined = not drawable.
 */
type Crossing = { body: string; sides: [string, string] } | undefined

function edgeBodies(scene: SceneModel): Crossing[] {
  const parent = new Map<string, string>()
  // A table's rows are its children for edge planning: `main.list` sits under `main`.
  const walk = (nodes: SceneNode[], p: string) => nodes.forEach((n) => {
    parent.set(n.id, p)
    if (n.type === 'group') walk(n.children, n.id)
    for (const id of lateralIdsOf(n)) parent.set(id, n.id)
  })
  walk(scene.nodes, '')
  const chain = (id: string) => { const out = [id]; while (parent.has(out.at(-1)!)) out.push(parent.get(out.at(-1)!)!); return out }
  return (scene.edges ?? []).map((e) => {
    if (!parent.has(e.from) || !parent.has(e.to)) return undefined
    const from = chain(e.from), to = chain(e.to)
    const lca = from.find((id) => to.includes(id))
    if (lca === undefined || lca === e.from || lca === e.to) return undefined
    const below = (c: string[]) => c[c.indexOf(lca) - 1]
    return { body: lca, sides: [below(from), below(to)] }
  })
}

/** A leaf's addressable slices — table rows, code lines. Each is a child of its leaf for planning. */
const lateralIdsOf = (n: SceneNode): string[] =>
  n.type === 'table' ? tableRows(n).flatMap((r) => (r.address ? [r.address] : []))
    : n.type === 'code' ? codeLineIds(n) : n.type === 'tree' ? treeEntryIds(n) : []

/** Every slice id — the ends the router may connect only through left/right (their top and bottom are inside). */
function lateralIds(nodes: SceneNode[], out = new Set<string>()): Set<string> {
  for (const n of nodes) {
    if (n.type === 'group') lateralIds(n.children, out)
    for (const id of lateralIdsOf(n)) out.add(id)
  }
  return out
}

function baseGaps(bodies: Crossing[]): Gaps {
  const out: Gaps = {}
  for (const b of bodies) if (b) out[b.body] = { col: EDGE_GAP, row: EDGE_GAP }
  return out
}

const toneVars = (theme: Theme, node: SceneNode): CSSProperties | undefined =>
  node.tone && ({ '--gf-accent': theme.tones[node.tone].accent, '--gf-tint': theme.tones[node.tone].tint } as CSSProperties)

/** Placement shared by every node: span, the min-size floors, and `fill` (stretch instead of hug). */
const spanStyle = (node: SceneNode): CSSProperties => {
  const minW = node.w ?? node.minW, maxW = node.w ?? node.maxW, minH = node.h ?? node.minH, maxH = node.h ?? node.maxH
  return {
    ...(node.span === 'all' && { gridColumn: '1 / -1' }),
    ...(minW !== undefined && { minWidth: minW }),
    ...(maxW !== undefined && { maxWidth: maxW }),
    ...(minH !== undefined && { minHeight: minH }),
    ...(maxH !== undefined && { maxHeight: maxH }),
    ...(node.fill && { justifySelf: 'stretch', alignSelf: 'stretch' }),
  }
}

function ItemView({ node, theme }: { node: Item; theme: Theme }) {
  const draw = node.icon ? ICONS[node.icon] : undefined
  return (
    <div className="gf-item" data-id={node.id} data-stack={node.stack || undefined} data-chip={node.chip || undefined} style={{ ...toneVars(theme, node), ...spanStyle(node) }}>
      {draw?.(node.stack ? 40 : node.chip ? 16 : 28, theme.surface, theme.ink)}
      <div>
        <div className="gf-item-title">{node.title}</div>
        {node.sub && <div className="gf-item-sub">{node.sub}</div>}
        {node.bullets && <ul className="gf-bullets">{node.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
      </div>
    </div>
  )
}

function GroupView({ node, theme, gaps }: { node: Group; theme: Theme; gaps: Gaps }) {
  return (
    <div className="gf-group" data-id={node.id} data-bare={node.bare || undefined} data-toned={node.tone || undefined} data-spread={node.spread || undefined} style={{ ...toneVars(theme, node), ...spanStyle(node) }}>
      {(node.title || node.badge != null) && (
        <div className="gf-group-head">
          <div className="gf-group-title">
            {node.badge != null && <span className="gf-badge">{node.badge}</span>}
            {node.icon && ICONS[node.icon]?.(22, theme.surface, theme.ink)}
            {node.title}
          </div>
          {node.sub && <div className="gf-group-sub">{node.sub}</div>}
        </div>
      )}
      <div className="gf-body" style={bodyStyle(node.dir ?? 'col', node.children, node.cols, gaps[node.id])}>
        {node.children.map((c) => <NodeView key={c.id} node={c} theme={theme} gaps={gaps} />)}
      </div>
    </div>
  )
}

function NodeView({ node, theme, gaps }: { node: SceneNode; theme: Theme; gaps: Gaps }) {
  if (node.type === 'group') return <GroupView node={node} theme={theme} gaps={gaps} />
  if (node.type === 'table') return <TableView node={node} theme={theme} style={{ ...toneVars(theme, node), ...spanStyle(node) }} />
  if (node.type === 'code') return <CodeView node={node} style={{ ...toneVars(theme, node), ...spanStyle(node) }} />
  if (node.type === 'plot') return <PlotView node={node} theme={theme} style={{ ...toneVars(theme, node), ...spanStyle(node) }} />
  if (node.type === 'tree') return <TreeView node={node} theme={theme} style={{ ...toneVars(theme, node), ...spanStyle(node) }} />
  if (node.type === 'note') return <div className="gf-note" data-id={node.id} style={{ ...toneVars(theme, node), ...spanStyle(node) }}>{node.text}</div>
  return <ItemView node={node} theme={theme} />
}

/**
 * Fills its parent (give the parent a size) and scales the scene's natural box to fit, centred.
 * The viewport is locked: no wheel or drag handlers, so page scroll passes through and text stays
 * selectable. `data-fit="ready"` marks the first fit after fonts load with edges routed — what a recorder waits on.
 */
export function Scene({ scene, theme: key = 'dark' }: { scene: SceneModel; theme?: ThemeKey }) {
  const t = THEMES[key]
  const bodies = useMemo(() => edgeBodies(scene), [scene])
  const rowIds = useMemo(() => lateralIds(scene.nodes), [scene])

  // An edge naming an id the scene does not have is an authoring error, never a silent skip.
  useEffect(() => {
    const known = new Set<string>(rowIds)
    const walk = (nodes: SceneNode[]): void => nodes.forEach((n) => { known.add(n.id); if (n.type === 'group') walk(n.children) })
    walk(scene.nodes)
    for (const e of scene.edges ?? [])
      for (const id of [e.from, e.to]) if (!known.has(id)) console.error(`graphl-flow: edge ${e.from} → ${e.to} names unknown id "${id}"`)
  }, [scene, rowIds])
  const [gaps, setGaps] = useState<Gaps>(() => baseGaps(bodies))
  const [gapsSettled, setGapsSettled] = useState(false)
  const pane = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = useState<{ pane: Size; content: Size } | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [rects, setRects] = useState<Map<string, Rect> | null>(null)

  // offsetWidth/Height are layout sizes, untouched by the transform we apply.
  const measure = () => {
    const p = pane.current, c = content.current
    if (!p || !c) return
    const next = { pane: { w: p.offsetWidth, h: p.offsetHeight }, content: { w: c.offsetWidth, h: c.offsetHeight } }
    setSizes((prev) =>
      prev && prev.pane.w === next.pane.w && prev.pane.h === next.pane.h && prev.content.w === next.content.w && prev.content.h === next.content.h
        ? prev : next)
  }
  useLayoutEffect(measure, [scene, key, gaps])

  // Node boxes in the content's natural coordinates: undo the fit by dividing out its scale.
  // Re-measured whenever the content's size, the fonts or the scene change.
  useLayoutEffect(() => {
    const c = content.current
    if (!c || !sizes) return
    const box = c.getBoundingClientRect()
    const s = box.width / c.offsetWidth || 1
    const next = new Map<string, Rect>()
    for (const el of c.querySelectorAll<HTMLElement>('[data-id]')) {
      const r = el.getBoundingClientRect()
      next.set(el.dataset.id!, { x: (r.left - box.left) / s, y: (r.top - box.top) / s, w: r.width / s, h: r.height / s })
    }
    setRects((prev) => (prev && JSON.stringify([...prev]) === JSON.stringify([...next]) ? prev : next))
  }, [sizes?.content.w, sizes?.content.h, fontsReady, scene, gaps])

  // Second pass: widen each labelled edge's body to its label's measured size (offsetWidth/Height
  // are untransformed). Label sizes do not depend on the gaps, so this settles in one more layout.
  useLayoutEffect(() => {
    const c = content.current
    if (!c || !rects) return
    const need = baseGaps(bodies)
    for (const el of c.querySelectorAll<HTMLElement>('.gf-edge-label')) {
      const i = Number(el.dataset.edge), body = bodies[i]?.body, r = routed.find((x) => x.index === i)
      if (body === undefined || !r) continue
      if (r.axis === 'h') need[body].col = Math.max(need[body].col, el.offsetWidth + 2 * LABEL_ROOM)
      else need[body].row = Math.max(need[body].row, el.offsetHeight + 2 * LABEL_ROOM)
    }
    const same = JSON.stringify(need) === JSON.stringify(gaps)
    if (!same) setGaps(need)
    setGapsSettled(same)
  }, [rects, gaps, bodies])

  useEffect(() => {
    const ro = new ResizeObserver(measure)
    ro.observe(pane.current!)
    ro.observe(content.current!)
    let live = true
    document.fonts.ready.then(() => { if (live) { measure(); setFontsReady(true) } })
    return () => { live = false; ro.disconnect() }
  }, [])

  const fit = sizes && fitTransform(sizes.pane, sizes.content)
  const routed = rects && scene.edges?.length ? routeEdges(scene.edges, rects, bodies.map((b) => b?.sides), rowIds) : []
  const vars = {
    '--gf-bg': t.bg, '--gf-surface': t.surface, '--gf-line': t.line, '--gf-ink': t.ink, '--gf-muted': t.muted, '--gf-edge': t.edge, '--gf-pulse': t.pulse, '--gf-ok': t.tones.store.accent, '--gf-err': t.tones.consume.accent,
    ...Object.fromEntries(Object.entries(t.code).map(([k, v]) => [`--gf-code-${k}`, v])),
    '--gf-accent': t.tones.neutral.accent, '--gf-tint': t.tones.neutral.tint,
  } as CSSProperties
  return (
    <div ref={pane} className="gf-scene" data-theme={key} data-fit={fit && fontsReady && rects && gapsSettled ? 'ready' : 'pending'} style={vars}>
      <div
        ref={content}
        className="gf-content"
        style={fit ? { transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` } : { visibility: 'hidden' }}
      >
        {scene.title && <div className="gf-scene-title">{scene.title}</div>}
        {scene.sub && <div className="gf-scene-sub">{scene.sub}</div>}
        <div className="gf-body" style={bodyStyle(scene.dir ?? 'col', scene.nodes, undefined, gaps[''])}>
          {scene.nodes.map((n) => <NodeView key={n.id} node={n} theme={t} gaps={gaps} />)}
        </div>
        {sizes && <Edges routed={routed} size={sizes.content} pulse={scene.pulse !== false} />}
      </div>
    </div>
  )
}
