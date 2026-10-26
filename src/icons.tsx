import type { ComponentType, ReactElement } from 'react'
import {
  Activity, Bell, Box, Building2, ChartColumn, ChartPie, ClipboardCheck, Clock, Cloud, Code2, Cpu,
  CreditCard, Database, Factory, FileText, Filter, Fingerprint, Folder, GitBranch, Globe, HardDrive,
  KeyRound, Layers, Lock, Monitor, Network, Package, RadioTower, Search, Server, Settings, ShieldCheck,
  Table2, Terminal, User, UserCog, Users, Workflow, Zap, Waves, Brain, Boxes, MemoryStick, type LucideIcon,
} from 'lucide-react'
import {
  AnalysisServices, AzureCosmosDBDatabases, AzureDatabricks, AzureDevOps, AzurePurviewAccounts, AzureServiceBus,
  AzureSQL, AzureSynapseAnalyticsAnalytics, DataFactoriesAnalytics, DataLakeStorageGen1, EventHubsAnalytics,
  FunctionAppsCompute, KeyVaults, KubernetesServicesCompute, LogAnalyticsWorkspacesManagementGovernance,
  MicrosoftDefenderForCloud, MonitorMonitor, PowerBIEmbedded, StorageAccounts, StreamAnalyticsJobsAnalytics,
  VirtualMachine,
} from '@threeveloper/azure-react-icons'
import S3 from 'aws-react-icons/icons/ArchitectureServiceAmazonSimpleStorageService'
import Glue from 'aws-react-icons/icons/ArchitectureServiceAWSGlue'
import Redshift from 'aws-react-icons/icons/ArchitectureServiceAmazonRedshift'
import Athena from 'aws-react-icons/icons/ArchitectureServiceAmazonAthena'
import Kinesis from 'aws-react-icons/icons/ArchitectureServiceAmazonKinesis'
import Firehose from 'aws-react-icons/icons/ArchitectureServiceAmazonDataFirehose'
import EMR from 'aws-react-icons/icons/ArchitectureServiceAmazonEMR'
import Lambda from 'aws-react-icons/icons/ArchitectureServiceAWSLambda'
import DynamoDB from 'aws-react-icons/icons/ArchitectureServiceAmazonDynamoDB'
import RDS from 'aws-react-icons/icons/ArchitectureServiceAmazonRDS'
import Aurora from 'aws-react-icons/icons/ArchitectureServiceAmazonAurora'
import CloudWatch from 'aws-react-icons/icons/ArchitectureServiceAmazonCloudWatch'
import IAM from 'aws-react-icons/icons/ArchitectureServiceAWSIdentityandAccessManagement'
import MSK from 'aws-react-icons/icons/ArchitectureServiceAmazonManagedStreamingforApacheKafka'
import LakeFormation from 'aws-react-icons/icons/ArchitectureServiceAWSLakeFormation'
import EC2 from 'aws-react-icons/icons/ArchitectureServiceAmazonEC2'
import SQS from 'aws-react-icons/icons/ArchitectureServiceAmazonSimpleQueueService'
import SNS from 'aws-react-icons/icons/ArchitectureServiceAmazonSimpleNotificationService'
import StepFunctions from 'aws-react-icons/icons/ArchitectureServiceAWSStepFunctions'
import EventBridge from 'aws-react-icons/icons/ArchitectureServiceAmazonEventBridge'
import KMS from 'aws-react-icons/icons/ArchitectureServiceAWSKeyManagementService'
import SecretsManager from 'aws-react-icons/icons/ArchitectureServiceAWSSecretsManager'
import EKS from 'aws-react-icons/icons/ArchitectureServiceAmazonElasticKubernetesService'
import SageMaker from 'aws-react-icons/icons/ArchitectureServiceAmazonSageMaker'
import APIGateway from 'aws-react-icons/icons/ArchitectureServiceAmazonAPIGateway'
import VPC from 'aws-react-icons/icons/ArchitectureServiceAmazonVirtualPrivateCloud'
import CloudFormation from 'aws-react-icons/icons/ArchitectureServiceAWSCloudFormation'
import MWAA from 'aws-react-icons/icons/ArchitectureServiceAmazonManagedWorkflowsforApacheAirflow'
import DMS from 'aws-react-icons/icons/ArchitectureServiceAWSDatabaseMigrationService'
import ElastiCache from 'aws-react-icons/icons/ArchitectureServiceAmazonElastiCache'
import {
  siApacheairflow, siApacheflink, siApachekafka, siApachespark, siDocker, siDuckdb, siGit, siGithub, siGithubactions,
  siGrafana, siJupyter, siKubernetes, siMongodb, siPandas, siPostgresql, siPrometheus, siPython, siSnowflake, siTerraform,
} from 'simple-icons'

// Four sets, ONE key space. Every icon is a NAMED (or per-file) import, so the bundle carries only
// these; add a key when a scene needs it. Keys match @graphlearning/flow's where both exist, so a
// scene ports without renaming. A key may appear in ONE set only — `ICONS` throws on a duplicate.

