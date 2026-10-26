import type { CSSProperties } from 'react'
import type { Theme } from './theme'
import type { Table, TableRow, Tone } from './types'

const PLAIN = /^[\w$-]+$/

/**
 * Normalised rows with their ADDRESS: explicit `id`, else the first cell when it is a plain word
 * and unique in the table. Shared by the renderer (data-id) and the edge planner (parent links),
 * so the two cannot disagree about which rows exist.
 */
export function tableRows(table: Table): (TableRow & { address?: string })[] {
  const rows = table.rows.map((r) => (Array.isArray(r) ? { cells: r } : r))
  const firsts = rows.map((r) => String(r.cells[0] ?? ''))
  return rows.map((r, i) => {
    const own = r.id ?? (PLAIN.test(firsts[i]) && firsts.indexOf(firsts[i]) === firsts.lastIndexOf(firsts[i]) ? firsts[i] : undefined)
    return { ...r, address: own && `${table.id}.${own}` }
  })
}

const tint = (theme: Theme, tone?: Tone): CSSProperties | undefined =>
  tone && ({ '--gf-accent': theme.tones[tone].accent, '--gf-tint': theme.tones[tone].tint } as CSSProperties)

export function TableView({ node, theme, style }: { node: Table; theme: Theme; style?: CSSProperties }) {
  const rows = tableRows(node)
  const tagged = rows.some((r) => r.tag)
  const width = Math.max(node.columns?.length ?? 0, ...rows.map((r) => r.cells.length))
  return (
    <div className="gf-table" data-id={node.id} style={style}>
      {node.title && <div className="gf-table-title">{node.title}</div>}
      <table>
        {node.columns && (
          <thead>
            <tr>
              {tagged && <th aria-hidden />}
              {node.columns.map((c, i) => <th key={i}>{c}</th>)}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} data-id={r.address} data-tone={r.tone} style={tint(theme, r.tone)}>
              {tagged && <td className="gf-tag-cell">{r.tag && <span className="gf-tag">{r.tag}</span>}</td>}
              {Array.from({ length: width }, (_, j) => <td key={j}>{r.cells[j] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
