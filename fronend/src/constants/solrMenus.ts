// solrMenus.ts
// Centralized menu structure for SolrLens sidebar, supporting multi-level menus and per-datacenter customization.

import {
  BarChart3,
  FileText,
  Shield,
  Cloud,
  Server,
  TreeDeciduous,
  Zap,
  LineChart,
  Settings,
  Activity,
  Layers,
  ListChecks,
  Folder,
  BookOpen,
  Search,
  Database,
  FileCog,
  FileSignature,
  Plug,
  Info,
  File,
  FileStack,
  FileText as FileTextIcon
} from "lucide-react"

export interface SolrMenuItem {
  title: string
  icon?: any
  path: string
  children?: SolrMenuItem[]
}

export const datacenterMenuItems: SolrMenuItem[] = [
  {
    title: "Overview",
    icon: BarChart3,
    path: "/overview"
  },
  {
    title: "Logging",
    icon: FileText,
    path: "/logging",
    children: [
      {
        title: "Level",
        icon: FileTextIcon,
        path: "/logging-level"
      }
    ]
  },
  {
    title: "Security",
    icon: Shield,
    path: "/security"
  },
  {
    title: "Cloud",
    icon: Cloud,
    path: "/cloud",
    children: [
      {
        title: "Nodes",
        icon: Server,
        path: "/nodes"
      },
      {
        title: "Tree",
        icon: TreeDeciduous,
        path: "/tree"
      },
      {
        title: "ZK Status",
        icon: Zap,
        path: "/zk-status"
      },
      {
        title: "Graph",
        icon: LineChart,
        path: "/cloud-graph"
      }
    ]
  },
  {
    title: "Schema Designer",
    icon: Layers,
    path: "/schema-designer"
  },
  {
    title: "Java Properties",
    icon: Settings,
    path: "/java-properties"
  },
  {
    title: "Thread Dump",
    icon: Activity,
    path: "/thread-dump"
  }
];

export const collectionMenuItems: SolrMenuItem[] = [
  { title: "Overview", icon: BarChart3, path: "/overview" },
  { title: "Analysis", icon: Search, path: "/analysis" },
  { title: "Documents", icon: FileText, path: "/documents" },
  { title: "Paramsets", icon: FileCog, path: "/paramsets" },
  { title: "Files", icon: Folder, path: "/files" },
  { title: "Query", icon: Search, path: "/query" },
  { title: "Stream", icon: Database, path: "/stream" },
  { title: "SQL", icon: FileSignature, path: "/sql" },
  { title: "Schema", icon: BookOpen, path: "/schema" }
];

export const coreMenuItems: SolrMenuItem[] = [
  { title: "Overview", icon: BarChart3, path: "/overview" },
  { title: "Analysis", icon: Search, path: "/analysis" },
  { title: "Documents", icon: FileText, path: "/documents" },
  { title: "Paramsets", icon: FileCog, path: "/paramsets" },
  { title: "Files", icon: Folder, path: "/files" },
  { title: "Ping", icon: Info, path: "/ping" },
  { title: "Plugins / Stats", icon: Plug, path: "/plugins" },
  { title: "Query", icon: Search, path: "/query" },
  { title: "Replication", icon: FileStack, path: "/replication" },
  { title: "Schema", icon: BookOpen, path: "/schema" },
  { title: "Segments info", icon: File, path: "/segments-info" }
];
