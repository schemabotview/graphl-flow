import { useId } from 'react'
import type { Routed } from './edges'
import type { Size } from './fit'

const LABEL_SHIFT = {
  on: { h: 'translate(-50%, -50%)', v: 'translate(-50%, -50%)' },
  before: { h: 'translate(-50%, calc(-100% - 3px))', v: 'translate(calc(-100% - 3px), -50%)' },
  after: { h: 'translate(-50%, 3px)', v: 'translate(3px, -50%)' },
}

/** Draws routed edges over the content, in the content's own (unscaled) coordinates. */
export function Edges({ routed, size }: { routed: Routed[]; size: Size }) {
  const arrow = `gf-arrow-${useId().replace(/[^\w-]/g, '')}`
  return (
    <>
      <svg className="gf-edges" width={size.w} height={size.h} aria-hidden>
        <defs>
          <marker id={arrow} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="gf-arrowhead" />
          </marker>
        </defs>
        {routed.map((r, i) => (
          <path
            key={i}
            className="gf-edge"
            data-from={r.edge.from}
            data-to={r.edge.to}
            d={`M ${r.points.map((p) => `${p.x},${p.y}`).join(' L ')}`}
            strokeDasharray={r.edge.dashed ? '6 5' : undefined}
            markerEnd={`url(#${arrow})`}
          />
        ))}
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
