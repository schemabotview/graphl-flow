import type { Code, Figure, Group, SceneModel, SceneNode, Tree } from '../../../src'
import { CHECKOUT_PAGE, CHECKOUT_SVG } from '../figures'

// Varies the FRAME, as python-expense-tracker's `src/scenes/ide.ts` builds it (frame v2):
//
//   [explorer] | editor (EDITOR_ROWS[v])            | side pane (SIDE_W): the section's mental model
//              | terminal docked under it (TERMINAL_ROWS[v])
//
// Two variants: `code`, a tall editor over a short terminal, and `run`, a short editor over a tall
// terminal. Every variant has the SAME height (FRAME_H) and every column a FIXED width (`w`), so
// content wider than its column overflows (check fails it) instead of moving the frame. The frame is
// exactly 16:9 at a 1% margin (`padding`), so every frame lands on the same fit; `check` asserts it.
// The explorer is a `compact` tree; without it the side pane takes its column (BARE_SIDE_W), so a
// bare frame fills 16:9 and lands on the same fit as the rest. The editor soft-WRAPS (`wrap`) a line past COLS. The
// side pane is titled with the mental model and holds a diagram (`spread`). No edges between columns:
// an arrow widens the gap it crosses, and that moves the panes.
//
// Sizes are the repo's, measured on 0.10 (15px/1.6 Plex Mono, 9.0px advance, 24px rows): FULL_W 1344
// × FRAME_H 756; EXPLORER_W 175 | WORK_W 715 (72 columns + 67px gutter, padding and borders) | SIDE_W
// 434. A pane is ROWS × 24px plus 51px of chrome. The last terminal row is left free for the shell's
// breadcrumb; with the explorer the breadcrumb sits on the explorer and the terminal has it back.

const ROW = 24
const CHROME = 51
export const GAP = 10
export const FULL_W = 1344
export const FRAME_H = Math.round(FULL_W / (16 / 9))
export const SIDE_W = 434
export const WORK_W = 715
export const EXPLORER_W = FULL_W - (WORK_W + GAP + SIDE_W) - GAP
/** The side pane without an explorer: it takes the explorer's column, so the frame still fills 16:9. */
export const BARE_SIDE_W = SIDE_W + GAP + EXPLORER_W
export const SIDE_PLOT_W = SIDE_W - 34

type Variant = 'code' | 'run'
const EDITOR_ROWS: Record<Variant, number> = { code: 18, run: 9 }
const editorH = (v: Variant) => EDITOR_ROWS[v] * ROW + CHROME
const terminalH = (v: Variant) => FRAME_H - GAP - editorH(v)

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

const tree = (active: string): Tree['entries'] => [
  { name: '.venv', folder: true, state: 'muted' },
  { name: 'roastery', children: [
    { name: '__init__.py' },
    { name: 'catalogue.py' },
    { name: 'pricing.py', state: active === 'pricing.py' ? 'active' : undefined, note: active === 'pricing.py' ? 'M' : undefined },
  ] },
  { name: 'tests', children: [{ name: 'test_pricing.py', state: active === 'test_pricing.py' ? 'active' : undefined }] },
  { name: 'main.py', state: active === 'main.py' ? 'active' : undefined },
  { name: 'pyproject.toml' },
]

interface Frame {
  model: string
  variant: Variant
  /** The active file in the explorer; none draws the frame without one. */
  explorer?: string
  editor: Partial<Code> & { filename: string; code: string }
  session: string
  /** A picture the program drew, in the terminal's slot at the terminal's size: ONE bottom panel. */
  output?: Omit<Figure, 'type' | 'id' | 'w' | 'h'>
  side: SceneNode[]
  edges?: SceneModel['edges']
}

