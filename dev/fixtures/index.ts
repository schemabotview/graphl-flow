import type { SceneModel } from '../../src'

// The harness catalog. Categorize by the capability exercised, not the domain depicted.
export const FIXTURES: Record<string, SceneModel> = {
  'item-basic': {
    nodes: [{ type: 'item', id: 'adf', title: 'Azure Data Factory', sub: 'Scheduled pipelines', bullets: ['REST', 'SFTP', 'DB'] }],
  },
  'group-columns': {
    title: 'Columns',
    dir: 'row',
    nodes: [
      { type: 'group', id: 'src', title: 'Data Sources', tone: 'source', children: [
        { type: 'item', id: 'crm', title: 'CRM' },
        { type: 'item', id: 'mkt', title: 'Market Data', sub: 'Refinitiv, Bloomberg' },
      ] },
      { type: 'group', id: 'ing', title: 'Ingestion', badge: 1, tone: 'ingest', children: [
        { type: 'item', id: 'eh', title: 'Event Hubs', sub: 'Real-time events' },
      ] },
    ],
  },
}
