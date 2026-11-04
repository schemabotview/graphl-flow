import type { CSSProperties } from 'react'
import type { Figure, ThemeKey } from './types'

/**
 * A screenshot of what a program drew, in the window that shows it, at its `w`/`h`: the image is
 * fitted inside, centred, never stretched. The scene waits for it to decode before it reports
 * `data-fit="ready"`.
 */
export function FigureView({ node, theme, style }: { node: Figure; theme: ThemeKey; style?: CSSProperties }) {
  const src = typeof node.src === 'string' ? node.src : node.src[theme]
  const chrome = node.chrome ?? 'tab'
  return (
    <div className="gf-figure" data-id={node.id} data-chrome={chrome} style={style}>
      <div className="gf-code-bar">
        <span className="gf-dots" aria-hidden><i /><i /><i /></span>
        {node.title && <span className={chrome === 'browser' ? 'gf-url' : 'gf-code-name'}>{node.title}</span>}
      </div>
      <div className="gf-figure-body">
        <img src={src} alt={node.alt} draggable={false} data-figure={node.id} />
      </div>
    </div>
  )
}
