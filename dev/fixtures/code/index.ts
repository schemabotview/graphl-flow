import type { SceneModel } from '../../../src'

const PIPELINE = `
  from pyspark.sql import SparkSession, functions as F

  spark = SparkSession.builder.appName("orders").getOrCreate()

  # Bronze: land the raw files as-is
  raw = spark.read.json("s3://lake/bronze/orders/")

  # Silver: typed, deduplicated, PII masked
  orders = (
      raw.dropDuplicates(["order_id"])
         .withColumn("amount", F.col("amount").cast("decimal(10,2)"))
         .withColumn("email", F.sha2("email", 256))
  )

  # Gold: one row per customer per day
  daily = orders.groupBy("customer_id", F.to_date("ts").alias("day")).agg(F.sum("amount"))
  daily.write.format("delta").mode("overwrite").save("s3://lake/gold/daily/")
`

export const CODE_FIXTURES: Record<string, SceneModel> = {
  'code-basic': {
    title: 'A file: tab, line numbers, highlighting',
    nodes: [{ type: 'code', id: 'job', filename: 'orders_job.py', lang: 'python', code: PIPELINE }],
  },
  'code-highlight': {
    title: 'show + highlight: the FILE’s line numbers, skipped runs folded',
    dir: 'row',
    nodes: [
      { type: 'code', id: 'sql', filename: 'daily_revenue.sql', lang: 'sql', tone: 'store', highlight: [4, 5], code: `
        -- one row per customer per day
        SELECT customer_id,
               date_trunc('day', ts) AS day,
               SUM(amount)          AS revenue,
               COUNT(*)             AS orders
        FROM silver.orders
        WHERE status = 'paid'
        GROUP BY 1, 2
        ORDER BY revenue DESC
        LIMIT 100;
      ` },
      { type: 'code', id: 'excerpt', filename: 'orders_job.py', lang: 'python', tone: 'ingest', show: [[1, 1], [8, 13], [15, 17]], highlight: [10, 11], code: PIPELINE },
    ],
  },
  'code-terminal': {
    title: 'terminal: commands, output, an error',
    nodes: [{ type: 'code', id: 'term', terminal: true, filename: 'zsh — lakehouse', code: `
      $ spark-submit --master yarn orders_job.py
      24/10/26 10:41:07 INFO SparkContext: Running Spark version 3.5.1
      24/10/26 10:41:12 INFO DAGScheduler: Job 0 finished: save at orders_job.py:17
      $ aws s3 ls s3://lake/gold/daily/ | wc -l
      366
      $ python check_counts.py
      ! AssertionError: gold rows (366) != silver days (365)
    ` }],
  },
  'code-to-diagram': {
    title: 'Edges from code LINES into a diagram',
    dir: 'row',
    nodes: [
      { type: 'code', id: 'src', filename: 'orders_job.py', lang: 'python', show: [[6, 6], [9, 13], [16, 17]], code: PIPELINE },
      { type: 'group', id: 'lake', title: 'Lakehouse', tone: 'store', children: [
        { type: 'item', id: 'bronze', icon: 'database', title: 'Bronze', sub: 'raw JSON' },
        { type: 'item', id: 'silver', icon: 'database', title: 'Silver', sub: 'typed, deduped' },
        { type: 'item', id: 'gold', icon: 'database', title: 'Gold', sub: 'daily aggregates' },
      ] },
    ],
    edges: [
      { from: 'src.L6', to: 'bronze', label: 'read' },
      { from: 'src.L10', to: 'silver' },
      { from: 'src.L17', to: 'gold', label: 'write' },
    ],
  },
}
