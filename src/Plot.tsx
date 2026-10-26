import { useId } from 'react'
import type { Theme } from './theme'
import type { Plot, PlotAxis, PlotSeries, Tone } from './types'

// A plot's x/y are DATA in the axes' own units; the engine owns every pixel. The drawing area is ONE
// fixed size for every plot, so plots in a deck line up and frames with one keep the same zoom.
// Inside the SVG the browser does not lay out text, so all plot text is IBM Plex Mono (fixed advance)
// and the gutters are counted in characters; `check` measures every <text> against the SVG box.

export const PLOT_W = 720
export const PLOT_H = 400
/** The second fixed size: a plot for a side pane, readable at full text size in ~560px. */
export const COMPACT_W = 420
export const COMPACT_H = 280
const CHAR_W = 7.9 // IBM Plex Mono at 13px (600/1000 em = 7.8), rounded up so a count can only over-reserve
const TICK_GAP = 8
const AXIS_LABEL = 24

/** Series colours in a fixed order that keeps green and orange apart; `consume` red is reserved for warnings. */
const RAMP: Tone[] = ['ingest', 'infra', 'serve', 'store']

function niceStep(span: number): number {
  const raw = Math.abs(span) / 6
  if (!(raw > 0) || !Number.isFinite(raw)) return 1
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag
}

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length

interface Axis { min: number; max: number; ticks: number[]; text: (v: number) => string; categories: boolean; label?: string }

function axis(a: PlotAxis): Axis {
  if (a.labels) {
    const n = a.labels.length
    return { min: -0.5, max: n - 0.5, ticks: a.labels.map((_, i) => i), text: (v) => a.labels![v] ?? '', categories: true, label: a.label }
  }
  const min = a.min ?? 0, max = a.max ?? 1
  const step = a.step && (max - min) / a.step <= 200 ? a.step : niceStep(max - min)
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(decimals(step) + 1)))
  return { min, max, ticks, text: (v) => (Math.abs(v) < step * 1e-9 ? 0 : v).toFixed(decimals(step)), categories: false, label: a.label }
}

const seriesPoints = (s: PlotSeries): [number, number][] => s.points ?? (s.from && s.to ? [s.from, s.to] : [])

/** A plain segment (no arrow, no tone) is a construction line: muted, and it takes no ramp colour. */
const construction = (s: PlotSeries) => s.kind === 'segment' && !s.arrow && !s.tone

/** Where a series puts its label: a segment at its tip (arrow) or midpoint; bars in the legend; anything else at its last point. */
function labelAt(s: PlotSeries): [number, number] | undefined {
  const pts = seriesPoints(s)
  if (!s.label || !pts.length || s.kind === 'bar') return undefined
  if (s.kind === 'segment' && !s.arrow) return [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]
  return pts[pts.length - 1]
}

