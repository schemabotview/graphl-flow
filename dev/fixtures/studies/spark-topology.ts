import type { Group, Item, SceneModel } from '../../../src'

// Varies the SHAPE of the composition (ported from @graphlearning/flow's study): a four-column row
// inside a framed runtime, a repeated unit three levels deep (worker → executor → task chips),
// a counted-token leaf (chips), an edge running AGAINST the flow (executor → task scheduling), and a
// second row of two bands fed by edges that leave the runtime from inside it.

const item = (id: string, icon: string, title: string, sub?: string): Item => ({ type: 'item', id, icon, title, sub })
const chip = (id: string, title: string, icon?: string): Item => ({ type: 'item', id, title, icon, chip: true })
const tile = (id: string, icon: string, title: string): Item => ({ type: 'item', id, icon, title, stack: true })

const workerNode = (n: number): Group => ({
  type: 'group', id: `w${n}`, title: `Worker node ${n}`, icon: 'server', tone: 'store',
  sub: 'tasks process partitions; executors exchange shuffle data',
  children: [{
    type: 'group', id: `w${n}-exec`, title: 'Executor · JVM process', icon: 'cpu', dir: 'grid', cols: 4,
    children: [
      chip(`w${n}-t1`, 'Task 1'), chip(`w${n}-t2`, 'Task 2'), chip(`w${n}-t3`, 'Task 3'), chip(`w${n}-t4`, 'Task 4'),
      chip(`w${n}-cache`, 'Cache / memory', 'memory'), chip(`w${n}-disk`, 'Local disk', 'disk'),
    ],
  }],
})

export const sparkTopology: SceneModel = {
  title: 'Study — Apache Spark runtime topology',
  sub: 'Apache Spark runtime topology at architecture scale.',
  dir: 'row',
  nodes: [
    { type: 'group', id: 'runtime', title: 'The Spark runtime', sub: 'one application, four moving parts', span: 'all', dir: 'row', children: [
      { type: 'group', id: 'sources', badge: 1, spread: true, title: 'Data sources', sub: 'data lives outside the application', tone: 'store', children: [
        item('src-files', 'database', 'Files & tables', 'Parquet, object storage, HDFS'),
        item('src-jdbc', 'table', 'Relational sources', 'JDBC readers for external databases'),
        item('src-stream', 'waves', 'Event streams', 'Kafka and other supported sources'),
      ] },
      { type: 'group', id: 'driver', badge: 2, spread: true, title: 'Driver · control plane', sub: 'one driver per application', tone: 'ingest', children: [
        item('drv-session', 'code', 'SparkSession', 'your application enters Spark here'),
        item('drv-plan', 'brain', 'Planning & scheduling', 'builds and optimises the execution plan'),
        item('drv-tasks', 'workflow', 'Task scheduling', 'stages, task assignment and progress'),
      ] },
      { type: 'group', id: 'workers', badge: 3, title: 'Worker nodes', sub: 'each executor runs tasks in its own JVM', tone: 'infra', children: [workerNode(1), workerNode(2)] },
      { type: 'group', id: 'cluster', badge: 4, spread: true, title: 'Cluster resources', sub: 'resource allocation is separate from task scheduling', tone: 'serve', children: [
        item('cm-standalone', 'server', 'Standalone', "Spark's own cluster resource manager"),
        item('cm-yarn', 'network', 'YARN', 'Hadoop resource management'),
        item('cm-k8s', 'boxes', 'Kubernetes', 'pod-based driver and executor deployment'),
      ] },
    ] },
    { type: 'group', id: 'storage-band', title: 'Storage · read & write', icon: 'database', sub: 'inputs, outputs and durable tables', tone: 'store', dir: 'row', children: [
      tile('st-hdfs', 'disk', 'HDFS'), tile('st-s3', 's3', 'Amazon S3'), tile('st-adls', 'adls', 'Azure data lake'), tile('st-formats', 'layers', 'Table formats'),
    ] },
    { type: 'group', id: 'outputs', title: 'Outputs & consumers', icon: 'users', sub: 'keep large results distributed', tone: 'serve', dir: 'row', children: [
      tile('out-tables', 'table', 'Tables / files'), tile('out-analytics', 'pie', 'Analytics'), tile('out-apps', 'code', 'Applications'),
    ] },
  ],
  edges: [
    { from: 'sources', to: 'driver' },
    { from: 'driver', to: 'workers', label: 'tasks' },
    { from: 'workers', to: 'cluster', label: 'resources' },
    { from: 'w1-exec', to: 'drv-tasks', dashed: true },
    { from: 'driver', to: 'storage-band', label: 'read source partitions' },
    { from: 'workers', to: 'storage-band', label: 'read / write', bidirectional: true },
    { from: 'workers', to: 'outputs', label: 'results' },
  ],
}
