import type { SceneModel, Tone } from '../../src'
import { barclaysAzure } from './studies/barclays-azure'
import { IDE_FRAMES } from './studies/ide-frame'
import { sparkTopology } from './studies/spark-topology'
import { TABLE_FIXTURES } from './tables'
import { CODE_FIXTURES } from './code'
import { PLOT_FIXTURES } from './plots'
import { AWS, AZURE, BRAND, LUCIDE } from '../../src/icons'

// The harness catalog. Categorize by the capability exercised, not the domain depicted;
// keep ids stable — consumer links depend on them.

const TONES: Tone[] = ['neutral', 'source', 'ingest', 'store', 'serve', 'consume', 'infra']

export const FIXTURES: Record<string, SceneModel> = {
  // nodes
  'item-basic': {
    nodes: [{ type: 'item', id: 'adf', title: 'Azure Data Factory', sub: 'Scheduled pipelines', bullets: ['REST', 'SFTP', 'DB'] }],
  },
  'item-icons': {
    dir: 'row',
    nodes: [
      { type: 'item', id: 'db', icon: 'database', title: 'Accounts' },
      { type: 'item', id: 'eh', icon: 'stream', title: 'Event Hubs', sub: 'Real-time events' },
      { type: 'item', id: 'bi', icon: 'chart', title: 'Power BI', sub: 'Reports & Dashboards', bullets: ['Customer 360', 'Regulatory reporting'] },
      { type: 'item', id: 'none', icon: 'not-a-key', title: 'Unknown icon key renders no icon' },
    ],
  },
  'item-stack': {
    title: 'stack: icon on top, text centred — a column of peer cards',
    nodes: [{ type: 'group', id: 'consumers', title: 'Business Consumers', tone: 'consume', children: [
      { type: 'item', id: 'u', icon: 'users', title: 'Business Users', sub: 'Reports & Dashboards', stack: true },
      { type: 'item', id: 'd', icon: 'users', title: 'Data Science Teams', sub: 'Fraud Detection, Customer Analytics', stack: true },
    ] }],
  },
  // icons — every key of every set, so the sweep renders each one in both themes
  ...Object.fromEntries(Object.entries({ lucide: LUCIDE, azure: AZURE, aws: AWS, brand: BRAND }).map(([set, keys]) => [`icons-${set}`, {
    title: `${set} — ${Object.keys(keys).length} keys`,
    nodes: [{ type: 'group', id: set, dir: 'grid', cols: 6, children: Object.keys(keys).map((k) => ({ type: 'item', id: k, icon: k, title: k })) }],
  } satisfies SceneModel])),
  // containers
  'group-tones': {
    dir: 'row',
    nodes: TONES.map((tone) => ({ type: 'group', id: tone, title: tone, tone, children: [
      { type: 'item', id: `${tone}-a`, icon: 'database', title: 'Inherits tone' },
      { type: 'group', id: `${tone}-n`, title: 'Nested card', children: [{ type: 'item', id: `${tone}-b`, icon: 'server', title: 'Item' }] },
    ] })),
  },
  'group-columns': {
    title: 'Columns',
    dir: 'row',
    nodes: [
      { type: 'group', id: 'src', title: 'Data Sources', tone: 'source', children: [
        { type: 'item', id: 'crm', icon: 'user', title: 'CRM' },
        { type: 'item', id: 'mkt', icon: 'chart', title: 'Market Data', sub: 'Refinitiv, Bloomberg' },
      ] },
      { type: 'group', id: 'ing', title: 'Ingestion', badge: 1, tone: 'ingest', children: [
        { type: 'item', id: 'eh', icon: 'stream', title: 'Event Hubs', sub: 'Real-time events' },
      ] },
    ],
  },
  'group-spread': {
    title: 'spread: children spaced over a stretched column (right); default stacks at the top (left)',
    dir: 'row',
    nodes: [
      { type: 'group', id: 'top', title: 'Default', tone: 'ingest', children: [
        { type: 'item', id: 'a1', icon: 'code', title: 'One' }, { type: 'item', id: 'a2', icon: 'brain', title: 'Two' },
      ] },
      { type: 'group', id: 'spread', title: 'spread: true', tone: 'store', spread: true, children: [
        { type: 'item', id: 'b1', icon: 'code', title: 'One' }, { type: 'item', id: 'b2', icon: 'brain', title: 'Two' },
      ] },
      { type: 'group', id: 'tall', title: 'Sets the height', tone: 'serve', children: ['1', '2', '3', '4', '5', '6'].map((n) => ({ type: 'item' as const, id: `c${n}`, icon: 'server', title: `Row ${n}` })) },
    ],
  },
  // layout
  'group-grid': {
    nodes: [
      { type: 'group', id: 'g', title: 'cols: 3, then a span: all rail', dir: 'grid', cols: 3, tone: 'store', children: [
        ...['Bronze', 'Silver', 'Gold', 'Platinum'].map((t) => ({ type: 'item' as const, id: t, icon: 'database', title: t })),
        { type: 'item', id: 'rail', icon: 'layers', title: 'Spans every column', span: 'all' },
      ] },
    ],
  },
  'row-with-rail': {
    dir: 'row',
    nodes: [
      { type: 'group', id: 'a', title: 'Column A', badge: 1, tone: 'ingest', children: [{ type: 'item', id: 'a1', icon: 'factory', title: 'Short' }] },
      { type: 'group', id: 'b', title: 'Column B', badge: 2, tone: 'store', children: [
        { type: 'item', id: 'b1', icon: 'database', title: 'Taller column', bullets: ['one', 'two', 'three'] },
      ] },
      { type: 'group', id: 'gov', title: 'Governance — span: all under a row', badge: 4, tone: 'infra', span: 'all', dir: 'row', children: [
        { type: 'item', id: 'kv', icon: 'key', title: 'Key Vault', sub: 'Secrets' },
        { type: 'item', id: 'mon', icon: 'activity', title: 'Monitor', sub: 'Logs, Metrics' },
      ] },
    ],
  },
  // fit
  'fit-wide': {
    title: 'A wide strip letterboxes top and bottom',
    dir: 'row',
    nodes: Array.from({ length: 10 }, (_, i) => ({ type: 'item' as const, id: `w${i}`, icon: 'server', title: `Stage ${i + 1}` })),
  },
  'fit-tall': {
    title: 'A tall column pillarboxes left and right',
    nodes: Array.from({ length: 12 }, (_, i) => ({ type: 'item' as const, id: `t${i}`, icon: 'database', title: `Row ${i + 1}` })),
  },
  // edges
  'edge-chain': {
    dir: 'row',
    nodes: ['Ingest', 'Process', 'Serve'].map((t) => ({ type: 'item' as const, id: t, icon: 'workflow', title: t })),
    edges: [{ from: 'Ingest', to: 'Process', label: 'batch' }, { from: 'Process', to: 'Serve', dashed: true, label: 'dashed' }],
  },
  'edge-fan': {
    title: 'One face, several edges → one port each',
    dir: 'row',
    nodes: [
      { type: 'item', id: 'hub', icon: 'stream', title: 'Event Hubs' },
      { type: 'group', id: 'out', title: 'Consumers', tone: 'consume', children: ['Fraud', 'Risk', 'Analytics', 'Archive'].map((t) => ({ type: 'item' as const, id: t, icon: 'users', title: t })) },
    ],
    edges: ['Fraud', 'Risk', 'Analytics', 'Archive'].map((t) => ({ from: 'hub', to: t })),
  },
  'edge-bidirectional': {
    title: 'bidirectional: a head at both ends, a pulse each way',
    dir: 'row',
    nodes: [
      { type: 'item', id: 'app', icon: 'server', title: 'Service' },
      { type: 'item', id: 'db', icon: 'database', title: 'Database' },
      { type: 'item', id: 'cache', icon: 'zap', title: 'Cache' },
    ],
    edges: [{ from: 'app', to: 'db', label: 'read / write', bidirectional: true }, { from: 'db', to: 'cache', dashed: true, bidirectional: true }],
  },
  'edge-groups': {
    title: 'Group → group, item → nested item, and down into a rail',
    dir: 'row',
    nodes: [
      { type: 'group', id: 'src', title: 'Sources', tone: 'source', children: [
        { type: 'item', id: 'crm', icon: 'user', title: 'CRM' }, { type: 'item', id: 'mkt', icon: 'chart', title: 'Market Data' },
      ] },
      { type: 'group', id: 'ing', title: 'Ingestion', badge: 1, tone: 'ingest', children: [
        { type: 'group', id: 'batch', title: 'Batch', children: [{ type: 'item', id: 'adf', icon: 'factory', title: 'Data Factory' }] },
        { type: 'group', id: 'rt', title: 'Real-time', children: [{ type: 'item', id: 'eh', icon: 'stream', title: 'Event Hubs' }] },
      ] },
      { type: 'group', id: 'gov', title: 'Governance', badge: 4, tone: 'infra', span: 'all', dir: 'row', children: [
        { type: 'item', id: 'kv', icon: 'key', title: 'Key Vault' }, { type: 'item', id: 'mon', icon: 'activity', title: 'Monitor' },
      ] },
    ],
    edges: [{ from: 'src', to: 'batch' }, { from: 'mkt', to: 'eh' }, { from: 'ing', to: 'gov', dashed: true }],
  },
  // tables & memory
  ...TABLE_FIXTURES,
  // code
  ...CODE_FIXTURES,
  // charts
  ...PLOT_FIXTURES,
  'tree-basic': {
    title: 'tree: an explorer whose entries edges can address',
    dir: 'row',
    nodes: [
      { type: 'tree', id: 'repo', entries: [
        { name: 'src', children: [
          { name: 'Scene.tsx', state: 'active', note: 'M' },
          { name: 'Tree.tsx', state: 'new', note: 'U' },
          { name: 'routing.ts' },
        ] },
        { name: 'dist', folder: true, state: 'muted' },
        { name: 'package.json' },
      ] },
      { type: 'code', id: 'src', filename: 'src/Tree.tsx', lang: 'ts', code: `
        export function TreeView({ node }: { node: Tree }) {
          return <div className="gf-tree">…</div>
        }
      ` },
    ],
    edges: [{ from: 'repo.src/Tree.tsx', to: 'src', label: 'new file' }],
  },
  // studies — architecture-scale stress cases
  'barclays-azure': barclaysAzure,
  'spark-topology': sparkTopology,
  ...IDE_FRAMES,
}

/** Sidebar sections, by the capability a fixture exercises. Every fixture lands in exactly one. */
const SECTIONS: [string, (id: string) => boolean][] = [
  ['Studies', (id) => id === 'barclays-azure' || id === 'spark-topology' || id in IDE_FRAMES],
  ['Nodes', (id) => id.startsWith('item-')],
  ['Containers & layout', (id) => id.startsWith('group-') || id.startsWith('row-')],
  ['Edges', (id) => id.startsWith('edge-')],
  ['Code', (id) => id.startsWith('code-') || id.startsWith('tree-')],
  ['Charts', (id) => id.startsWith('plot-')],
  ['Tables & memory', (id) => id.startsWith('table-') || id.startsWith('memory-')],
  ['Fit', (id) => id.startsWith('fit-')],
  ['Icons', (id) => id.startsWith('icons-')],
]

export const CATEGORIES: [string, string[]][] = SECTIONS.map(([label, has]) => [label, Object.keys(FIXTURES).filter(has)])

const placed = CATEGORIES.flatMap(([, ids]) => ids)
const lost = Object.keys(FIXTURES).filter((id) => placed.filter((p) => p === id).length !== 1)
if (lost.length) throw new Error(`fixtures not in exactly one section: ${lost.join(', ')}`)
