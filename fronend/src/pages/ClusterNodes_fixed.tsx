import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { 
  RefreshCw, 
  Server, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu,
  Network,
  Zap,
  Eye,
  MapPin,
  ArrowRight,
  MemoryStick,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolrNodeInfo {
  id: string
  name: string
  url: string
  datacenter: string
  status: 'online' | 'offline' | 'error'
  systemInfo?: any
  metrics?: any
  error?: string
}

interface ZooKeeperHost {
  hostname: string
  port: number
  status: 'connected' | 'disconnected' | 'unknown'
  role?: string
  serverId?: string
  version?: string
  connections?: number
  latency?: number
  clientPort?: number
}

interface ZooKeeperDatacenterInfo {
  datacenter: string
  zkHosts: ZooKeeperHost[]
  totalZkNodes: number
  connectedNodes: number
  mode: string
  ensembleSize: number
  status: 'green' | 'yellow' | 'red' | 'unknown' | 'unreachable'
  dynamicReconfig: boolean
  zkConnectionString: string
  errors: string[]
  connectedNode?: string
  retrievedFrom?: string
  rawData?: any
}

interface ZooKeeperInfo {
  datacenters: Record<string, ZooKeeperDatacenterInfo>
  summary: {
    totalZkNodes: number
    totalConnectedNodes: number
    totalDatacenters: number
    overallStatus: 'green' | 'yellow' | 'red'
    mode: string
  }
}

interface ClusterResponse {
  nodes: SolrNodeInfo[]
  datacenters: string[]
  loadedDefaults?: boolean
}

export function ClusterNodesContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedDatacenter = searchParams.get('datacenter') || 'all'
  const [nodes, setNodes] = useState<SolrNodeInfo[]>([])
  const [datacenters, setDatacenters] = useState<string[]>([])
  const [zkInfo, setZkInfo] = useState<ZooKeeperInfo | null>(null)
  const [zkExpanded, setZkExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedDefaults, setLoadedDefaults] = useState(true) // Track if only defaults are loaded
  const { toast } = useToast()

  const fetchClusterData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching cluster data...', { selectedDatacenter }) // Debug log
      
      const [nodesResponse, zkResponse] = await Promise.allSettled([
        fetch(`http://localhost:3001/api/solr/cluster/nodes${selectedDatacenter !== 'all' ? `?datacenter=${selectedDatacenter}` : ''}`),
        fetch(`http://localhost:3001/api/solr/cluster/zookeeper${selectedDatacenter !== 'all' ? `?datacenter=${selectedDatacenter}` : ''}`)
      ])

      console.log('Nodes response:', nodesResponse) // Debug log
      console.log('ZK response:', zkResponse) // Debug log

      if (nodesResponse.status === 'fulfilled' && nodesResponse.value.ok) {
        const clusterData: ClusterResponse = await nodesResponse.value.json()
        console.log('Cluster data:', clusterData) // Debug log
        setNodes(clusterData.nodes)
        setDatacenters(clusterData.datacenters)
        setLoadedDefaults(clusterData.loadedDefaults ?? true)
      } else {
        console.error('Failed to fetch nodes:', nodesResponse)
        setError('Failed to fetch cluster nodes')
      }

      if (zkResponse.status === 'fulfilled' && zkResponse.value.ok) {
        const zkData: ZooKeeperInfo = await zkResponse.value.json()
        console.log('ZK data:', zkData) // Debug log
        setZkInfo(zkData)
      } else {
        console.error('Failed to fetch ZK info:', zkResponse)
      }

      setLastRefresh(new Date())
      
      toast({
        title: "Cluster information updated",
        description: "Latest cluster metrics have been fetched successfully.",
      })
    } catch (error) {
      console.error('Error fetching cluster data:', error)
      setError('Failed to fetch cluster information')
      toast({
        title: "Failed to fetch cluster information",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClusterData()
  }, [selectedDatacenter])

  console.log('Render state:', { nodes, datacenters, loading, error }) // Debug log

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Cluster Dashboard</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Cluster Dashboard</h2>
            <p className="text-muted-foreground">Error occurred</p>
          </div>
          <Button onClick={() => fetchClusterData()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Cluster Dashboard
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>{nodes.length} Node{nodes.length !== 1 ? 's' : ''}</span>
            </div>
            {selectedDatacenter !== 'all' && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <Badge variant="outline" className="text-xs">
                  {selectedDatacenter}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => fetchClusterData()} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ZooKeeper Information - Expandable */}
      {zkInfo && Object.entries(zkInfo.datacenters)
        .filter(([dcName]) => selectedDatacenter === 'all' || dcName === selectedDatacenter)
        .map(([dcName, dcZkInfo]) => (
        <Card key={dcName} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <Collapsible open={zkExpanded} onOpenChange={setZkExpanded}>
            <CardHeader className="pb-8 relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                        <Database className="w-8 h-8 text-white" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${
                        dcZkInfo.status === 'green' ? 'bg-green-500' : 
                        dcZkInfo.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                          ZooKeeper Ensemble
                        </CardTitle>
                        <CardDescription className="text-base text-gray-600 dark:text-gray-300 font-medium">
                          {dcName} Datacenter • {dcZkInfo.ensembleSize} Node Cluster
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Compact Metrics Row */}
                    <div className="flex items-center gap-2">
                      <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3 h-3 text-blue-600" />
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{dcZkInfo.ensembleSize}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Ensemble</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">{dcZkInfo.mode}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Mode</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                        <div className="flex items-center gap-1.5">
                          <Network className="w-3 h-3 text-purple-600" />
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{dcZkInfo.connectedNodes}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Connected</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                        <div className="flex items-center gap-1.5">
                          <Zap className={`w-3 h-3 ${dcZkInfo.dynamicReconfig ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {dcZkInfo.dynamicReconfig ? 'ON' : 'OFF'}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Reconfig</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`text-sm font-semibold px-4 py-2 shadow-md border-0 ${
                          dcZkInfo.status === 'green' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                            : dcZkInfo.status === 'yellow' 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                        }`}
                      >
                        {dcZkInfo.status.toUpperCase()}
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className={`rounded-xl font-medium cursor-pointer hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-300 ${
                            dcZkInfo.status === 'green'
                              ? 'text-green-700 hover:text-green-900 hover:bg-green-50 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/20'
                              : dcZkInfo.status === 'yellow'
                              ? 'text-orange-700 hover:text-orange-900 hover:bg-orange-50 dark:text-orange-300 dark:hover:text-orange-100 dark:hover:bg-orange-900/20'
                              : 'text-red-700 hover:text-red-900 hover:bg-red-50 dark:text-red-300 dark:hover:text-red-100 dark:hover:bg-red-900/20'
                          }`}
                        >
                          {zkExpanded ? (
                            <>
                              <ChevronDown className="w-5 h-5 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-5 h-5 mr-2" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  {/* Node Status Overview */}
                                  {/* Node Status Overview */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Node Status Overview</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dcZkInfo.zkHosts.map((host, index) => (
                      <div key={index} className="bg-white/80 dark:bg-black/40 rounded-xl p-4 backdrop-blur-sm border border-white/30 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              host.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                            }`} title={host.status === 'connected' ? 'Connected' : 'Disconnected'}></div>
                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                              {host.hostname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {host.role && (
                              <Badge 
                                variant={host.role === 'leader' ? 'default' : 'secondary'} 
                                className={`text-xs font-medium ${
                                  host.role === 'leader' 
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md border-0' 
                                    : host.role === 'follower'
                                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md border-0'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md border-0'
                                }`}
                                title={host.role === 'leader' ? 'Leader' : host.role === 'follower' ? 'Follower' : 'Unknown'}
                              >
                                {host.role.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {host.version && (
                            <Badge 
                              variant="outline" 
                              className="text-sm font-mono bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              title={`Version: ${host.version}`}
                            >
                              V: {host.version.length > 5 ? `${host.version.substring(0, 5)}` : host.version}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className="text-sm font-mono bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            title="Port"
                          >
                            P: {host.port}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  
                  {/* Connection String */}
                  <div className="w-80">
                    <div className="flex items-center gap-2 mb-3">
                      <Network className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Connection String</span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 overflow-hidden relative group">
                        <code className="text-sm font-mono text-green-400 break-all block pr-8">
                          {dcZkInfo.zkConnectionString}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(dcZkInfo.zkConnectionString)
                            toast({
                              title: "Connection string copied",
                              description: "ZooKeeper connection string has been copied to clipboard.",
                            })
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Copy connection string"
                        >
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="pt-0 pb-8 bg-white/30 dark:bg-black/10">
                {/* Connection String */}
                <div className="mb-6 bg-white/50 dark:bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Connection String</span>
                  </div>
                  <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 overflow-hidden relative group">
                    <code className="text-sm font-mono text-green-400 break-all block pr-8">
                      {dcZkInfo.zkConnectionString}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(dcZkInfo.zkConnectionString)
                        toast({
                          title: "Connection string copied",
                          description: "ZooKeeper connection string has been copied to clipboard.",
                        })
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Copy connection string"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Detailed Metrics Table */}
                <div className="bg-white/80 dark:bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configuration Details</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 rounded-l-lg">
                            Metric
                          </th>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <th key={index} className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{host.hostname}</span>
                                <span className="text-xs text-gray-500">:{host.port}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Main Metrics Section */}
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                          <td className="py-2 px-4 font-bold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <div className="flex items-center gap-2">
                              <Server className="w-3 h-3" />
                              Core Status
                            </div>
                          </td>
                        </tr>

                        {/* OK Status */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              OK
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.ok !== undefined ? 
                                (dcZkInfo.rawData[index].ok ? 'true' : 'false') : 
                                (host.status === 'connected' ? 'true' : 'false')
                              }
                            </td>
                          ))}
                        </tr>

                        {/* Client Port */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-blue-500" />
                              Client Port
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.clientPort || host.clientPort || host.port || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Secure Client Port */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-purple-500" />
                              Secure Client Port
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.secureClientPort || '-'}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Server State */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-orange-500" />
                              Server State
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4">
                              {(dcZkInfo.rawData?.[index]?.zk_server_state || host.role) ? (
                                <Badge 
                                  variant="default"
                                  className={`text-xs font-medium ${
                                    (dcZkInfo.rawData?.[index]?.zk_server_state || host.role) === 'leader' 
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold' 
                                      : (dcZkInfo.rawData?.[index]?.zk_server_state || host.role) === 'follower'
                                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
                                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                  }`}
                                >
                                  {(dcZkInfo.rawData?.[index]?.zk_server_state || host.role)?.toUpperCase()}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Version */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-indigo-500" />
                              ZK Version
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_version || host.version || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Data Size */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-cyan-500" />
                              Approx Data Size
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_approximate_data_size ? 
                                `${(dcZkInfo.rawData[index].zk_approximate_data_size / 1024).toFixed(1)}KB` : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* ZNode Count */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" />
                              ZNode Count
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_znode_count || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Active Connections */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-green-500" />
                              Active Connections
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_num_alive_connections || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Ensemble Specific Metrics */}
                        {dcZkInfo.mode === 'ensemble' && (
                          <>
                            <tr className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                              <td className="py-2 px-4 font-bold text-purple-900 dark:text-purple-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                                <div className="flex items-center gap-2">
                                  <Database className="w-3 h-3" />
                                  Ensemble Configuration
                                </div>
                              </td>
                            </tr>

                            {/* Server ID */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Server className="w-4 h-4 text-blue-500" />
                                  Server ID
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.serverId || host.serverId || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Election Port */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-orange-500" />
                                  Election Port
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.electionPort || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Quorum Port */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-purple-500" />
                                  Quorum Port
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.quorumPort || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Role */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-indigo-500" />
                                  Role
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.role || 'participant'}
                                </td>
                              ))}
                            </tr>
                          </>
                        )}

                        {/* Performance Metrics */}
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                          <td className="py-2 px-4 font-bold text-green-900 dark:text-green-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3" />
                              Performance & Configuration
                            </div>
                          </td>
                        </tr>

                        {/* Data Directory */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-blue-500" />
                              Data Dir
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.dataDir || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Data Log Directory */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-cyan-500" />
                              Data Log Dir
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.dataLogDir || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Average Latency */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              Avg Latency
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_avg_latency ? 
                                `${parseFloat(dcZkInfo.rawData[index].zk_avg_latency).toFixed(2)}ms` : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Max File Descriptor Count */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-purple-500" />
                              Max File Descriptors
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_max_file_descriptor_count ? 
                                Math.round(dcZkInfo.rawData[index].zk_max_file_descriptor_count).toLocaleString() : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Watch Count */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-indigo-500" />
                              Watch Count
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_watch_count || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Packets Sent */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-green-500" />
                              Packets Sent
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_packets_sent || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Packets Received */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-blue-500" />
                              Packets Received
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.zk_packets_received || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Configuration Settings */}
                        <tr className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                          <td className="py-2 px-4 font-bold text-yellow-900 dark:text-yellow-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <div className="flex items-center gap-2">
                              <Server className="w-3 h-3" />
                              Configuration Settings
                            </div>
                          </td>
                        </tr>

                        {/* Tick Time */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-500" />
                              Tick Time
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.tickTime ? `${dcZkInfo.rawData[index].tickTime}ms` : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Max Client Connections */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-emerald-500" />
                              Max Client Connections
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.maxClientCnxns || '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Min Session Timeout */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              Min Session Timeout
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.minSessionTimeout ? `${dcZkInfo.rawData[index].minSessionTimeout}ms` : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Max Session Timeout */}
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-500" />
                              Max Session Timeout
                            </div>
                          </td>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                              {dcZkInfo.rawData?.[index]?.maxSessionTimeout ? `${dcZkInfo.rawData[index].maxSessionTimeout}ms` : '-'}
                            </td>
                          ))}
                        </tr>

                        {/* Ensemble Specific Details */}
                        {dcZkInfo.mode === 'ensemble' && (
                          <>
                            <tr className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
                              <td className="py-2 px-4 font-bold text-red-900 dark:text-red-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  Ensemble Details
                                </div>
                              </td>
                            </tr>

                            {/* Peer Type */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Server className="w-4 h-4 text-indigo-500" />
                                  Peer Type
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.peerType || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Election Algorithm */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-orange-500" />
                                  Election Algorithm
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.electionAlg || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Init Limit */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-green-500" />
                                  Init Limit
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.initLimit || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Sync Limit */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  Sync Limit
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.syncLimit || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Synced Followers (Leader only) */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-emerald-500" />
                                  Synced Followers
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.zk_synced_followers || '-'}
                                </td>
                              ))}
                            </tr>

                            {/* Pending Syncs (Leader only) */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                  Pending Syncs
                                </div>
                              </td>
                              {dcZkInfo.zkHosts.map((host, index) => (
                                <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                                  {dcZkInfo.rawData?.[index]?.zk_pending_syncs || '-'}
                                </td>
                              ))}
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Errors Section */}
                {dcZkInfo.errors && dcZkInfo.errors.length > 0 && (
                  <div className="mt-6 bg-red-50/80 dark:bg-red-950/30 rounded-xl p-6 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
                      <h4 className="text-lg font-bold text-red-900 dark:text-red-200">Error Messages</h4>
                    </div>
                    <div className="space-y-3">
                      {dcZkInfo.errors.map((error, index) => (
                        <div key={index} className="bg-white/70 dark:bg-black/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Solr Nodes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="shadow-sm border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Server className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{node.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{node.url}</p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {node.status === 'online' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <Badge variant={node.status === 'online' ? "default" : "destructive"} className="text-xs">
                    {node.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {node.status === 'online' && node.systemInfo ? (
                <>
                  {/* Quick Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MemoryStick className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Memory Usage</span>
                      </div>
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {node.systemInfo.jvm.memory.raw["used%"].toFixed(1)}%
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {Math.round(node.systemInfo.jvm.memory.raw.used / (1024 * 1024 * 1024))}GB used
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-800 dark:text-green-300">CPU Load</span>
                      </div>
                      <div className="text-xl font-bold text-green-900 dark:text-green-100">
                        {(node.systemInfo.system.systemLoadAverage * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Load average
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-800 dark:text-orange-300">Uptime</span>
                      </div>
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {Math.floor(node.systemInfo.jvm.jmx.upTimeMS / (1000 * 60 * 60 * 24))}d
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        {Math.floor((node.systemInfo.jvm.jmx.upTimeMS % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h running
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-300">File Descriptors</span>
                      </div>
                      <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        {((node.systemInfo.system.openFileDescriptorCount / node.systemInfo.system.maxFileDescriptorCount) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        {node.systemInfo.system.openFileDescriptorCount} open
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground mb-3">System Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Solr Version</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {node.systemInfo.lucene["solr-spec-version"]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Java Version</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {node.systemInfo.jvm.version.split(' ')[0]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Node ID</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {node.systemInfo.node}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Mode</p>
                        <Badge variant="secondary" className="text-xs">
                          {node.systemInfo.mode}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => navigate(`/node/${encodeURIComponent(node.id)}`)}
                    className="w-full"
                    size="lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Detailed Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Node Unavailable</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {node.error || 'This node is offline or unreachable'}
                      </p>
                      <Button 
                        onClick={() => navigate(`/node/${encodeURIComponent(node.id)}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {nodes.length === 0 && !loading && (
        <Card className="shadow-sm border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                <Server className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Nodes Available</h3>
                <p className="text-muted-foreground max-w-md">
                  No Solr nodes are currently available in this datacenter, or all nodes are offline.
                </p>
              </div>
              <Button onClick={() => fetchClusterData()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const ClusterNodes = () => {
  return (
    <DashboardLayout>
      <ClusterNodesContent />
    </DashboardLayout>
  );
};

export default ClusterNodes
