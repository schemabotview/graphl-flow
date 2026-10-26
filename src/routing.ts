import type { Edge } from './types'

// Pure edge routing: measured node boxes in, orthogonal polylines out. No DOM here.

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
/**
 * `index` is the edge's position in `scene.edges`; `axis` is the route's direction ('h' leaves a
 * left/right face). A label sits `on` its line, or `before`/`after` it (above/below a horizontal
 * segment, left/right of a vertical one) when its port shares a face with others.
 */
export interface Routed { edge: Edge; index: number; axis: 'h' | 'v'; points: Pt[]; label: Pt & { side: 'on' | 'before' | 'after'; seg: 'h' | 'v' } }
type Face = 'left' | 'right' | 'top' | 'bottom'

/** An edge ends this far OUTSIDE its node, so the arrowhead never touches the border. */
export const ANCHOR_OUTSET = 4
/** Ports keep this far from a face's corners. */
export const PORT_INSET = 12
/** Two ports closer than this on one face make the whole face spread evenly. */
export const PORT_MIN_GAP = 14

const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
const horizontal = (f: Face) => f === 'left' || f === 'right'

/** Leave across the LARGER gap between the boxes; null when they overlap on both axes (nested). */
function facesOf(a: Rect, b: Rect): [Face, Face] | null {
  const right = b.x - (a.x + a.w), left = a.x - (b.x + b.w)
  const down = b.y - (a.y + a.h), up = a.y - (b.y + b.h)
  const gx = Math.max(right, left), gy = Math.max(down, up)
  if (gx < 0 && gy < 0) return null
  if (gx >= gy) return right >= left ? ['right', 'left'] : ['left', 'right']
  return down >= up ? ['bottom', 'top'] : ['top', 'bottom']
}

interface End { edge: number; side: 0 | 1; rect: Rect; face: Face; far: number; at: number; rank: number; count: number }

/**
 * A face with ONE edge anchors at its centre. A face with several gives each a PORT that slides
 * toward the far end's centre (clamped PORT_INSET from the corners); if any two land within
 * PORT_MIN_GAP, the face spreads evenly in far-end order instead.
 */
function placePorts(ends: End[]) {
  const byFace = new Map<string, End[]>()
  for (const e of ends) {
    const key = `${e.rect.x},${e.rect.y},${e.rect.w},${e.rect.h},${e.face}`
    byFace.set(key, [...(byFace.get(key) ?? []), e])
  }
  for (const group of byFace.values()) {
    const { rect, face } = group[0]
    const [start, len] = horizontal(face) ? [rect.y, rect.h] : [rect.x, rect.w]
    const lo = start + Math.min(PORT_INSET, len / 2), hi = start + len - Math.min(PORT_INSET, len / 2)
    if (group.length === 1) { group[0].at = start + len / 2; continue }
    group.sort((p, q) => p.far - q.far || p.edge - q.edge)
    group.forEach((e, i) => { e.rank = i; e.count = group.length })
    group.forEach((e) => (e.at = Math.min(hi, Math.max(lo, e.far))))
    if (group.some((e, i) => i > 0 && e.at - group[i - 1].at < PORT_MIN_GAP))
      group.forEach((e, i) => (e.at = lo + ((i + 1) * (hi - lo)) / (group.length + 1)))
  }
}

function anchor({ rect, face, at }: End): Pt {
  if (face === 'left') return { x: rect.x - ANCHOR_OUTSET, y: at }
  if (face === 'right') return { x: rect.x + rect.w + ANCHOR_OUTSET, y: at }
  if (face === 'top') return { x: at, y: rect.y - ANCHOR_OUTSET }
  return { x: at, y: rect.y + rect.h + ANCHOR_OUTSET }
}

/**
 * `sides[i]` names the two SIBLINGS edge i runs between — the children of its lowest common
 * ancestor that contain each end. The faces are chosen from THEIR boxes, not the nodes': two nested
 * nodes in adjacent columns can sit diagonally with a larger vertical gap, and choosing from them
 * would send the edge down through whatever lies between. Edges whose ids are unknown, or whose boxes
 * overlap (a node and its own ancestor), are skipped.
 */
export function routeEdges(edges: Edge[], rects: Map<string, Rect>, sides: ([string, string] | undefined)[] = []): Routed[] {
  const ends: End[] = []
  edges.forEach((edge, i) => {
    const a = rects.get(edge.from), b = rects.get(edge.to)
    const [sa, sb] = (sides[i] ?? [edge.from, edge.to]).map((id) => rects.get(id))
    const faces = a && b && sa && sb && facesOf(sa, sb)
    if (!faces) return
    const axis = horizontal(faces[0]) ? 'y' : 'x'
    ends.push({ edge: i, side: 0, rect: a, face: faces[0], far: centre(b)[axis], at: 0, rank: 0, count: 1 })
    ends.push({ edge: i, side: 1, rect: b, face: faces[1], far: centre(a)[axis], at: 0, rank: 0, count: 1 })
  })
  placePorts(ends)
  const routed: Routed[] = []
  for (let i = 0; i < ends.length; i += 2) {
    const [from, to] = ends[i].side === 0 ? [ends[i], ends[i + 1]] : [ends[i + 1], ends[i]]
    // Alone on both faces and the faces overlap: run straight across the middle of the overlap
    // rather than jog between two centres (a row of items of different heights).
    if (from.count === 1 && to.count === 1) {
      const span = (e: End) => (horizontal(e.face) ? [e.rect.y, e.rect.y + e.rect.h] : [e.rect.x, e.rect.x + e.rect.w])
      const [a0, a1] = span(from), [b0, b1] = span(to)
      const lo = Math.max(a0, b0), hi = Math.min(a1, b1)
      if (hi - lo >= 2 * PORT_INSET) from.at = to.at = (lo + hi) / 2
    }
    const s = anchor(from), t = anchor(to)
    let points: Pt[]
    if (horizontal(from.face)) {
      const mx = (s.x + t.x) / 2
      points = Math.abs(s.y - t.y) < 0.5 ? [s, { x: t.x, y: s.y }] : [s, { x: mx, y: s.y }, { x: mx, y: t.y }, t]
    } else {
      const my = (s.y + t.y) / 2
      points = Math.abs(s.x - t.x) < 0.5 ? [s, { x: s.x, y: t.y }] : [s, { x: s.x, y: my }, { x: t.x, y: my }, t]
    }
    const [p, q] = points.length === 4 ? [points[1], points[2]] : points
    const mid = (from.count - 1) / 2
    const side = from.count === 1 || from.rank === mid ? 'on' : from.rank < mid ? 'before' : 'after'
    const seg = p.y === q.y ? 'h' : 'v'
    routed.push({ edge: edges[from.edge], index: from.edge, axis: horizontal(from.face) ? 'h' : 'v', points, label: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, side, seg } })
  }
  return routed
}
