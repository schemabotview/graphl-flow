import type { CSSProperties } from 'react'
import { dedent, tokenize, type Tok } from './highlight'
import type { Code } from './types'

type Row = { n: number; text: string } | { fold: number }

/**
 * The lines a `code` node draws: every line, or only the `show` ranges with each skipped run
 * folded into one `··· N lines` row — a terminal too (0.6: a long Terraform plan keeps its command,
 * its resource line and its summary). Line numbers are the FILE's. Shared with the edge planner via
 * `codeLineIds`, so a line edges can address is a line that is drawn.
 */
export function codeRows(node: Code): Row[] {
  const lines = dedent(node.code)
  if (!node.show?.length || node.output) return lines.map((text, i) => ({ n: i + 1, text }))
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

/**
 * A prompt: a shell's, as the three shells the course meets draw it (`sigil` is `$`/`%`, or `#` for
 * root), or psql's (0.8) default `%/%R%x%# ` — the database, the input state (`=` a new statement,
 * `-` a continued one, `(` `'` `"` inside brackets or quotes), the transaction state (`*` open, `!`
 * failed, `?` unknown) and `>`, or `#` for a superuser.
 */
export type Prompt =
  | { style: 'debian' | 'redhat' | 'zsh'; user: string; host: string; cwd: string; sigil: string; cmd: string }
  | { style: 'psql'; db: string; mode: string; tx: string; sigil: string; cmd: string }

const SHELL_PROMPTS: ['debian' | 'redhat' | 'zsh', RegExp][] = [
  ['debian', /^([\w.-]+)@([\w.-]+):(\S*?)([$#])(?: (.*))?$/],
  ['redhat', /^\[([\w.-]+)@([\w.-]+) ([^\]]*)\]([$#])(?: (.*))?$/],
  ['zsh', /^([\w.-]+)@([\w.-]+) (\S+) ([%#])(?: (.*))?$/],
]
const PSQL_PROMPT = /^([A-Za-z_][\w$]*)([=\-('"])([*!?]?)([>#])(?: (.*))?$/

export function parsePrompt(row: string): Prompt | null {
  for (const [style, re] of SHELL_PROMPTS) {
    const m = row.match(re)
    if (m) return { style, user: m[1], host: m[2], cwd: m[3], sigil: m[4], cmd: m[5] ?? '' }
  }
  const m = row.match(PSQL_PROMPT)
  return m ? { style: 'psql', db: m[1], mode: m[2], tx: m[3], sigil: m[4], cmd: m[5] ?? '' } : null
}

type ConsoleRow =
  | { n: number; kind: 'cmd'; prompt: Prompt; toks: Tok[] }
  | { n: number; kind: 'cont'; toks: Tok[] }
  | { n: number; kind: 'out'; text: string }

/**
 * Classify a transcript's rows. A prompt row is a command; a command row exactly `cols` wide wrapped,
 * so the rows after it continue the command until one is shorter. psql (0.8) draws a prompt on every
 * line of a statement, so a psql command also takes the continuation-prompt rows after it (`-`, `(`,
 * `'`, `"`) as further LINES. The command is tokenized WHOLE — lines joined by `\n` — and its tokens
 * cut back into rows, so a string crossing a wrap or a line keeps its colour. A shell command is
 * `shell`, a psql one `sql`.
 */
export function consoleRows(lines: string[], cols: number): Map<number, ConsoleRow> {
  const out = new Map<number, ConsoleRow>()
  // A row exactly `cols` wide wrapped into the next — unless the next is a prompt of its own.
  const wraps = (r: number) => lines[r].length === cols && r + 1 < lines.length && !parsePrompt(lines[r + 1])
  for (let i = 0; i < lines.length; i++) {
    const prompt = parsePrompt(lines[i])
    if (!prompt) { out.set(i + 1, { n: i + 1, kind: 'out', text: lines[i] }); continue }
    // Each line: its prompt and its physical rows (the prompt row, then the rows it wrapped into).
    const parts: { prompt: Prompt; rows: number[] }[] = []
    let r = i, p: Prompt | null = prompt
    while (p) {
      const rows = [r]
      while (wraps(rows[rows.length - 1])) rows.push(rows[rows.length - 1] + 1)
      parts.push({ prompt: p, rows })
      r = rows[rows.length - 1] + 1
      const next = prompt.style === 'psql' && r < lines.length ? parsePrompt(lines[r]) : null
      p = next?.style === 'psql' && next.mode !== '=' ? next : null
    }
    const phys = parts.flatMap(({ prompt: q, rows }) => rows.map((row, k) => ({ row, prompt: k === 0 ? q : null })))
    const widths = phys.map(({ row, prompt: q }) => (q ? q.cmd.length : lines[row].length))
    const text = parts.map(({ prompt: q, rows }) => rows.map((row, k) => (k === 0 ? q.cmd : lines[row])).join('')).join('\n')
    // A psql meta-command (`\d`, `\i file.sql`) is psql's own, not SQL: the command drawn as a method,
    // its arguments plain — a path is not SQL.
    const meta = prompt.style === 'psql' ? text.match(/^(\\\S+)([\s\S]*)$/) : null
    const toks: Tok[] = meta ? [{ cls: 'method', text: meta[1] }, ...(meta[2] ? [{ cls: 'var' as const, text: meta[2] }] : [])]
      : tokenize(text, prompt.style === 'psql' ? 'sql' : 'shell')
    const cut: Tok[][] = phys.map(() => [])
    let row = 0, left = widths[0]
    for (const t of toks) {
      t.text.split('\n').forEach((piece, j) => {
        if (j > 0) { row++; left = widths[row] }
        let rest = piece
        while (rest.length > left && row < widths.length - 1) {
          if (left) cut[row].push({ cls: t.cls, text: rest.slice(0, left) })
          rest = rest.slice(left); row++; left = widths[row]
        }
        if (rest) { cut[row].push({ cls: t.cls, text: rest }); left -= rest.length }
      })
    }
    phys.forEach(({ row: pr, prompt: q }, k) => out.set(pr + 1, q ? { n: pr + 1, kind: 'cmd', prompt: q, toks: cut[k] } : { n: pr + 1, kind: 'cont', toks: cut[k] }))
    i = phys[phys.length - 1].row
  }
  return out
}

const PromptView = ({ p }: { p: Prompt }) => p.style === 'psql' ? (
  <span className="gf-ps" data-root={p.sigil === '#' || undefined}>
    <span className="gf-ps-who">{p.db}</span>
    {p.mode}
    {p.tx && <span className="gf-ps-tx" data-tx={p.tx}>{p.tx}</span>}
    {p.sigil}{' '}
  </span>
) : (
  <span className="gf-ps" data-root={p.sigil === '#' || undefined}>
    {p.style === 'redhat' && '['}
    <span className="gf-ps-who">{p.user}@{p.host}</span>
    {p.style === 'debian' ? ':' : ' '}
    <span className="gf-ps-cwd">{p.cwd}</span>
    {p.style === 'redhat' && ']'}
    {p.style === 'zsh' && ' '}
    {p.sigil}{' '}
  </span>
)

function ConsoleView({ node, style }: { node: Code; style?: CSSProperties }) {
  const lit = new Set(node.highlight ?? [])
  const rows = consoleRows(dedent(node.code), node.cols ?? 80)
  return (
    <div className="gf-code" data-id={node.id} data-console style={style}>
      <div className="gf-code-bar">
        <span className="gf-dots" aria-hidden><i /><i /><i /></span>
        {node.filename && <span className="gf-code-name">{node.filename}</span>}
      </div>
      <div className="gf-code-body">
        {codeRows(node).map((r, i) => {
          if ('fold' in r) return <div key={i} className="gf-line gf-fold">{foldLabel(r.fold)}</div>
          const row = rows.get(r.n)!
          return (
            <div key={i} className="gf-line" data-id={`${node.id}.L${r.n}`} data-kind={row.kind} data-lit={lit.has(r.n) || undefined}
              data-root={row.kind === 'cmd' && row.prompt.sigil === '#' || undefined}>
              {row.kind === 'out' ? <span>{row.text}</span> : <>
                {row.kind === 'cmd' && <PromptView p={row.prompt} />}
                {row.toks.map((t, k) => <span key={k} className={`tok-${t.cls}`}>{t.text}</span>)}
                {row.kind === 'cont' && !row.toks.length && ' '}
              </>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CodeView({ node, style }: { node: Code; style?: CSSProperties }) {
  if (node.console) return <ConsoleView node={node} style={style} />
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
          if ('fold' in row) return node.terminal
            ? <div key={i} className="gf-line gf-fold">{foldLabel(row.fold)}</div>
            : <div key={i} className="gf-line gf-fold"><span className="gf-ln" /><span>{foldLabel(row.fold)}</span></div>
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
