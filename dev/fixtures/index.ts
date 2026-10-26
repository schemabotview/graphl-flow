import type { SceneModel, Tone } from '../../src'

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
}
