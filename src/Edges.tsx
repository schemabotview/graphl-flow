import { useId } from 'react'
import type { Routed } from './routing'
import type { Size } from './fit'

/**
 * The pulse period, in seconds. A RECORDER CONTRACT: ui-shell's record-course.mjs / record-reels.mjs
 * loop every video on PULSE_S = 2.4. Change it here alone and every loop join in every recorded video
 * shows a jump. Same value, same linear motion as @graphlearning/flow's FlowEdge.
 */
export const PULSE_S = 2.4

const LABEL_SHIFT = {
  on: { h: 'translate(-50%, -50%)', v: 'translate(-50%, -50%)' },
  before: { h: 'translate(-50%, calc(-100% - 3px))', v: 'translate(calc(-100% - 3px), -50%)' },
  after: { h: 'translate(-50%, 3px)', v: 'translate(3px, -50%)' },
}

/** Draws routed edges over the content, in the content's own (unscaled) coordinates. */
export function Edges({ routed, size, pulse }: { routed: Routed[]; size: Size; pulse: boolean }) {
  const uid = useId().replace(/[^\w-]/g, '')
  const arrow = `gf-arrow-${uid}`, glow = `gf-glow-${uid}`
  // A dot travelling the path once per PULSE_S; `reverse` runs it from `to` back to `from`.
  const dot = (d: string, reverse: boolean) => (
    <circle r={4.5} className="gf-pulse" filter={`url(#${glow})`}>
      <animateMotion dur={`${PULSE_S}s`} repeatCount="indefinite" path={d} calcMode="linear" {...(reverse && { keyPoints: '1;0', keyTimes: '0;1' })} />
    </circle>
  )
  return (
    <>
      <svg className="gf-edges" width={size.w} height={size.h} aria-hidden>
        <defs>
          {/* auto-start-reverse: the same head serves the far end of a bidirectional edge. */}
          <marker id={arrow} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="gf-arrowhead" />
          </marker>
          <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {routed.map((r, i) => {
          const d = `M ${r.points.map((p) => `${p.x},${p.y}`).join(' L ')}`
          return (
            <g key={i}>
              <path
                className="gf-edge"
                data-from={r.edge.from}
                data-to={r.edge.to}
                data-edge={r.index}
                d={d}
                strokeDasharray={r.edge.dashed ? '6 5' : undefined}
                markerEnd={`url(#${arrow})`}
                markerStart={r.edge.bidirectional ? `url(#${arrow})` : undefined}
              />
              {pulse && dot(d, false)}
              {pulse && r.edge.bidirectional && dot(d, true)}
            </g>
          )
        })}
      </svg>
      {routed.map((r, i) =>
        r.edge.label ? (
          <div
            key={i}
            className="gf-edge-label"
            data-edge={r.index}
            style={{ left: r.label.x, top: r.label.y, transform: LABEL_SHIFT[r.label.side][r.label.seg] }}
          >
            {r.edge.label}
          </div>
        ) : null,
      )}
    </>
  )
}
