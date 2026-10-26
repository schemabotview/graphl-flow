import type { SceneModel, Table, TableRow } from '../../../src'

// Tables and the memory diagrams built from them. No memory-specific node exists: a stack frame,
// a heap object, an array and a hash map are all `table`s, and a pointer is an edge from a row.

const frame = (id: string, title: string, rows: Table['rows']): Table => ({ type: 'table', id, title, rows })
const ptr = (name: string, extra?: Partial<TableRow>): TableRow => ({ cells: [name, '●'], ...extra })

export const TABLE_FIXTURES: Record<string, SceneModel> = {
  'table-basic': {
    title: 'Columns, a header, a tinted row, a number column',
    nodes: [{ type: 'table', id: 'cmp', title: 'Lakehouse table formats', columns: ['format', 'ACID', 'time travel', 'engines'], rows: [
      ['Delta Lake', 'yes', 'yes', 6],
      { cells: ['Apache Iceberg', 'yes', 'yes', 9], tone: 'store' },
      ['Apache Hudi', 'yes', 'yes', 5],
      ['Parquet (plain)', 'no', 'no', 12],
    ] }],
  },
  'table-schema': {
    title: 'Row → row: a foreign key points at the key it references',
    dir: 'row',
    nodes: [
      { type: 'table', id: 'orders', title: 'orders', tone: 'ingest', columns: ['column', 'type'], rows: [
        { cells: ['id', 'bigint'], tag: 'PK' },
        { cells: ['user_id', 'bigint'], tag: 'FK' },
        ['total', 'decimal(10,2)'],
        ['created_at', 'timestamp'],
      ] },
      { type: 'table', id: 'users', title: 'users', tone: 'store', columns: ['column', 'type'], rows: [
        { cells: ['id', 'bigint'], tag: 'PK' },
        ['email', 'varchar(255)'],
        ['country', 'char(2)'],
      ] },
    ],
    edges: [{ from: 'orders.user_id', to: 'users.id' }],
  },
  'memory-stack-heap': {
    title: 'Python: names on the stack, objects on the heap',
    sub: 'nums = [3, 7]  →  total = add(nums)',
    dir: 'row',
    nodes: [
      { type: 'group', id: 'stack', title: 'Stack', tone: 'ingest', children: [
        frame('add', 'add(xs)', [ptr('xs'), { cells: ['s', 10], tone: 'consume' }]),
        frame('main', '<module>', [ptr('nums'), ['total', '—']]),
      ] },
      { type: 'group', id: 'heap', title: 'Heap', tone: 'store', dir: 'row', children: [
        { type: 'table', id: 'list', title: 'list  0x7f3a', columns: ['index', 'ref'], rows: [ptr('0'), ptr('1')] },
        { type: 'group', id: 'ints', bare: true, children: [frame('i3', 'int', [['3']]), frame('i7', 'int', [['7']])] },
      ] },
    ],
    edges: [
      { from: 'main.nums', to: 'list' },
      { from: 'add.xs', to: 'list', label: 'same object' },
      { from: 'list.0', to: 'i3' },
      { from: 'list.1', to: 'i7' },
    ],
  },
  'memory-linked-list': {
    title: 'Singly linked list: each next is a pointer',
    dir: 'row',
    nodes: [
      frame('vars', 'locals', [ptr('head')]),
      frame('n1', 'Node', [['val', 12], ptr('next')]),
      frame('n2', 'Node', [['val', 99], ptr('next')]),
      frame('n3', 'Node', [['val', 37], ['next', 'None']]),
    ],
    edges: [{ from: 'vars.head', to: 'n1' }, { from: 'n1.next', to: 'n2' }, { from: 'n2.next', to: 'n3' }],
  },
  'memory-hashmap': {
    title: 'Hash map: buckets point at entry chains',
    dir: 'row',
    nodes: [
      { type: 'table', id: 'buckets', title: 'buckets[8]', columns: ['#', 'head'], rows: [
        ['0', '∅'], ptr('1'), ['2', '∅'], ptr('3'), ['4', '∅'], ['5', '∅'], ptr('6'), ['7', '∅'],
      ] },
      { type: 'group', id: 'entries', bare: true, children: [
        frame('e1', 'Entry', [['key', '"ada"'], ['value', 36], ['next', 'None']]),
        { type: 'group', id: 'chain3', bare: true, dir: 'row', children: [
          frame('e3', 'Entry', [['key', '"bob"'], ['value', 41], ptr('next')]),
          frame('e4', 'Entry', [['key', '"cyd"'], ['value', 29], ['next', 'None']]),
        ] },
        frame('e6', 'Entry', [['key', '"dee"'], ['value', 52], ['next', 'None']]),
      ] },
    ],
    edges: [
      { from: 'buckets.1', to: 'e1' }, { from: 'buckets.3', to: 'e3' }, { from: 'buckets.6', to: 'e6' },
      { from: 'e3.next', to: 'e4', label: 'collision' },
    ],
  },
  'memory-array': {
    title: 'Array: contiguous slots, one name pointing at the block',
    dir: 'row',
    nodes: [
      frame('locals', 'locals', [ptr('arr'), ['n', 5]]),
      { type: 'table', id: 'arr', title: 'int[5]  0x1000', columns: ['0', '1', '2', '3', '4'], rows: [
        [8, 3, 5, 1, 9],
        { cells: ['0x1000', '0x1004', '0x1008', '0x100c', '0x1010'], tone: 'neutral' },
      ] },
    ],
    edges: [{ from: 'locals.arr', to: 'arr' }],
  },
}
