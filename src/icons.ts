import {
  Activity, Bell, Box, Building2, ChartColumn, ChartPie, ClipboardCheck, Clock, Cloud, Code2, Cpu,
  CreditCard, Database, Factory, FileText, Filter, Fingerprint, Folder, GitBranch, Globe, HardDrive,
  KeyRound, Layers, Lock, Monitor, Network, Package, RadioTower, Search, Server, Settings, ShieldCheck,
  Table2, Terminal, User, UserCog, Users, Workflow, Zap, type LucideIcon,
} from 'lucide-react'

// Curated by NAMED import so the bundle carries only these. Add a key when a fixture needs it.
export const ICONS: Record<string, LucideIcon> = {
  activity: Activity, bell: Bell, box: Box, building: Building2, chart: ChartColumn, pie: ChartPie,
  check: ClipboardCheck, clock: Clock, cloud: Cloud, code: Code2, cpu: Cpu, card: CreditCard,
  database: Database, factory: Factory, file: FileText, filter: Filter, fingerprint: Fingerprint,
  folder: Folder, git: GitBranch, globe: Globe, disk: HardDrive, key: KeyRound, layers: Layers,
  lock: Lock, monitor: Monitor, network: Network, package: Package, stream: RadioTower, search: Search,
  server: Server, settings: Settings, shield: ShieldCheck, table: Table2, terminal: Terminal,
  user: User, admin: UserCog, users: Users, workflow: Workflow, zap: Zap,
}
