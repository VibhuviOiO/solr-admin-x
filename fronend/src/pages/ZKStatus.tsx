import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { 
  RefreshCw, 
  Server, 
  Database, 
  Activity, 
  CheckCircle2,
  Clock,
  HardDrive,
  Network,
  Zap,
  Eye,
  ChevronDown,
  ChevronRight
} from "lucide-react"

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

export function ZKStatusContent() {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [zkInfo, setZkInfo] = useState<ZooKeeperInfo | null>(null)
  const [zkExpanded, setZkExpanded] = useState(true)
  const [coreStatusExpanded, setCoreStatusExpanded] = useState(true)
  const [ensembleConfigExpanded, setEnsembleConfigExpanded] = useState(false)
  const [performanceExpanded, setPerformanceExpanded] = useState(false)
  const [configSettingsExpanded, setConfigSettingsExpanded] = useState(false)
  const [ensembleDetailsExpanded, setEnsembleDetailsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Component for truncated text with tooltip
  const TruncatedText = ({ text, maxLength = 20, className = "" }: { text: string, maxLength?: number, className?: string }) => {
    if (!text || text.length <= maxLength) {
      return <span className={className}>{text}</span>
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`cursor-help ${className}`}>
              {text.slice(0, maxLength)}...
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-words">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const fetchZKData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const zkResponse = await fetch(`http://localhost:3001/api/solr/cluster/zookeeper${datacenter ? `?datacenter=${datacenter}` : ''}`)

      if (zkResponse.ok) {
        const zkData: ZooKeeperInfo = await zkResponse.json()
        setZkInfo(zkData)
      } else {
        console.error('Failed to fetch ZK info:', zkResponse)
        setError('Failed to fetch ZooKeeper information')
      }

      setLastRefresh(new Date())
      
      toast({
        title: "ZooKeeper information updated",
        description: "Latest ZooKeeper metrics have been fetched successfully.",
      })
    } catch (error) {
      console.error('Error fetching ZK data:', error)
      setError('Failed to fetch ZooKeeper information')
      toast({
        title: "Failed to fetch ZooKeeper information",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZKData()
  }, [datacenter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">ZooKeeper Status</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Card className="animate-pulse">
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">ZooKeeper Status</h2>
            <p className="text-muted-foreground">Error occurred</p>
          </div>
          <Button onClick={() => fetchZKData()} variant="outline">
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
            ZooKeeper Status
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}</span>
            </div>
            {datacenter && (
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <Badge variant="outline" className="text-xs">
                  {datacenter}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => fetchZKData()} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ZooKeeper Information */}
      {zkInfo && Object.entries(zkInfo.datacenters)
        .filter(([dcName]) => !datacenter || dcName === datacenter)
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

                <div className="flex-1">
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
                              className="text-xs font-mono bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              title={`Version: ${host.version}`}
                            >
                              Version: {host.version.length > 5 ? `${host.version.substring(0, 5)}` : host.version}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            title="Port"
                          >
                            Port: {host.port}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="pt-0 pb-8 bg-white/30 dark:bg-black/10">
                {/* Connection String */}
                <div className="bg-white/80 dark:bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/30 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connection String</h3>
                  </div>
                  <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 overflow-hidden relative group">
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
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 min-w-[200px] w-1/4">
                            Metric
                          </th>
                          {dcZkInfo.zkHosts.map((host, index) => (
                            <th key={index} className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 min-w-[120px]">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 truncate">{host.hostname}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Core Status Section */}
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                          <td className="py-2 px-4 font-bold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <button
                              onClick={() => setCoreStatusExpanded(!coreStatusExpanded)}
                              className="flex items-center gap-2 w-full hover:text-blue-700 dark:hover:text-blue-100"
                            >
                              <Server className="w-3 h-3" />
                              <span>Core Status</span>
                              {coreStatusExpanded ? (
                                <ChevronDown className="w-3 h-3 ml-auto" />
                              ) : (
                                <ChevronRight className="w-3 h-3 ml-auto" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {coreStatusExpanded && (
                          <>
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.ok !== undefined ? 
                                      (dcZkInfo.rawData.details[index].ok ? 'true' : 'false') : 
                                      (host.status === 'connected' ? 'true' : 'false')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.clientPort || host.clientPort || host.port || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.secureClientPort || '-')}
                                    maxLength={12}
                                  />
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
                                  {(dcZkInfo.rawData?.details?.[index]?.zk_server_state || host.role) ? (
                                    <Badge 
                                      variant="default"
                                      className={`text-xs font-medium ${
                                        (dcZkInfo.rawData?.details?.[index]?.zk_server_state || host.role) === 'leader' 
                                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold' 
                                          : (dcZkInfo.rawData?.details?.[index]?.zk_server_state || host.role) === 'follower'
                                          ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
                                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                      }`}
                                    >
                                      {(dcZkInfo.rawData?.details?.[index]?.zk_server_state || host.role)?.toUpperCase()}
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_version || host.version || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.zk_approximate_data_size ? 
                                      `${(parseFloat(dcZkInfo.rawData.details[index].zk_approximate_data_size) / 1024).toFixed(1)}KB` : '-'}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_znode_count || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_num_alive_connections || '-')}
                                    maxLength={12}
                                  />
                                </td>
                              ))}
                            </tr>
                          </>
                        )}

                        {/* Ensemble Specific Metrics */}
                        {dcZkInfo.mode === 'ensemble' && (
                          <>
                            <tr className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                              <td className="py-2 px-4 font-bold text-purple-900 dark:text-purple-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                                <button
                                  onClick={() => setEnsembleConfigExpanded(!ensembleConfigExpanded)}
                                  className="flex items-center gap-2 w-full hover:text-purple-700 dark:hover:text-purple-100"
                                >
                                  <Database className="w-3 h-3" />
                                  <span>Ensemble Configuration</span>
                                  {ensembleConfigExpanded ? (
                                    <ChevronDown className="w-3 h-3 ml-auto" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 ml-auto" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {ensembleConfigExpanded && (
                              <>
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.serverId || host.serverId || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.electionPort || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.quorumPort || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.role || 'participant')}
                                        maxLength={12}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              </>
                            )}
                          </>
                        )}

                        {/* Performance Metrics */}
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                          <td className="py-2 px-4 font-bold text-green-900 dark:text-green-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <button
                              onClick={() => setPerformanceExpanded(!performanceExpanded)}
                              className="flex items-center gap-2 w-full hover:text-green-700 dark:hover:text-green-100"
                            >
                              <Activity className="w-3 h-3" />
                              <span>Performance Metrics</span>
                              {performanceExpanded ? (
                                <ChevronDown className="w-3 h-3 ml-auto" />
                              ) : (
                                <ChevronRight className="w-3 h-3 ml-auto" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {performanceExpanded && (
                          <>
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.dataDir || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.dataLogDir || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.zk_avg_latency ? 
                                      `${parseFloat(dcZkInfo.rawData.details[index].zk_avg_latency).toFixed(2)}ms` : '-'}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.zk_max_file_descriptor_count ? 
                                      Math.round(dcZkInfo.rawData.details[index].zk_max_file_descriptor_count).toLocaleString() : '-'}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_watch_count || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_packets_sent || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.zk_packets_received || '-')}
                                    maxLength={12}
                                  />
                                </td>
                              ))}
                            </tr>
                          </>
                        )}

                        {/* Configuration Settings */}
                        <tr className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                          <td className="py-2 px-4 font-bold text-yellow-900 dark:text-yellow-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                            <Collapsible open={configSettingsExpanded} onOpenChange={setConfigSettingsExpanded}>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-yellow-700 dark:hover:text-yellow-100">
                                <Server className="w-3 h-3" />
                                <span>Configuration Settings</span>
                                {configSettingsExpanded ? (
                                  <ChevronDown className="w-3 h-3 ml-auto" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 ml-auto" />
                                )}
                              </CollapsibleTrigger>
                            </Collapsible>
                          </td>
                        </tr>

                        <Collapsible open={configSettingsExpanded}>
                          <CollapsibleContent>
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.tickTime ? 
                                      `${dcZkInfo.rawData.details[index].tickTime}ms` : '-'}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={String(dcZkInfo.rawData?.details?.[index]?.maxClientCnxns || '-')}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.minSessionTimeout ? 
                                      `${dcZkInfo.rawData.details[index].minSessionTimeout}ms` : '-'}
                                    maxLength={12}
                                  />
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
                                  <TruncatedText 
                                    text={dcZkInfo.rawData?.details?.[index]?.maxSessionTimeout ? 
                                      `${dcZkInfo.rawData.details[index].maxSessionTimeout}ms` : '-'}
                                    maxLength={12}
                                  />
                                </td>
                              ))}
                            </tr>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Ensemble Specific Details */}
                        {dcZkInfo.mode === 'ensemble' && (
                          <>
                            <tr className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
                              <td className="py-2 px-4 font-bold text-red-900 dark:text-red-200 text-xs uppercase tracking-wider" colSpan={dcZkInfo.zkHosts.length + 1}>
                                <Collapsible open={ensembleDetailsExpanded} onOpenChange={setEnsembleDetailsExpanded}>
                                  <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-red-700 dark:hover:text-red-100">
                                    <Activity className="w-3 h-3" />
                                    <span>Ensemble Details</span>
                                    {ensembleDetailsExpanded ? (
                                      <ChevronDown className="w-3 h-3 ml-auto" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 ml-auto" />
                                    )}
                                  </CollapsibleTrigger>
                                </Collapsible>
                              </td>
                            </tr>

                            <Collapsible open={ensembleDetailsExpanded}>
                              <CollapsibleContent>
                                {/* Peer Type */}
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/20">
                                    <div className="flex items-center gap-2">
                                      <Server className="w-4 h-4 text-indigo-500" />
                                      Peer Type
                                    </div>
                                  </td>
                                  {dcZkInfo.zkHosts.map((host, index) => (
                                    <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300 max-w-[100px]">
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.peerType || '-')}
                                        maxLength={15}
                                      />
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
                                    <td key={index} className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300 max-w-[100px]">
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.electionAlg || '-')}
                                        maxLength={15}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.initLimit || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.syncLimit || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.zk_synced_followers || '-')}
                                        maxLength={12}
                                      />
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
                                      <TruncatedText 
                                        text={String(dcZkInfo.rawData?.details?.[index]?.zk_pending_syncs || '-')}
                                        maxLength={12}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              </CollapsibleContent>
                            </Collapsible>
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
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Connection Errors</h3>
                    </div>
                    <div className="space-y-3">
                      {dcZkInfo.errors.map((error, index) => (
                        <div key={index} className="bg-red-100/50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200/50 dark:border-red-800/50">
                          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
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
    </div>
  )
}

const ZKStatus = () => {
  return (
    <DashboardLayout>
      <ZKStatusContent />
    </DashboardLayout>
  );
};

export default ZKStatus
