import type { CSSProperties } from 'react'
import { dedent, tokenize } from './highlight'
import type { Code } from './types'

type Row = { n: number; text: string } | { fold: number }

/**
 * The lines a `code` node draws: every line, or only the `show` ranges with each skipped run
 * folded into one `··· N lines` row. Line numbers are the FILE's. Shared with the edge planner via
 * `codeLineIds`, so a line edges can address is a line that is drawn.
 */
export function codeRows(node: Code): Row[] {
  const lines = dedent(node.code)
  if (!node.show?.length || node.terminal || node.output) return lines.map((text, i) => ({ n: i + 1, text }))
  const keep = new Set(node.show.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)))
  const rows: Row[] = []
  lines.forEach((text, i) => {
    if (keep.has(i + 1)) rows.push({ n: i + 1, text })
    else if (rows.length && 'fold' in rows[rows.length - 1]) (rows[rows.length - 1] as { fold: number }).fold++
    else rows.push({ fold: 1 })
  })
  return rows
}

export const codeLineIds = (node: Code): string[] => codeRows(node).flatMap((r) => ('n' in r ? [`${node.id}.L${r.n}`] : []))

// U+00B7, not ⋯: a fallback-font glyph would change the advance next to Plex Mono.
const foldLabel = (n: number) => `··· ${n} line${n === 1 ? '' : 's'}`

export function CodeView({ node, style }: { node: Code; style?: CSSProperties }) {
  const lit = new Set(node.highlight ?? [])
  const lang = node.lang ?? (node.terminal ? 'shell' : 'text')
  // A cell's output: what the kernel printed, under its input — no bar, no frame, no gutter.
  if (node.output) return (
    <div className="gf-code" data-id={node.id} data-output style={style}>
      {codeRows(node).map((row, i) => 'n' in row && (
        <div key={i} className="gf-line" data-id={`${node.id}.L${row.n}`} data-kind={row.text.startsWith('! ') ? 'err' : 'out'}>
          {row.text.startsWith('! ') ? row.text.slice(2) : row.text || ' '}
        </div>
      ))}
    </div>
  )
  return (
    <div className="gf-code" data-id={node.id} data-terminal={node.terminal || undefined} style={style}>
      <div className="gf-code-bar">
        {node.terminal ? <span className="gf-code-name">{node.filename ?? 'terminal'}</span> : (
          <>
            <span className="gf-dots" aria-hidden><i /><i /><i /></span>
            {node.filename && <span className="gf-code-name">{node.filename}</span>}
          </>
        )}
      </div>
      <div className="gf-code-body">
        {codeRows(node).map((row, i) => {
          if ('fold' in row) return <div key={i} className="gf-line gf-fold"><span className="gf-ln" /><span>{foldLabel(row.fold)}</span></div>
          // Terminal: `$ cmd` is a command, `! text` an error, anything else output.
          if (node.terminal) {
            const kind = row.text.startsWith('$ ') ? 'cmd' : row.text.startsWith('! ') ? 'err' : 'out'
            return (
              <div key={i} className="gf-line" data-id={`${node.id}.L${row.n}`} data-kind={kind}>
                {kind === 'cmd' ? <><span className="gf-prompt">$ </span><Toks text={row.text.slice(2)} lang={lang} /></> : kind === 'err' ? row.text.slice(2) : row.text || ' '}
              </div>
            )
          }
          return (
            <div key={i} className="gf-line" data-id={`${node.id}.L${row.n}`} data-lit={lit.has(row.n) || undefined}>
              <span className="gf-ln">{row.n}</span>
              <span><Toks text={row.text} lang={lang} /></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Toks = ({ text, lang }: { text: string; lang: Parameters<typeof tokenize>[1] }) =>
  <>{text ? tokenize(text, lang).map((t, i) => <span key={i} className={`tok-${t.cls}`}>{t.text}</span>) : ' '}</>
