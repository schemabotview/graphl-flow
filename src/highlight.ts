// A tokenizer, not a parser: one regex and a keyword set, ported from @graphlearning/flow's
// codeHighlight. Small on purpose — slides show short excerpts, and every language shares the
// same seven colours. The comment marker is the only per-language rule.

export type TokClass = 'var' | 'method' | 'keyword' | 'string' | 'number' | 'punct' | 'ws' | 'comment'
export interface Tok { cls: TokClass; text: string }
export type Lang = 'python' | 'sql' | 'scala' | 'java' | 'js' | 'ts' | 'shell' | 'text'

const KEYWORDS = new Set([
  'import', 'from', 'def', 'return', 'lambda', 'class', 'val', 'var', 'new', 'if', 'else', 'for',
  'in', 'as', 'and', 'or', 'not', 'null', 'true', 'false', 'is',
  'select', 'where', 'group', 'by', 'join', 'inner', 'left', 'right', 'full', 'outer', 'cross',
  'on', 'using', 'having', 'order', 'asc', 'desc', 'limit', 'offset', 'distinct', 'with', 'recursive',
  'union', 'intersect', 'except', 'all', 'insert', 'into', 'values', 'update', 'set', 'delete',
  'over', 'partition', 'between', 'like', 'exists', 'case', 'when', 'then', 'end', 'count', 'sum', 'avg', 'min', 'max',
  'while', 'elif', 'try', 'raise', 'finally', 'pass', 'break', 'continue', 'yield', 'async', 'await', 'assert', 'del',
  'global', 'nonlocal', 'none', 'match',
  'const', 'let', 'function', 'export', 'default', 'interface', 'type', 'extends', 'implements', 'public',
  'private', 'static', 'void', 'object', 'trait', 'def', 'catch', 'throw', 'this', 'super', 'undefined',
])

const COMMENT: Record<Lang, string> = {
  python: '#', shell: '#', sql: '--', scala: '//', java: '//', js: '//', ts: '//', text: '\u0000',
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function tokenize(src: string, lang: Lang): Tok[] {
  if (lang === 'text') return [{ cls: 'var', text: src }]
  const token = new RegExp(`(\\s+)|(${escape(COMMENT[lang])}[\\s\\S]*)|('[^']*'?|"[^"]*"?)|(\\d[\\d.]*)|([A-Za-z_]\\w*)|(\\.\\.\\.|[\\s\\S])`, 'g')
  const out: Tok[] = []
  let afterDot = false
  for (const [text, ws, comment, str, num, word] of src.matchAll(token)) {
    const cls: TokClass = ws ? 'ws' : comment ? 'comment' : str ? 'string' : num ? 'number'
      : word ? (afterDot ? 'method' : KEYWORDS.has(word.toLowerCase()) ? 'keyword' : 'var') : 'punct'
    out.push({ cls, text })
    // In shell a dot is a file extension (`job.py`), not a member access.
    if (cls !== 'ws') afterDot = lang !== 'shell' && cls === 'punct' && text === '.'
  }
  return out
}

/** Drop a leading/trailing blank line and the common indent, so scenes can use indented template literals. */
export function dedent(src: string): string[] {
  const lines = src.replace(/^\s*\n/, '').replace(/\n\s*$/, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0))
}
