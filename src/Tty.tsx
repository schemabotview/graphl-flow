import type { CSSProperties } from 'react'
import type { Tty } from './types'

/** Rows addressable by edges and `focus` as `<tty>.R<n>`, 1-based like a code line. */
export const ttyRowIds = (node: Tty): string[] => node.screen.map((_, i) => `${node.id}.R${i + 1}`)

type Run = { text: string; inverse: boolean; bold: boolean }

/** One row cut into runs of the same attributes. Padded to the full width, so the grid never moves. */
function runs(text: string, row: number, node: Tty, cols: number): Run[] {
  const line = text.padEnd(cols).slice(0, cols)
  const has = (spans: [number, number, number][] | undefined, col: number) =>
    !!spans?.some(([r, a, b]) => r === row && col >= a && col < b)
  const out: Run[] = []
  for (let c = 0; c < cols; c++) {
    const inverse = has(node.inverse, c), bold = has(node.bold, c)
    const last = out[out.length - 1]
    if (last && last.inverse === inverse && last.bold === bold) last.text += line[c]
    else out.push({ text: line[c], inverse, bold })
  }
  return out
}

/**
 * A full-screen program's screen: a terminal frame with a fixed grid of `cols` × the screen's rows.
 * The size comes from the capture, never from the content, so two screenshots of `top` are the same box.
 */
export function TtyView({ node, style }: { node: Tty; style?: CSSProperties }) {
  const cols = node.cols ?? 80
  return (
    <div className="gf-code gf-tty" data-id={node.id} style={style}>
      <div className="gf-code-bar">
        <span className="gf-dots" aria-hidden><i /><i /><i /></span>
        {node.title && <span className="gf-code-name">{node.title}</span>}
      </div>
      <div className="gf-code-body">
        {node.screen.map((text, i) => (
          <div key={i} className="gf-line" data-id={`${node.id}.R${i + 1}`}>
            {runs(text, i, node, cols).map((r, k) =>
              <span key={k} data-inverse={r.inverse || undefined} data-bold={r.bold || undefined}>{r.text}</span>)}
          </div>
        ))}
      </div>
    </div>
  )
}
