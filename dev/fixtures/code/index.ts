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
  // A terminal folds too (0.6): `show` keeps the commands and the lines that matter.
  'code-terminal-fold': {
    title: 'terminal + show: a long plan, folded to what matters',
    nodes: [{ type: 'code', id: 'plan', terminal: true, filename: 'terminal — book-shop', show: [[1, 2], [8, 8], [14, 14], [16, 17], [19, 19]], code: `
      $ cd infra
      $ terraform plan -out=tfplan

      Terraform used the selected providers to generate the following execution
      plan. Resource actions are indicated with the following symbols:
        + create

        # aws_s3_bucket.catalog will be created
        + resource "aws_s3_bucket" "catalog" {
            + acceleration_status = (known after apply)
            + arn                 = (known after apply)
            + bucket              = "book-shop-catalog-444455556666"
          }
      Plan: 1 to add, 0 to change, 0 to destroy.

      $ terraform apply tfplan
      aws_s3_bucket.catalog: Creating...
      aws_s3_bucket.catalog: Creation complete after 1s
      Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
    ` }],
  },
  // HCL (0.6): Terraform's block types and meta-arguments draw as keywords in hcl ONLY.
  'code-hcl': {
    title: 'hcl: a Terraform file — blocks, meta-arguments, references',
    nodes: [{ type: 'code', id: 'tf', filename: 'infra/s3.tf', lang: 'hcl', highlight: [2, 3], code: `
      # The catalog: every book page's JSON lives here.
      resource "aws_s3_bucket" "catalog" {
        bucket = "book-shop-catalog-\${data.aws_caller_identity.me.account_id}"
      }

      resource "aws_s3_bucket_versioning" "catalog" {
        bucket = aws_s3_bucket.catalog.id
        versioning_configuration {
          status = "Enabled"
        }
      }

      output "catalog_bucket" {
        value = aws_s3_bucket.catalog.bucket
      }
    ` }],
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
  // Java: the primitive types, `record`, `switch`, `final` and `@Test` all draw as keywords (0.5),
  // and the Maven / Java / JUnit marks name the files in the explorer.
  'code-java': {
    title: 'Java: records, a switch expression, a JUnit test — and a Maven project',
    dir: 'row',
    nodes: [
      { type: 'tree', id: 'proj', title: 'orders', entries: [
        { name: 'pom.xml', icon: 'maven' },
        { name: 'src/main/java', children: [{ name: 'Order.java', state: 'active' }] },
        { name: 'src/test/java', children: [{ name: 'OrderTest.java', icon: 'junit' }] },
        { name: 'target', folder: true, state: 'muted' },
      ] },
      { type: 'code', id: 'order', filename: 'Order.java', lang: 'java', tone: 'store', code: `
        package com.example.orders;

        // A record is a final, immutable carrier — no getters to write.
        public record Order(long id, String sku, int qty, double price) {

            static final double VAT = 0.2;

            enum Kind { RETAIL, WHOLESALE, INTERNAL }

            double total(Kind kind) {
                final double net = qty * price;
                return switch (kind) {
                    case RETAIL -> net * (1 + VAT);
                    case WHOLESALE -> net * 0.9;
                    case INTERNAL -> 0.0;
                };
            }
        }
      ` },
      { type: 'code', id: 'test', filename: 'OrderTest.java', lang: 'java', tone: 'ingest', code: `
        package com.example.orders;

        import static org.junit.jupiter.api.Assertions.assertEquals;
        import org.junit.jupiter.api.Test;

        class OrderTest {

            @Test
            void retailAddsVat() {
                var order = new Order(1_000L, "ETH-250", 2, 9.95);
                assertEquals(23.88, order.total(Kind.RETAIL), 0.01);
            }
        }
      ` },
    ],
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
