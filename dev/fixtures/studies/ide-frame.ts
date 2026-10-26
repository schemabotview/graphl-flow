import type { Code, SceneModel, Tree } from '../../../src'

// Varies the FRAME: explorer | (editor over terminal). Three panes across make a ~3.6:1 strip that a
// 16:9 frame letterboxes; docking the terminal under the editor is ~16:9 by itself. The panes carry
// minW/minH FLOORS so that two frames with different code have identical boxes — and therefore the
// identical fit: `check` asserts ide-frame and ide-frame-short land on the same transform.

const explorer = (active: string): Tree => ({ type: 'tree', id: 'explorer', fill: true, minW: 280, entries: [
  { name: 'lakehouse', children: [
    { name: 'jobs', children: [
      { name: 'orders_job.py', state: active === 'orders_job.py' ? 'active' : undefined },
      { name: 'customers_job.py', state: active === 'customers_job.py' ? 'active' : 'new', note: active === 'customers_job.py' ? undefined : 'U' },
    ] },
    { name: 'tests', children: [{ name: 'test_counts.py' }] },
    { name: 'conf', children: [{ name: 'spark-defaults.conf', state: 'muted' }] },
    { name: 'README.md', state: 'muted' },
  ] },
] })

const editor = (filename: string, code: string, highlight: number[]): Code =>
  ({ type: 'code', id: 'editor', filename, lang: 'python', code, highlight, fill: true, minW: 1150, minH: 560 })

const terminal = (code: string): Code => ({ type: 'code', id: 'terminal', terminal: true, filename: 'terminal', code, fill: true, minH: 210 })

const frame = (pane: Tree, ed: Code, term: Code): SceneModel => ({
  dir: 'row',
  nodes: [pane, { type: 'group', id: 'main', bare: true, children: [ed, term] }],
})

export const ideFrame = frame(explorer('orders_job.py'), editor('orders_job.py', `
  from pyspark.sql import SparkSession, functions as F

  spark = SparkSession.builder.appName("orders").getOrCreate()

  raw = spark.read.json("s3://lake/bronze/orders/")

  orders = (
      raw.dropDuplicates(["order_id"])
         .withColumn("amount", F.col("amount").cast("decimal(10,2)"))
         .withColumn("email", F.sha2("email", 256))
  )

  daily = orders.groupBy("customer_id", F.to_date("ts").alias("day")).agg(F.sum("amount"))
  daily.write.format("delta").mode("overwrite").save("s3://lake/gold/daily/")
`, [8, 9]), terminal(`
  $ spark-submit jobs/orders_job.py
  INFO DAGScheduler: Job 0 finished: save at orders_job.py:15, took 41.2 s
  $ pytest tests/test_counts.py -q
  1 passed in 3.07s
`))

export const ideFrameShort = frame(explorer('customers_job.py'), editor('customers_job.py', `
  from pyspark.sql import functions as F

  customers = spark.read.table("silver.customers")
  active = customers.where(F.col("last_order") > F.date_sub(F.current_date(), 90))
  active.write.saveAsTable("gold.active_customers")
`, [4]), terminal(`
  $ spark-submit jobs/customers_job.py
`))
