import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  RefreshCw, 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu,
  Network,
  MapPin,
  ArrowRight,
  MemoryStick,
  ChevronDown,
  ChevronRight,
  Database,
  Zap
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface SolrNodeInfo {
  id: string
  name: string
  url: string
  datacenter: string
  host: string
  port: number
  status: 'online' | 'offline' | 'error'
  systemInfo?: any
  metrics?: any
  error?: string
  default?: boolean
}

interface ClusterResponse {
  nodes: SolrNodeInfo[]
  datacenters: string[]
  loadedDefaults?: boolean
}

export function SolrNodes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedDatacenter = searchParams.get('datacenter') || 'all'
  const [nodes, setNodes] = useState<SolrNodeInfo[]>([])
  const [datacenters, setDatacenters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedDefaults, setLoadedDefaults] = useState(true)
  const [expandedDatacenters, setExpandedDatacenters] = useState<Set<string>>(new Set(['all']))
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

  const fetchNodesData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch nodes data with loadAll=true to get all nodes
      const response = await fetch(`http://localhost:3001/api/solr/cluster/nodes?loadAll=true${selectedDatacenter !== 'all' ? `&datacenter=${selectedDatacenter}` : ''}`)
      
      if (response.ok) {
        const data: ClusterResponse = await response.json()
        setNodes(data.nodes)
        setDatacenters(data.datacenters)
        setLoadedDefaults(data.loadedDefaults ?? true)
      } else {
        setError('Failed to fetch Solr nodes')
      }

      setLastRefresh(new Date())
      
      toast({
        title: "Solr nodes updated",
        description: "Latest node information has been fetched successfully.",
      })
    } catch (error) {
      console.error('Error fetching nodes data:', error)
      setError('Failed to fetch Solr node information')
      toast({
        title: "Failed to fetch node information",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodesData()
  }, [selectedDatacenter])

  const toggleDatacenterExpansion = (datacenter: string) => {
    const newExpanded = new Set(expandedDatacenters)
    if (newExpanded.has(datacenter)) {
      newExpanded.delete(datacenter)
    } else {
      newExpanded.add(datacenter)
    }
    setExpandedDatacenters(newExpanded)
  }

  // Group nodes by datacenter
  const nodesByDatacenter = nodes.reduce((acc, node) => {
    if (!acc[node.datacenter]) {
      acc[node.datacenter] = []
    }
    acc[node.datacenter].push(node)
    return acc
  }, {} as Record<string, SolrNodeInfo[]>)

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (uptimeMs: number): string => {
    const seconds = Math.floor(uptimeMs / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Solr Nodes</h2>
            <p className="text-muted-foreground">Loading node information...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
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
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Solr Nodes</h2>
            <p className="text-muted-foreground">Error occurred</p>
          </div>
          <Button onClick={() => fetchNodesData()} variant="outline">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Solr Nodes
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
          <Button onClick={() => fetchNodesData()} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Nodes by Datacenter */}
      <div className="space-y-6">
        {Object.entries(nodesByDatacenter)
          .filter(([dcName]) => selectedDatacenter === 'all' || dcName === selectedDatacenter)
          .map(([dcName, dcNodes]) => (
          <Card key={dcName} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
            <Collapsible 
              open={expandedDatacenters.has(dcName)} 
              onOpenChange={() => toggleDatacenterExpansion(dcName)}
            >
              <CardHeader className="pb-6 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                          <Server className="w-8 h-8 text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${
                          dcNodes.every(node => node.status === 'online') ? 'bg-green-500' : 
                          dcNodes.some(node => node.status === 'online') ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            {dcName} Datacenter
                          </CardTitle>
                          <CardDescription className="text-base text-gray-600 dark:text-gray-300 font-medium">
                            {dcNodes.length} Solr Node{dcNodes.length !== 1 ? 's' : ''} • 
                            {dcNodes.filter(node => node.status === 'online').length} Online
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Compact Metrics */}
                      <div className="flex items-center gap-2">
                        <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3 h-3 text-emerald-600" />
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{dcNodes.length}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {dcNodes.filter(node => node.status === 'online').length}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Online</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/30">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {dcNodes.filter(node => node.status !== 'online').length}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 leading-none">Offline</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`text-sm font-semibold px-4 py-2 shadow-md border-0 ${
                            dcNodes.every(node => node.status === 'online')
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                              : dcNodes.some(node => node.status === 'online')
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                          }`}
                        >
                          {dcNodes.every(node => node.status === 'online') ? 'HEALTHY' : 
                           dcNodes.some(node => node.status === 'online') ? 'PARTIAL' : 'DOWN'}
                        </Badge>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="lg" 
                            className="rounded-xl font-medium cursor-pointer hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-300 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-100 dark:hover:bg-emerald-900/20"
                          >
                            {expandedDatacenters.has(dcName) ? (
                              <>
                                <ChevronDown className="w-5 h-5 mr-2" />
                                Hide Nodes
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-5 h-5 mr-2" />
                                Show Nodes
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="pt-0 pb-8 bg-white/30 dark:bg-black/10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dcNodes.map((node) => (
                      <Card key={node.id} className="bg-white/80 dark:bg-black/40 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/node/${node.id}`)}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                                node.status === 'online' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                              }`}>
                                <Server className={`w-5 h-5 ${
                                  node.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{node.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                                  {node.host}:{node.port}
                                </p>
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
                              {node.default && (
                                <Badge variant="outline" className="text-xs">
                                  DEFAULT
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {node.status === 'online' && node.systemInfo ? (
                            <>
                              {/* Quick Metrics Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">CPU</span>
                                  </div>
                                  <div className="mt-1">
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                      {node.systemInfo.system?.processCpuLoad 
                                        ? `${(node.systemInfo.system.processCpuLoad * 100).toFixed(1)}%`
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <MemoryStick className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Memory</span>
                                  </div>
                                  <div className="mt-1">
                                    <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                      {node.systemInfo.jvm?.memory?.used && node.systemInfo.jvm?.memory?.max
                                        ? `${((node.systemInfo.jvm.memory.used / node.systemInfo.jvm.memory.max) * 100).toFixed(1)}%`
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Disk</span>
                                  </div>
                                  <div className="mt-1">
                                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                      {node.systemInfo.system?.freePhysicalMemorySize 
                                        ? formatBytes(node.systemInfo.system.freePhysicalMemorySize)
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Uptime</span>
                                  </div>
                                  <div className="mt-1">
                                    <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                      {node.systemInfo.jvm?.jmx?.upTimeMS 
                                        ? formatUptime(node.systemInfo.jvm.jmx.upTimeMS)
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Details */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Solr Version</span>
                                  <span className="font-mono text-gray-900 dark:text-white">
                                    {node.systemInfo.lucene?.['solr-spec-version'] || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Java Version</span>
                                  <span className="font-mono text-gray-900 dark:text-white">
                                    <TruncatedText 
                                      text={node.systemInfo.jvm?.version || 'Unknown'}
                                      maxLength={15}
                                    />
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">JVM Memory</span>
                                  <span className="font-mono text-gray-900 dark:text-white">
                                    {node.systemInfo.jvm?.memory?.used && node.systemInfo.jvm?.memory?.max
                                      ? `${formatBytes(node.systemInfo.jvm.memory.used)} / ${formatBytes(node.systemInfo.jvm.memory.max)}`
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* View Details Button */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-4"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/node/${node.id}`)
                                }}
                              >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Node Offline
                              </div>
                              <div className="text-xs text-gray-500">
                                {node.error || 'Unable to connect to this node'}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Solr Nodes Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No Solr nodes are currently available{selectedDatacenter !== 'all' ? ` in ${selectedDatacenter}` : ''}.
                </p>
              </div>
              <Button onClick={() => fetchNodesData()} variant="outline">
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
