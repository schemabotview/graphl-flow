// A tokenizer, not a parser: one regex and a keyword set, ported from @graphlearning/flow's
// codeHighlight. Small on purpose — slides show short excerpts, and every language shares the
// same seven colours. The comment marker is the only per-language rule.

export type TokClass = 'var' | 'method' | 'keyword' | 'string' | 'number' | 'punct' | 'ws' | 'comment'
export interface Tok { cls: TokClass; text: string }
export type Lang = 'python' | 'sql' | 'scala' | 'java' | 'js' | 'ts' | 'shell' | 'hcl' | 'ini' | 'nginx' | 'nft' | 'text'

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

// nginx's directives and blocks (0.7), keywords in `lang: 'nginx'` ONLY — `root`, `index`, `user` and
// `include` are names everywhere else. A value word (`on`, `off`, a path) stays plain.
const NGINX_KEYWORDS = new Set([
  'http', 'server', 'location', 'events', 'upstream', 'listen', 'server_name', 'root', 'index', 'try_files',
  'return', 'rewrite', 'include', 'user', 'worker_processes', 'worker_connections', 'pid', 'error_log',
  'access_log', 'sendfile', 'keepalive_timeout', 'gzip', 'ssl_certificate', 'ssl_certificate_key',
  'ssl_protocols', 'ssl_ciphers', 'proxy_pass', 'proxy_set_header', 'add_header', 'default_type', 'types',
  'client_max_body_size', 'autoindex', 'alias', 'expires', 'default_server', 'ssl', 'http2', 'deny', 'allow',
])

// nftables' grammar words (0.7), in `lang: 'nft'` ONLY.
const NFT_KEYWORDS = new Set([
  'table', 'chain', 'type', 'hook', 'priority', 'policy', 'accept', 'drop', 'reject', 'counter', 'ct',
  'state', 'established', 'related', 'invalid', 'new', 'iif', 'oif', 'iifname', 'oifname', 'tcp', 'udp',
  'dport', 'sport', 'ip', 'ip6', 'saddr', 'daddr', 'inet', 'filter', 'input', 'output', 'forward', 'nat',
  'masquerade', 'flush', 'ruleset', 'add', 'rule', 'set', 'elements', 'icmp', 'icmpv6', 'meta', 'l4proto',
  'log', 'prefix', 'limit', 'rate', 'jump', 'goto', 'return', 'define',
])

const COMMENT: Record<Lang, string> = {
  python: '#', shell: '#', hcl: '#', ini: '#', nginx: '#', nft: '#', sql: '--', scala: '//', java: '//', js: '//', ts: '//', text: '\u0000',
}

// Bash's reserved words (0.7). Before it, shell took the SHARED set, so `/var/www` drew `var` as a
// JavaScript keyword and `in`/`set`/`select` lit up inside paths and arguments.
const SHELL_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'until', 'do', 'done', 'case', 'esac', 'in',
  'function', 'select', 'time', 'return', 'local', 'export', 'readonly',
])

// SQL's DDL, transaction and PostgreSQL words (0.8), on top of the shared set in `lang: 'sql'` ONLY —
// `table`, `key`, `text`, `begin` and `index` are everyday names elsewhere. Matched case-blind.
const SQL_KEYWORDS = new Set([
  'create', 'table', 'primary', 'key', 'foreign', 'references', 'unique', 'check', 'constraint', 'default',
  'drop', 'alter', 'add', 'column', 'rename', 'index', 'view', 'materialized', 'schema', 'truncate',
  'cascade', 'restrict', 'returning', 'begin', 'commit', 'rollback', 'savepoint', 'release', 'transaction',
  'isolation', 'level', 'serializable', 'repeatable', 'read', 'committed', 'grant', 'revoke', 'role', 'to',
  'merge', 'matched', 'conflict', 'do', 'nothing', 'lateral', 'window', 'rows', 'range', 'preceding',
  'following', 'current', 'row', 'unbounded', 'filter', 'explain', 'analyze', 'vacuum', 'copy',
  'generated', 'always', 'identity', 'numeric', 'text', 'bigint', 'smallint', 'integer', 'date',
  'timestamptz', 'timestamp', 'varchar', 'serial', 'policy', 'trigger', 'lock', 'nulls', 'first', 'last',
  'interval', 'cast', 'only', 'if', 'of', 'execute', 'prepare', 'for', 'share', 'nowait', 'skip', 'locked',
])