const frame = ({ model, variant: v, explorer, editor, session, output, side, edges = [] }: Frame): SceneModel => {
  const code: Code = { type: 'code', id: 'editor', lang: 'python', wrap: true, tone: 'ingest', fill: true, w: WORK_W, minH: editorH(v), ...editor }
  const term: Code | Figure = output
    ? { type: 'figure', id: 'output', ...output, w: WORK_W, h: terminalH(v) }
    : { type: 'code', id: 'terminal', terminal: true, filename: 'terminal — roastery-shop', code: session, fill: true, w: WORK_W, minH: terminalH(v) }
  const pane: Group = { type: 'group', id: 'side', title: model, tone: 'ingest', spread: true, w: explorer ? SIDE_W : BARE_SIDE_W, minH: FRAME_H, children: side }
  const tr: SceneNode[] = explorer
    ? [{ type: 'tree', id: 'explorer', title: 'roastery-shop', entries: tree(explorer), compact: true, fill: true, w: EXPLORER_W, minH: FRAME_H }]
    : []
  return { dir: 'row', padding: 0.01, nodes: [...tr, { type: 'group', id: 'workbench', bare: true, children: [code, term] }, pane], edges }
}

const pricingEditor = { filename: 'roastery/pricing.py', code: PRICING, show: [[1, 5], [18, 23]] as [number, number][], highlight: [21, 22, 23] }
const RUN = `
  $ python main.py
  bags      3
  subtotal   35.00
  to pay     31.50
`

const memory: SceneNode[] = [
  { type: 'group', id: 'mem', title: 'apply_discount — at line 23', dir: 'row', children: [
    { type: 'table', id: 'locals', title: 'locals', rows: [['amount', '●'], ['order', '●'], ['bags', 3]] },
    { type: 'group', id: 'objs', bare: true, children: [
      { type: 'table', id: 'dec', title: 'Decimal', rows: [['31.50']] },
      { type: 'table', id: 'ord', title: 'dict', rows: [['"kenya"', 2], ['"peru"', 1]] },
    ] },
  ] },
]
const memoryEdges = [{ from: 'locals.amount', to: 'dec' }, { from: 'locals.order', to: 'ord' }]

// A pytest run (wrapped at 72 columns, as the repo's terminal() does) long enough to need the `run` variant's tall terminal (16 rows, 17 with the explorer).
const PYTEST = `
  $ python -m pytest -q
  ..F.                                                                 [100%]
  ================================ FAILURES ================================
  _________________________ test_discount_at_three _________________________

      def test_discount_at_three():
  >       assert apply_discount(Decimal("37.50"), {"kenya": 3}) == Decimal
  ("33.00")
  E       AssertionError: assert Decimal('33.75') == Decimal('33.00')

  tests/test_pricing.py:14: AssertionError
  ======================== short test summary info =========================
  FAILED tests/test_pricing.py::test_discount_at_three - AssertionError
  1 failed, 3 passed in 0.04s
`

const TEST = `
  from decimal import Decimal

  from roastery.pricing import apply_discount


  def test_discount_at_three():
      assert apply_discount(Decimal("37.50"), {"kenya": 3}) == Decimal("33.00")
`

const results: SceneNode[] = [
  { type: 'table', id: 'cases', title: 'test_pricing.py', columns: ['test', 'result'], rows: [
    ['test_line_total', 'passed'], ['test_subtotal', 'passed'], ['test_discount_at_three', 'FAILED'], ['test_no_discount', 'passed'],
  ] },
  { type: 'group', id: 'why', title: 'apply_discount', dir: 'row', children: [
    { type: 'item', id: 'calc', title: '37.50 × 0.90', sub: '3 bags' },
    { type: 'item', id: 'got', icon: 'check', title: '33.75', sub: 'the test wants 33.00' },
  ] },
]

const plot: SceneNode[] = [
  { type: 'plot', id: 'discount', compact: true, w: SIDE_PLOT_W, title: 'To pay vs bags (12.50 a bag)', x: { min: 0, max: 6, step: 1, label: 'bags' }, y: { min: 0, max: 80, step: 20, label: '£' }, series: [
    { kind: 'line', points: [[0, 0], [1, 12.5], [2, 25], [3, 37.5], [4, 50], [5, 62.5], [6, 75]], label: 'list', dashed: true },
    { kind: 'line', points: [[0, 0], [1, 12.5], [2, 25], [2.999, 37.49], [3, 33.75], [4, 45], [5, 56.25], [6, 67.5]], label: 'to pay' },
    { kind: 'segment', from: [3, 0], to: [3, 80], label: '3 bags' },
  ] },
]

