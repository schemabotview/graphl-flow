// A tokenizer, not a parser: one regex and a keyword set, ported from @graphlearning/flow's
// codeHighlight. Small on purpose — slides show short excerpts, and every language shares the
// same seven colours. The comment marker is the only per-language rule.

export type TokClass = 'var' | 'method' | 'keyword' | 'string' | 'number' | 'punct' | 'ws' | 'comment'
export interface Tok { cls: TokClass; text: string }
export type Lang = 'python' | 'sql' | 'scala' | 'java' | 'js' | 'ts' | 'shell' | 'hcl' | 'text'

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
  // Java's own, the primitive types included — `int x` read as two plain names without them.
  'abstract', 'boolean', 'byte', 'char', 'do', 'double', 'enum', 'final', 'float', 'goto', 'instanceof',
  'int', 'long', 'native', 'package', 'permits', 'protected', 'record', 'sealed', 'short', 'strictfp',
  'switch', 'synchronized', 'throws', 'transient', 'volatile',
])

// Terraform's block types and meta-arguments, as keywords in HCL ONLY: `data`, `output` and `module`
// are everyday names in Python, and the shared set above would recolour every Python scene.
const HCL_KEYWORDS = new Set([
  'terraform', 'provider', 'resource', 'data', 'variable', 'output', 'locals', 'module', 'backend',
  'required_providers', 'moved', 'import', 'removed', 'check', 'lifecycle', 'dynamic', 'for_each', 'count',
  'depends_on', 'each', 'var', 'local',
])

const COMMENT: Record<Lang, string> = {
  python: '#', shell: '#', hcl: '#', sql: '--', scala: '//', java: '//', js: '//', ts: '//', text: '\u0000',
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function tokenize(src: string, lang: Lang): Tok[] {
  if (lang === 'text') return [{ cls: 'var', text: src }]
  // A number carries its suffix and separators (`10L`, `1_000_000`, `3.14f`); an `@Name` is one
  // token — a Java annotation or a Python decorator, both drawn as keywords.
  const token = new RegExp(`(\\s+)|(${escape(COMMENT[lang])}[\\s\\S]*)|('[^']*'?|"[^"]*"?)|(\\d[\\w.]*)|(@[A-Za-z_]\\w*)|([A-Za-z_]\\w*)|(\\.\\.\\.|[\\s\\S])`, 'g')
  const out: Tok[] = []
  let afterDot = false
  for (const [text, ws, comment, str, num, anno, word] of src.matchAll(token)) {
    const cls: TokClass = ws ? 'ws' : comment ? 'comment' : str ? 'string' : num ? 'number' : anno ? 'keyword'
      : word ? (afterDot ? 'method' : KEYWORDS.has(word.toLowerCase()) || (lang === 'hcl' && HCL_KEYWORDS.has(word)) ? 'keyword' : 'var') : 'punct'
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
