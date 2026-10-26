import type { Code, Group, SceneModel, SceneNode, Tree } from '../../../src'

// Varies the FRAME: explorer | (editor over terminal) | SIDE PANE. The IDE alone is narrower than
// 16:9; the side pane fills the frame and holds whatever the moment needs — a note, a chart, a memory
// diagram — or nothing. It is a FIXED column (`w`), so its content can never widen it, and every pane
// carries floors, so the boxes match frame to frame. `check` asserts EVERY frame below lands on the
// SAME fit. So no frame here draws an edge between columns: an arrow widens the gap it crosses, and
// that moves the panes. Point at a line with `highlight` and the narration instead.

const PRICING = `
  from decimal import Decimal, ROUND_HALF_UP

  from roastery.catalogue import CATALOGUE

  CENT = Decimal("0.01")


  def line_total(sku: str, quantity: int) -> Decimal:
      """Price of one order line, before any discount."""
      return CATALOGUE[sku]["price"] * quantity


  def subtotal(order: dict[str, int]) -> Decimal:
      """Sum of every line in the order."""
      return sum((line_total(sku, qty) for sku, qty in order.items()), Decimal("0"))


  def apply_discount(amount: Decimal, order: dict[str, int]) -> Decimal:
      """10% off when the order holds 3 or more bags."""
      bags = sum(order.values())
      if bags >= 3:
          amount = amount * Decimal("0.90")
      return amount.quantize(CENT, rounding=ROUND_HALF_UP)
`

const explorer = (active: string, extra: Tree['entries'] = []): Tree => ({
  type: 'tree', id: 'explorer', title: 'roastery-shop', fill: true, minW: 300, entries: [
    { name: '.venv', folder: true, state: 'muted', note: "this project's own Python" },
    { name: 'roastery', children: [
      { name: '__init__.py' },
      { name: 'catalogue.py' },
      { name: 'pricing.py', state: active === 'pricing.py' ? 'active' : undefined },
    ] },
    { name: 'main.py', state: active === 'main.py' ? 'active' : undefined },
    { name: 'pyproject.toml' },
    ...extra,
  ],
})

const FLOORS = { editor: { minW: 900, minH: 660 }, terminal: { minH: 300 }, side: 560 }

const editor = (filename: string, code: string, rest: Partial<Code> = {}): Code =>
  ({ type: 'code', id: 'editor', filename, lang: 'python', code, tone: 'store', fill: true, ...FLOORS.editor, ...rest })

const terminal = (code: string): Code =>
  ({ type: 'code', id: 'terminal', terminal: true, filename: 'terminal — roastery-shop', code, fill: true, ...FLOORS.terminal })

const side = (children: SceneNode[]): Group => ({ type: 'group', id: 'side', bare: true, w: FLOORS.side, children })

const frame = (tree: Tree, ed: Code, term: Code, pane: SceneNode[], edges: SceneModel['edges'] = []): SceneModel => ({
  dir: 'row',
  nodes: [tree, { type: 'group', id: 'workbench', bare: true, children: [ed, term] }, side(pane)],
  edges,
})

const pricingEditor = editor('roastery/pricing.py', PRICING, { show: [[1, 5], [18, 23]], highlight: [18, 19, 20, 21, 22, 23] })
const runTerminal = terminal(`
  $ python main.py
  bags      3
  subtotal   35.00
  to pay     31.50
`)

export const IDE_FRAMES: Record<string, SceneModel> = {
  'ide-frame': frame(explorer('pricing.py'), pricingEditor, runTerminal, [
    { type: 'note', id: 'side-note', tone: 'store', text: 'The side pane: a fixed column, empty or not' },
  ]),
  'ide-frame-short': frame(explorer('main.py'), editor('main.py', `
    # a short file

    print("roastery-etl: starting")
    print("orders processed:", 0)
  `, { highlight: [3, 4] }), terminal(`
    $ python main.py
    roastery-etl: starting
    orders processed: 0
  `), []),
  'ide-side-plot': frame(explorer('pricing.py'), pricingEditor, runTerminal, [
    { type: 'plot', id: 'discount', tone: 'store', compact: true, title: 'To pay vs bags (12.50 a bag)', x: { min: 0, max: 6, step: 1, label: 'bags' }, y: { min: 0, max: 80, step: 20, label: '£' }, series: [
      { kind: 'line', points: [[0, 0], [1, 12.5], [2, 25], [3, 37.5], [4, 50], [5, 62.5], [6, 75]], label: 'list', dashed: true },
      { kind: 'line', points: [[0, 0], [1, 12.5], [2, 25], [2.999, 37.49], [3, 33.75], [4, 45], [5, 56.25], [6, 67.5]], label: 'to pay' },
      { kind: 'segment', from: [3, 0], to: [3, 80], label: '3 bags' },
    ] },
    { type: 'note', id: 'side-note', tone: 'store', text: 'The discount is a step at 3 bags, not a slope.' },
  ]),
  'ide-side-memory': frame(explorer('pricing.py'), pricingEditor, runTerminal, [
    { type: 'group', id: 'mem', title: 'apply_discount — at line 23', tone: 'ingest', dir: 'row', children: [
      { type: 'table', id: 'locals', title: 'locals', rows: [['amount', '●'], ['order', '●'], ['bags', 3]] },
      { type: 'group', id: 'objs', bare: true, children: [
        { type: 'table', id: 'dec', title: 'Decimal', rows: [['31.50']] },
        { type: 'table', id: 'ord', title: 'dict', rows: [['"kenya"', 2], ['"peru"', 1]] },
      ] },
    ] },
  ], [{ from: 'locals.amount', to: 'dec' }, { from: 'locals.order', to: 'ord' }]),
}