/** Generic glyphs, drawn in the node's tone accent. */
export const LUCIDE: Record<string, LucideIcon> = {
  activity: Activity, bell: Bell, box: Box, building: Building2, chart: ChartColumn, pie: ChartPie,
  check: ClipboardCheck, clock: Clock, cloud: Cloud, code: Code2, cpu: Cpu, card: CreditCard,
  database: Database, factory: Factory, file: FileText, filter: Filter, fingerprint: Fingerprint,
  folder: Folder, branch: GitBranch, globe: Globe, disk: HardDrive, key: KeyRound, layers: Layers,
  lock: Lock, screen: Monitor, network: Network, package: Package, stream: RadioTower, search: Search,
  server: Server, settings: Settings, shield: ShieldCheck, table: Table2, terminal: Terminal,
  user: User, admin: UserCog, users: Users, workflow: Workflow, zap: Zap, waves: Waves, brain: Brain,
  boxes: Boxes, memory: MemoryStick,
}

/** Azure service tiles, in their own colours. The package ships no viewBox; 0 0 18 18 fits all. */
export const AZURE: Record<string, ComponentType<{ size?: string; viewBox?: string }>> = {
  datafactory: DataFactoriesAnalytics, eventhubs: EventHubsAnalytics, adls: DataLakeStorageGen1, storage: StorageAccounts,
  databricks: AzureDatabricks, synapse: AzureSynapseAnalyticsAnalytics, analysisservices: AnalysisServices,
  purview: AzurePurviewAccounts, keyvault: KeyVaults, defender: MicrosoftDefenderForCloud, monitor: MonitorMonitor,
  loganalytics: LogAnalyticsWorkspacesManagementGovernance, devops: AzureDevOps, powerbi: PowerBIEmbedded,
  azuresql: AzureSQL, cosmos: AzureCosmosDBDatabases, functions: FunctionAppsCompute, aks: KubernetesServicesCompute,
  streamanalytics: StreamAnalyticsJobsAnalytics, servicebus: AzureServiceBus, vm: VirtualMachine,
}

/** AWS architecture icons, in their own colours on their own rounded tile. */
export const AWS: Record<string, ComponentType<{ size?: number }>> = {
  s3: S3, glue: Glue, redshift: Redshift, athena: Athena, kinesis: Kinesis, firehose: Firehose, emr: EMR,
  lambda: Lambda, dynamodb: DynamoDB, rds: RDS, aurora: Aurora, cloudwatch: CloudWatch, iam: IAM, msk: MSK,
  lakeformation: LakeFormation, ec2: EC2, sqs: SQS, sns: SNS, stepfunctions: StepFunctions, eventbridge: EventBridge,
  kms: KMS, secretsmanager: SecretsManager, eks: EKS, sagemaker: SageMaker, apigateway: APIGateway, vpc: VPC,
  cloudformation: CloudFormation, mwaa: MWAA, dms: DMS, elasticache: ElastiCache,
}

/** Open-source / product marks (simple-icons), in the brand's colour unless it would vanish. */
export const BRAND: Record<string, { title: string; hex: string; path: string }> = {
  kafka: siApachekafka, spark: siApachespark, airflow: siApacheairflow, flink: siApacheflink, snowflakedb: siSnowflake,
  python: siPython, pandas: siPandas, jupyter: siJupyter, duckdb: siDuckdb, postgresql: siPostgresql, mongodb: siMongodb,
  docker: siDocker, kubernetes: siKubernetes, terraform: siTerraform, git: siGit, github: siGithub,
  githubactions: siGithubactions, grafana: siGrafana, prometheus: siPrometheus,
}

type Draw = (size: number, surface: string, ink: string) => ReactElement

function merge(...sets: Record<string, Draw>[]): Record<string, Draw> {
  const out: Record<string, Draw> = {}
  for (const set of sets)
    for (const [k, v] of Object.entries(set)) {
      if (k in out) throw new Error(`graphl-flow: icon key "${k}" is defined in two icon sets`)
      out[k] = v
    }
  return out
}

const map = <T,>(set: Record<string, T>, draw: (v: T) => Draw) => Object.fromEntries(Object.entries(set).map(([k, v]) => [k, draw(v)]))

const luminance = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

/** A brand mark under this contrast against the surface draws in ink (Kafka's black on dark). */
export const BRAND_MIN_CONTRAST = 2.2

function brandFill(hex: string, surface: string, ink: string) {
  const a = luminance(`#${hex}`), b = luminance(surface)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < BRAND_MIN_CONTRAST ? ink : `#${hex}`
}

export const ICONS: Record<string, Draw> = merge(
  map(LUCIDE, (Icon) => (size) => <Icon className="gf-icon" size={size} strokeWidth={1.75} aria-hidden />),
  map(AZURE, (Icon) => (size) => <span className="gf-icon gf-vendor"><Icon size={String(size)} viewBox="0 0 18 18" /></span>),
  map(AWS, (Icon) => (size) => <span className="gf-icon gf-vendor gf-aws"><Icon size={size} /></span>),
  map(BRAND, (b) => (size, surface, ink) => (
    <svg className="gf-icon" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={b.title}>
      <path d={b.path} fill={brandFill(b.hex, surface, ink)} />
    </svg>
  )),
)