export function PlotView({ node, theme, style }: { node: Plot; theme: Theme; style?: React.CSSProperties }) {
  const clip = `gf-clip-${useId().replace(/[^\w-]/g, '')}`
  const X = axis(node.x), Y = axis(node.y)
  const PW = node.compact ? COMPACT_W : PLOT_W, PH = node.compact ? COMPACT_H : PLOT_H
  const origin = node.axes === 'origin' || (node.axes !== 'corner' && !X.categories && !Y.categories && X.min < 0 && X.max > 0 && Y.min < 0 && Y.max > 0)
  const chars = (s: string) => s.length * CHAR_W

  // Gutters, counted: y tick labels + y axis label on the left, x ticks + x label below, the longest
  // label that runs past the right edge on the right.
  const left = Math.ceil(Math.max(...Y.ticks.map((t) => chars(Y.text(t))))) + TICK_GAP + 6 + (Y.label ? AXIS_LABEL : 0)
  const bottom = 30 + (X.label ? AXIS_LABEL : 0)
  const top = 14
  const sx = (v: number) => left + ((v - X.min) / (X.max - X.min)) * PW
  const sy = (v: number) => top + PH - ((v - Y.min) / (Y.max - Y.min)) * PH
  const overhang = Math.max(0, ...node.series.map((s) => {
    const at = labelAt(s)
    return at ? sx(at[0]) + 8 + chars(s.label!) - (left + PW) : 0
  }))
  const right = 16 + Math.ceil(overhang)
  const W = left + PW + right, H = top + PH + bottom

  const ax = origin ? sx(0) : left, ay = origin ? sy(0) : top + PH
  // The ramp advances only for series that use it, so a toned or construction series skips no colour.
  const rampAt = node.series.map((_, i) => node.series.slice(0, i).filter((q) => !q.tone && !construction(q)).length)
  const colour = (s: PlotSeries, i: number) =>
    construction(s) ? theme.muted : theme.tones[s.tone ?? RAMP[rampAt[i] % RAMP.length]].accent
  const legend = node.series.flatMap((s, i) => (s.kind === 'bar' && s.label ? [{ label: s.label, c: colour(s, i) }] : []))
  const base = sy(Math.max(Y.min, Math.min(0, Y.max)))
  const step = X.categories ? 1 : (X.ticks[1] ?? X.max) - (X.ticks[0] ?? X.min)

  return (
    <div className="gf-plot" data-id={node.id} style={style}>
      {node.title && <div className="gf-table-title">{node.title}</div>}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={node.title ?? 'plot'}>
        <defs><clipPath id={clip}><rect x={left} y={top} width={PW} height={PH} /></clipPath></defs>
        {node.grid !== false && (
          <g className="gf-plot-grid">
            {!X.categories && X.ticks.map((t) => <line key={`x${t}`} x1={sx(t)} x2={sx(t)} y1={top} y2={top + PH} />)}
            {Y.ticks.map((t) => <line key={`y${t}`} x1={left} x2={left + PW} y1={sy(t)} y2={sy(t)} />)}
          </g>
        )}
        <g className="gf-plot-axis">
          <line x1={left} x2={left + PW} y1={ay} y2={ay} />
          <line x1={ax} x2={ax} y1={top} y2={top + PH} />
        </g>
        <g className="gf-plot-ticks">
          {X.ticks.filter((t) => !(origin && t === 0)).map((t) => <text key={`x${t}`} x={sx(t)} y={ay + 20} textAnchor="middle">{X.text(t)}</text>)}
          {Y.ticks.filter((t) => !(origin && t === 0)).map((t) => <text key={`y${t}`} x={ax - TICK_GAP} y={sy(t)} textAnchor="end" dominantBaseline="middle">{Y.text(t)}</text>)}
          {X.label && <text x={left + PW / 2} y={top + PH + bottom - 6} textAnchor="middle" className="gf-plot-label">{X.label}</text>}
          {Y.label && <text transform={`translate(14 ${top + PH / 2}) rotate(-90)`} textAnchor="middle" dominantBaseline="middle" className="gf-plot-label">{Y.label}</text>}
        </g>
        <g clipPath={`url(#${clip})`}>
          {node.series.map((s, i) => {
            const c = colour(s, i), pts = seriesPoints(s)
            const d = pts.map(([x, y], j) => `${j ? 'L' : 'M'}${sx(x)},${sy(y)}`).join(' ')
            if (s.kind === 'area')
              return <g key={i}><path d={`${d} L${sx(pts[pts.length - 1][0])},${base} L${sx(pts[0][0])},${base} Z`} fill={c} fillOpacity={0.18} stroke="none" /><path d={d} fill="none" stroke={c} strokeWidth={2.5} /></g>
            if (s.kind === 'line') return <path key={i} d={d} fill="none" stroke={c} strokeWidth={2.5} strokeDasharray={s.dashed ? '7 6' : undefined} strokeLinejoin="round" />
            if (s.kind === 'scatter') return <g key={i}>{pts.map(([x, y], j) => <circle key={j} cx={sx(x)} cy={sy(y)} r={5} fill={c} />)}</g>
            if (s.kind === 'bar') {
              const n = node.series.filter((q) => q.kind === 'bar').length, k = node.series.slice(0, i).filter((q) => q.kind === 'bar').length
              const slot = ((sx(step) - sx(0)) * 0.7) / n
              return <g key={i}>{pts.map(([x, y], j) => <rect key={j} x={sx(x) - (slot * n) / 2 + k * slot} y={Math.min(sy(y), base)} width={slot - 2} height={Math.abs(base - sy(y))} fill={c} rx={2} />)}</g>
            }
            // segment: a construction or threshold line, dashed unless told otherwise; `arrow` makes it a vector.
            const [[x1, y1], [x2, y2]] = pts
            const a = Math.atan2(sy(y2) - sy(y1), sx(x2) - sx(x1)), L = 12
            const tip = [sx(x2), sy(y2)], back = [tip[0] - L * Math.cos(a), tip[1] - L * Math.sin(a)]
            return (
              <g key={i}>
                <line x1={sx(x1)} y1={sy(y1)} x2={s.arrow ? back[0] : tip[0]} y2={s.arrow ? back[1] : tip[1]} stroke={c} strokeWidth={construction(s) ? 1.75 : 2.5} strokeDasharray={s.dashed === false || s.arrow ? undefined : '7 6'} />
                {s.arrow && (x1 !== x2 || y1 !== y2) && (
                  <polygon fill={c} points={[tip, [back[0] + 6 * Math.sin(a), back[1] - 6 * Math.cos(a)], [back[0] - 6 * Math.sin(a), back[1] + 6 * Math.cos(a)]].map((p) => p.join(',')).join(' ')} />
                )}
              </g>
            )
          })}
        </g>
        {legend.length > 0 && (
          <g className="gf-plot-labels">
            {legend.map((l, i) => {
              const y = top + 18 + i * 22, x = left + PW - 12 - Math.max(...legend.map((q) => chars(q.label)))
              return <g key={i}><rect x={x - 20} y={y - 10} width={12} height={12} rx={2} fill={l.c} /><text x={x} y={y} dominantBaseline="middle" fill={l.c}>{l.label}</text></g>
            })}
          </g>
        )}
        <g className="gf-plot-labels">
          {node.series.map((s, i) => {
            const at = labelAt(s)
            // Above the point, but never above the area: a curve that ends at y.max would push it out.
            return at && <text key={i} x={sx(at[0]) + 8} y={Math.min(top + PH - 4, Math.max(top + 14, sy(at[1]) - 8))} fill={colour(s, i)}>{s.label}</text>
          })}
        </g>
      </svg>
    </div>
  )
}