// The output panel (0.11): what the program DREW, shot in a browser, in the terminal's slot.
const RENDER = `
  import { writeFile } from 'node:fs/promises'
  import { layout } from './src/layout.ts'
  import { SvgRenderer } from './src/render/svg.ts'
  import { checkout } from './scenes/checkout.ts'

  const rects = layout(checkout)
  const svg = new SvgRenderer().draw(checkout, rects)
  await writeFile('out/checkout.svg', svg)
`

const pipeline: SceneNode[] = [
  { type: 'group', id: 'pipe', title: 'scene → picture', children: [
    { type: 'item', id: 'scene', title: 'Scene', sub: 'typed data: nodes and edges' },
    { type: 'item', id: 'rects', title: 'Map<string, Rect>', sub: 'layout: where each box goes' },
    { type: 'item', id: 'svg', title: '<svg> string', sub: 'the renderer: one element per box' },
  ] },
]
const pipelineEdges = [{ from: 'scene', to: 'rects', label: 'layout' }, { from: 'rects', to: 'svg', label: 'draw' }]

export const IDE_FRAMES: Record<string, SceneModel> = {
  'ide-frame': frame({ model: 'A discount makes a new Decimal', variant: 'code', explorer: 'pricing.py', editor: pricingEditor, session: RUN, side: memory, edges: memoryEdges }),
  'ide-frame-run': frame({ model: 'A failing test names the line', variant: 'run', explorer: 'test_pricing.py',
    editor: { filename: 'tests/test_pricing.py', code: TEST, highlight: [7] }, session: PYTEST, side: results, edges: [{ from: 'calc', to: 'got' }] }),
  'ide-frame-wrap': frame({ model: 'One long line, wrapped', variant: 'code', explorer: 'main.py', editor: { filename: 'main.py', code: `
    from roastery.pricing import apply_discount, subtotal

    order = {"kenya": 2, "peru": 1}
    print("bags", sum(order.values()), "| subtotal", subtotal(order), "| to pay", apply_discount(subtotal(order), order))
  `, highlight: [4] }, session: RUN, side: plot }),
  'ide-frame-figure': frame({ model: 'A scene becomes a picture', variant: 'run',
    editor: { filename: 'main.ts', lang: 'ts', code: RENDER, highlight: [7, 8] }, session: '',
    output: { alt: 'the checkout diagram miniflow drew', src: CHECKOUT_SVG, title: 'out/checkout.svg' }, side: pipeline, edges: pipelineEdges }),
  'ide-frame-browser': frame({ model: 'A scene becomes a picture', variant: 'run',
    editor: { filename: 'main.ts', lang: 'ts', code: RENDER, highlight: [7, 8] }, session: '',
    output: { alt: 'the checkout page', src: CHECKOUT_PAGE, chrome: 'browser', title: 'localhost:5173' }, side: pipeline, edges: pipelineEdges }),
  'ide-side-plot': frame({ model: 'The discount is a step at 3 bags', variant: 'code', explorer: 'pricing.py', editor: pricingEditor, session: RUN, side: plot }),
}

/** The frame without its explorer: the side pane is wider, the editor and terminal the same. */
export const IDE_BARE_FRAMES: Record<string, SceneModel> = {
  'ide-bare': frame({ model: 'A discount makes a new Decimal', variant: 'code', editor: pricingEditor, session: RUN, side: memory, edges: memoryEdges }),
  'ide-bare-run': frame({ model: 'A failing test names the line', variant: 'run',
    editor: { filename: 'tests/test_pricing.py', code: TEST, highlight: [7] }, session: PYTEST, side: results, edges: [{ from: 'calc', to: 'got' }] }),
}