const OWN: Partial<Record<Lang, Set<string>>> = { hcl: HCL_KEYWORDS, shell: SHELL_KEYWORDS, nginx: NGINX_KEYWORDS, nft: NFT_KEYWORDS, sql: SQL_KEYWORDS }
// Languages whose own words ADD to the shared set rather than replace it.
const ADDS = new Set<Lang>(['hcl', 'sql'])

/**
 * An ini file — a systemd unit, a `.conf` — is LINE-shaped, so it has its own rule instead of the
 * token regex: `[Section]` is a keyword, `Key=` a method (the setting), the value plain, and a line
 * starting with `#` or `;` a comment. The shared keyword set never applies (`After=` is not SQL).
 */
function tokenizeIni(src: string): Tok[] {
  const lead = src.match(/^\s*/)![0]
  const rest = src.slice(lead.length)
  const out: Tok[] = lead ? [{ cls: 'ws', text: lead }] : []
  if (rest.startsWith('#') || rest.startsWith(';')) return [...out, { cls: 'comment', text: rest }]
  if (rest.startsWith('[')) return [...out, { cls: 'keyword', text: rest }]
  const kv = rest.match(/^([\w.@-]+)(\s*=\s*)([\s\S]*)$/)
  if (!kv) return [...out, { cls: 'var', text: rest }]
  out.push({ cls: 'method', text: kv[1] }, { cls: 'punct', text: kv[2] })
  if (kv[3]) out.push({ cls: 'var', text: kv[3] })
  return out
}

// Where a dot is a file extension or an address (`job.py`, `ana.example`), not a member access; and
// where `@` is part of an address (`ana@web-01`), not an annotation; and where a word after `/` is a
// path segment (`/var/www`), never a keyword.
const NO_MEMBER = new Set<Lang>(['shell', 'nginx', 'nft'])

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function tokenize(src: string, lang: Lang): Tok[] {
  if (lang === 'text') return [{ cls: 'var', text: src }]
  if (lang === 'ini') return tokenizeIni(src)
  const own = OWN[lang]
  // A config file's own words replace the shared set: `index` and `set` are not SQL there.
  const isKeyword = (word: string) => own && !ADDS.has(lang) ? own.has(word)
    : KEYWORDS.has(word.toLowerCase()) || !!own?.has(lang === 'sql' ? word.toLowerCase() : word)
  // A number carries its suffix and separators (`10L`, `1_000_000`, `3.14f`); an `@Name` is one
  // token — a Java annotation or a Python decorator, both drawn as keywords (not in NO_MEMBER languages).
  const token = new RegExp(`(\\s+)|(${escape(COMMENT[lang])}[^\\n]*)|('[^']*'?|"[^"]*"?)|(\\d[\\w.]*)|(@[A-Za-z_]\\w*)|([A-Za-z_]\\w*)|(\\.\\.\\.|[\\s\\S])`, 'g')
  const out: Tok[] = []
  let afterDot = false
  const plain = NO_MEMBER.has(lang)
  let afterSlash = false
  // nginx: only a statement's FIRST word is a directive (`index index.html` — the second is a value).
  let statement = true
  for (const [text, ws, comment, str, num, anno, word] of src.matchAll(token)) {
    // `web-01`: in shell, digits joined to a name by `-` are part of the name, not a number.
    const joined = plain && num && out.at(-1)?.text === '-' && out.at(-2)?.cls === 'var'
    const cls: TokClass = ws ? 'ws' : comment ? 'comment' : str ? 'string' : num ? (joined ? 'var' : 'number')
      : anno ? (plain ? 'var' : 'keyword')
      : word ? (afterDot ? 'method' : !(plain && afterSlash) && (lang !== 'nginx' || statement) && isKeyword(word) ? 'keyword' : 'var') : 'punct'
    afterSlash = cls === 'punct' && text === '/'
    if (cls !== 'ws' && cls !== 'comment') statement = cls === 'punct' && (text === ';' || text === '{' || text === '}')
    out.push({ cls, text })
    if (cls !== 'ws') afterDot = !NO_MEMBER.has(lang) && cls === 'punct' && text === '.'
  }
  return out
}

/**
 * Drop the template literal's first line break, trailing blank lines and the common indent, so scenes
 * can use indented template literals. Only ONE leading blank line goes (0.8): a timeline pane's
 * transcript can START with blank rows — padding that aligns it with the other session — and
 * stripping them all shifted the whole pane up.
 */
export function dedent(src: string): string[] {
  const lines = src.replace(/^[^\S\n]*\n/, '').replace(/\n\s*$/, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0))
}
