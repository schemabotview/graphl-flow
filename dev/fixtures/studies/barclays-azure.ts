import type { Item, SceneModel } from '../../../src'

// Varies SCALE: 50+ nodes, three nesting levels, a five-column row over two span-all rails,
// column → nested-group edges and a fan from one face into three serving groups.

const item = (id: string, icon: string, title: string, sub?: string, bullets?: string[]): Item => ({ type: 'item', id, icon, title, sub, bullets })

export const barclaysAzure: SceneModel = {
  title: 'Case Study 2 – Barclays (Azure – Banking)',
  sub: 'End-to-End Data Architecture – Batch & Real-Time',
  dir: 'row',
  nodes: [
    { type: 'group', id: 'sources', title: 'Data Sources', tone: 'source', children: [
      { type: 'group', id: 'core', title: 'Core Banking Systems', children: [
        item('accounts', 'file', 'Accounts'),
        item('transactions', 'table', 'Transactions'),
        item('customers', 'user', 'Customer Master'),
        item('cards', 'card', 'Cards & Payments'),
      ] },
      { type: 'group', id: 'other', title: 'Other Sources', children: [
        item('crm', 'users', 'CRM'),
        item('risk-src', 'file', 'Risk & Compliance'),
        item('market', 'chart', 'Market Data', 'Refinitiv, Bloomberg'),
        item('reference', 'table', 'Reference Data'),
        item('open-banking', 'globe', 'External/Open Banking', 'APIs, Files'),
      ] },
    ] },
    { type: 'group', id: 'ingestion', title: 'Ingestion Layer', badge: 1, tone: 'ingest', children: [
      { type: 'group', id: 'batch-ing', title: 'Batch Ingestion', children: [
        item('adf', 'factory', 'Azure Data Factory (ADF)', 'Scheduled pipelines (REST, SFTP, DB, Files)'),
      ] },
      { type: 'group', id: 'rt-ing', title: 'Real-Time Ingestion', children: [
        item('eventhubs', 'stream', 'Azure Event Hubs', 'Real-time events (Transactions, Payments, Fraud Alerts)'),
      ] },
    ] },
    { type: 'group', id: 'storage', title: 'Storage & Processing Layer', badge: 2, tone: 'store', children: [
      { type: 'group', id: 'lake', title: 'Medallion Architecture', children: [
        item('adls', 'database', 'Azure Data Lake Storage Gen2', 'Lakehouse Storage with Delta'),
        { type: 'group', id: 'medallion', dir: 'row', children: [
          item('bronze', 'database', 'Bronze', 'Raw', ['Raw, immutable data', 'As-is from sources', 'Partitioned by date/source', 'Delta format']),
          item('silver', 'database', 'Silver', 'Cleansed', ['Data cleansing', 'Standardisation', 'Enrichment (ref data)', 'PII masking', 'Conformed schema']),
          item('gold', 'database', 'Gold', 'Business Ready', ['Curated, aggregated', 'Business metrics', 'Optimised for analytics', 'Delta format']),
        ] },
      ] },
      { type: 'group', id: 'batch-proc', title: 'Batch Processing (Transformations)', children: [
        item('dbx-batch', 'layers', 'Azure Databricks', 'PySpark, SQL, Delta Lake',
          ['ETL/ELT transformations', 'Data quality & business rules', 'Incremental processing', 'Write to Silver/Gold (Delta)']),
      ] },
      { type: 'group', id: 'rt-proc', title: 'Real-Time Processing (Streaming)', children: [
        item('dbx-stream', 'layers', 'Azure Databricks', 'Structured Streaming',
          ['Consume from Event Hubs', 'Event-time processing', 'Enrichment & fraud/risk rules', 'Write to Delta (Silver/Gold)']),
      ] },
    ] },
    { type: 'group', id: 'serving', title: 'Serving Layer', badge: 3, tone: 'serve', children: [
      { type: 'group', id: 'analytics', title: 'Analytics & Reporting', children: [
        item('powerbi', 'chart', 'Power BI', 'Reports & Dashboards',
          ['Customer 360', 'Regulatory reporting (FCA, PRA)', 'Risk & compliance dashboards', 'Business performance']),
      ] },
      { type: 'group', id: 'semantic', title: 'BI Semantic Model', children: [
        item('aas', 'box', 'Azure Analysis Services', undefined, ['Curated data models', 'Enterprise semantic layer', 'Row-level security (RLS)']),
      ] },
      { type: 'group', id: 'access', title: 'Data Access', children: [
        item('synapse', 'search', 'Azure Synapse Analytics', 'SQL / Serverless',
          ['Ad-hoc SQL analytics', 'Data exploration', 'Support for advanced analytics and data science']),
      ] },
    ] },
    { type: 'group', id: 'consumers', title: 'Business Consumers', tone: 'consume', children: [
      item('biz-users', 'users', 'Business Users', 'Reports & Dashboards'),
      item('risk-team', 'admin', 'Risk & Compliance', 'Regulatory Reporting'),
      item('analytics-team', 'chart', 'Analytics Teams', 'Customer & Product Insights'),
      item('ds-team', 'users', 'Data Science Teams', 'Fraud Detection, Customer Analytics'),
    ] },
    { type: 'group', id: 'governance', title: 'Governance, Security & Monitoring', badge: 4, tone: 'ingest', span: 'all', dir: 'row', children: [
      item('purview', 'search', 'Microsoft Purview', 'Data Catalog & Lineage'),
      item('keyvault', 'key', 'Azure Key Vault', 'Secrets Management'),
      item('aad', 'shield', 'Azure Active Directory', 'Identity & Access Management'),
      item('defender', 'shield', 'Microsoft Defender for Cloud', 'Security & Threat Protection'),
      item('monitor', 'activity', 'Azure Monitor', 'Logs, Metrics, Alerts'),
      item('dq', 'check', 'Data Quality', 'Validation & Reconciliation'),
    ] },
    { type: 'group', id: 'devops', title: 'DevOps & Infrastructure (IaC)', badge: 5, tone: 'infra', span: 'all', dir: 'row', children: [
      item('azdo', 'git', 'Azure DevOps', 'Repos, Pipelines, Releases'),
      item('terraform', 'layers', 'Terraform', 'Infrastructure as Code'),
      item('cicd', 'settings', 'CI/CD Pipeline', 'Build, Test, Deploy'),
      item('envs', 'server', 'Environment Management', 'Dev / Test / UAT / Prod'),
    ] },
  ],
  edges: [
    { from: 'core', to: 'batch-ing' },
    { from: 'other', to: 'rt-ing' },
    { from: 'batch-ing', to: 'lake' },
    { from: 'rt-ing', to: 'rt-proc' },
    { from: 'bronze', to: 'silver' },
    { from: 'silver', to: 'gold' },
    { from: 'storage', to: 'analytics' },
    { from: 'storage', to: 'semantic' },
    { from: 'storage', to: 'access' },
    { from: 'serving', to: 'consumers' },
  ],
}
