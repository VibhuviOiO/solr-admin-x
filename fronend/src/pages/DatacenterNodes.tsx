import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
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
  Database,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface SolrNodeSystemInfo {
  mode: string
  zkHost: string
  solr_home: string
  core_root: string
  lucene: {
    'solr-spec-version': string
    'solr-impl-version': string
    'lucene-spec-version': string
    'lucene-impl-version': string
  }
  jvm: {
    version: string
    name: string
    processors: number
    memory: {
      free: string
      total: string
      max: string
      used: string
      raw: {
        free: number
        total: number
        max: number
        used: number
        'used%': number
      }
    }
    jmx: {
      startTime: string
      upTimeMS: number
    }
  }
  system: {
    name: string
    arch: string
    availableProcessors: number
    systemLoadAverage: number
    version: string
    cpuLoad: number
    processCpuLoad: number
    freeMemorySize: number
    freePhysicalMemorySize: number
    totalMemorySize: number
    totalPhysicalMemorySize: number
    maxFileDescriptorCount: number
    openFileDescriptorCount: number
  }
  node: string
}

interface SolrNodeMetrics {
  'solr.jetty': {
    'org.eclipse.jetty.server.handler.DefaultHandler.get-requests': {
      count: number
      meanRate: number
      '1minRate': number
      '5minRate': number
      '15minRate': number
      'p75_ms': number
      'p95_ms': number
      'p99_ms': number
    }
  }
  'solr.node': {
    'CONTAINER.fs.coreRoot.totalSpace': number
    'CONTAINER.fs.coreRoot.usableSpace': number
    'CONTAINER.fs.totalSpace': number
    'CONTAINER.fs.usableSpace': number
  }
  'solr.jvm': {
    'memory.heap.used': number
    'memory.heap.max': number
    'memory.heap.usage': number
    'os.name': string
    'os.version': string
    'os.availableProcessors': number
    'os.systemLoadAverage': number
    'os.processCpuLoad': number
    'os.freePhysicalMemorySize': number
    'os.totalPhysicalMemorySize': number
    'os.maxFileDescriptorCount': number
    'os.openFileDescriptorCount': number
    'system.properties': Record<string, string>
  }
}

interface SolrNodeInfo {
  id: string
  name: string
  host: string
  port: number
  status: 'online' | 'offline' | 'error'
  systemInfo?: string | SolrNodeSystemInfo  // Can be either string or object
  metrics?: SolrNodeMetrics
  error?: string
  collections?: string[]
  cores?: string[]
}

interface DatacenterNodesResponse {
  datacenter: string
  nodes: SolrNodeInfo[]
  status: 'success' | 'error'
  error?: string
}

function DatacenterNodesContent() {
  const navigate = useNavigate()
  const { datacenter } = useParams<{ datacenter: string }>()
  const [nodes, setNodes] = useState<SolrNodeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})
  const [showHostDetails, setShowHostDetails] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const toggleDetails = (nodeId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
  }

  const toggleHostDetails = (host: string) => {
    setShowHostDetails(prev => ({
      ...prev,
      [host]: !prev[host]
    }))
  }

  const fetchNodesData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!datacenter) {
        setError('No datacenter specified')
        return
      }
      
      console.log('Fetching nodes for datacenter:', datacenter)
      
      // Fetch nodes data for specific datacenter
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBase}/solr/datacenter/${encodeURIComponent(datacenter)}/nodes`)
      
      if (response.ok) {
        const data: DatacenterNodesResponse = await response.json()
        console.log('Received nodes data:', data)
        setNodes(data.nodes)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        setError(errorData.message || errorData.error || 'Failed to fetch Solr nodes')
      }

      setLastRefresh(new Date())
      
      toast({
        title: "Solr nodes updated",
        description: `Latest node information has been fetched successfully.`,
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
    if (datacenter) {
      fetchNodesData()
    }
  }, [datacenter])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

  const formatRate = (rate: number): string => {
    if (rate < 0.01) return '0'
    return rate.toFixed(2)
  }

  // Group nodes by host for display
  const nodesByHost = nodes.reduce((acc, node) => {
    if (!acc[node.host]) {
      acc[node.host] = []
    }
    acc[node.host].push(node)
    return acc
  }, {} as Record<string, SolrNodeInfo[]>)

  if (!datacenter) {
    return (
      <div className="space-y-6 p-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">No datacenter specified in URL</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{datacenter} - Solr Nodes</h2>
            <p className="text-muted-foreground">Loading node information...</p>
          </div>
        </div>
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
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{datacenter} - Solr Nodes</h2>
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
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                {datacenter} - Solr Nodes
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
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <Badge variant="outline" className="text-xs">
                    Datacenter
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => fetchNodesData()} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Nodes Table */}
      {nodes.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Solr Nodes Overview
            </CardTitle>
            <CardDescription>
              Detailed information about Solr nodes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Host</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Node</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">CPU</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Heap</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Disk Usage</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Requests</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Collections</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b">Replicas</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(nodesByHost).map(([host, hostNodes]) => 
                    hostNodes.map((node, nodeIndex) => {
                      const isFirstNodeForHost = nodeIndex === 0
                      const isDeadNode = node.status !== 'online'
                      
                      return (
                        <tr key={node.id} className={`border-b hover:bg-muted/30 transition-colors ${isDeadNode ? 'opacity-60' : ''}`}>
                          {/* Host Column - only show for first node of host */}
                          {isFirstNodeForHost && (
                            <td className="p-4 align-top border-r" rowSpan={hostNodes.length}>
                              <div className="space-y-2">
                                <div className="font-semibold text-foreground">{host}</div>
                                
                                {/* Host Specs - Collapsed by default */}
                                {!showHostDetails[host] && node.metrics && (
                                  <div className="text-sm text-muted-foreground">
                                    <div>{node.metrics['solr.jvm']?.['os.name'] || 'Unknown OS'}</div>
                                    <div title={`Free: ${node.metrics['solr.jvm']?.['os.freePhysicalMemorySize'] ? formatBytes(node.metrics['solr.jvm']['os.freePhysicalMemorySize']) : 'N/A'}`}>
                                      {node.metrics['solr.jvm']?.['os.totalPhysicalMemorySize'] ? formatBytes(node.metrics['solr.jvm']['os.totalPhysicalMemorySize']) : 'N/A'}
                                    </div>
                                    <div title={`Java version from JVM properties`}>
                                      Java {node.metrics['solr.jvm']?.['system.properties']?.['java.version']?.split('.')[0] || 'Unknown'}
                                    </div>
                                    <div>Load: {node.metrics['solr.jvm']?.['os.systemLoadAverage']?.toFixed(2) || 'N/A'}</div>
                                  </div>
                                )}
                                
                                {/* Host Specs - Expanded */}
                                {showHostDetails[host] && node.metrics && (
                                  <div className="text-sm text-muted-foreground">
                                    <div>{node.metrics['solr.jvm']?.['os.name'] || 'Unknown OS'} {node.metrics['solr.jvm']?.['os.version'] || ''}, {node.metrics['solr.jvm']?.['os.availableProcessors'] || 0}cpu</div>
                                    <div>Memory: {node.metrics['solr.jvm']?.['os.totalPhysicalMemorySize'] ? formatBytes(node.metrics['solr.jvm']['os.totalPhysicalMemorySize']) : 'N/A'}</div>
                                    <div>File descriptors: {node.metrics['solr.jvm']?.['os.openFileDescriptorCount'] || 0}/{node.metrics['solr.jvm']?.['os.maxFileDescriptorCount'] || 0}</div>
                                    {node.metrics['solr.node'] && (
                                      <div>
                                        Disk: <span className="text-orange-600" title="Nodes may use other disks too">
                                          {formatBytes((node.metrics['solr.node']['CONTAINER.fs.totalSpace'] || 0) - (node.metrics['solr.node']['CONTAINER.fs.usableSpace'] || 0))} used: {Math.round((((node.metrics['solr.node']['CONTAINER.fs.totalSpace'] || 0) - (node.metrics['solr.node']['CONTAINER.fs.usableSpace'] || 0)) / (node.metrics['solr.node']['CONTAINER.fs.totalSpace'] || 1)) * 100)}%
                                        </span>
                                      </div>
                                    )}
                                    <div>Load: {node.metrics['solr.jvm']?.['os.systemLoadAverage']?.toFixed(2) || 'N/A'}</div>
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => toggleHostDetails(host)}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  {showHostDetails[host] ? 'hide details...' : 'show details...'}
                                </button>
                              </div>
                            </td>
                          )}
                          
                          {/* Node Column */}
                          <td className={`p-4 border-r ${isDeadNode ? 'text-red-600' : ''}`}>
                            <div className="space-y-2">
                              <div className="font-medium">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  onClick={() => navigate(`/node/${node.id}`)}
                                >
                                  {node.name}
                                </button>
                              </div>
                              
                              {isDeadNode && (
                                <div className="text-red-600 font-medium">(DEAD)</div>
                              )}
                              
                              {!isDeadNode && node.metrics && (
                                <div className="text-sm text-muted-foreground">
                                  <div>Mode: {typeof node.systemInfo === 'string' ? node.systemInfo : 'Unknown'}</div>
                                  
                                  {showDetails[node.id] && (
                                    <div className="mt-2">
                                      <div title="Java version from JVM properties">
                                        Java {node.metrics['solr.jvm']?.['system.properties']?.['java.version'] || 'Unknown'}
                                      </div>
                                      <div>Solr {node.metrics['solr.node']?.['CONTAINER.version.specification'] || 'Unknown'}</div>
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => toggleDetails(node.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                                  >
                                    {showDetails[node.id] ? 'hide details...' : 'show details...'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* CPU Column */}
                          <td className={`p-4 border-r ${isDeadNode ? 'text-red-600' : ''}`}>
                            {!isDeadNode && node.metrics?.['solr.jvm']?.['os.processCpuLoad'] !== undefined ? (
                              <div>
                                <span className={`font-medium ${
                                  node.metrics['solr.jvm']['os.processCpuLoad'] > 0.8 ? 'text-red-600' : 
                                  node.metrics['solr.jvm']['os.processCpuLoad'] > 0.6 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {(node.metrics['solr.jvm']['os.processCpuLoad'] * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Heap Column */}
                          <td className={`p-4 border-r ${isDeadNode ? 'text-red-600' : ''}`}>
                            {!isDeadNode && node.metrics?.['solr.jvm']?.['memory.heap.usage'] !== undefined ? (
                              <div>
                                <div 
                                  className={`font-medium ${
                                    (node.metrics['solr.jvm']['memory.heap.usage'] * 100) > 80 ? 'text-red-600' : 
                                    (node.metrics['solr.jvm']['memory.heap.usage'] * 100) > 60 ? 'text-orange-600' : 'text-green-600'
                                  }`}
                                  title={`Max: ${formatBytes(node.metrics['solr.jvm']['memory.heap.max'] || 0)} Used: ${formatBytes(node.metrics['solr.jvm']['memory.heap.used'] || 0)} Usage%: ${Math.round((node.metrics['solr.jvm']['memory.heap.usage'] || 0) * 100)}`}
                                >
                                  {Math.round((node.metrics['solr.jvm']['memory.heap.usage'] || 0) * 100)}%
                                </div>
                                
                                {showDetails[node.id] && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <div>Max: {formatBytes(node.metrics['solr.jvm']['memory.heap.max'] || 0)}</div>
                                    <div>Used: {formatBytes(node.metrics['solr.jvm']['memory.heap.used'] || 0)}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Disk Usage Column */}
                          <td className={`p-4 border-r max-h-64 overflow-y-auto ${isDeadNode ? 'text-red-600' : ''}`}>
                            {!isDeadNode && node.metrics?.['solr.node'] ? (
                              <div>
                                <div 
                                  className="font-medium text-muted-foreground"
                                  title={`Available disk: ${formatBytes(node.metrics['solr.node']['CONTAINER.fs.totalSpace'] || 0)} free: ${formatBytes(node.metrics['solr.node']['CONTAINER.fs.usableSpace'] || 0)} used by this node: 0b`}
                                >
                                  0b
                                </div>
                                
                                {showDetails[node.id] && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <div>Total #docs: 0</div>
                                    <div>Avg size/doc: 0b</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Requests Column */}
                          <td className={`p-4 border-r ${isDeadNode ? 'text-red-600' : ''}`}>
                            {!isDeadNode && node.metrics?.['solr.jetty']?.['org.eclipse.jetty.server.handler.DefaultHandler.get-requests'] ? (
                              <div 
                                className="text-sm"
                                title={`1minRate: ${node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['1minRate'].toFixed(2)} 5minRate: ${node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['5minRate'].toFixed(2)} 15minRate: ${node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['15minRate'].toFixed(2)} p75: ${node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['p75_ms']} p99: ${node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['p99_ms']}`}
                              >
                                <div>RPM: {formatRate(node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['15minRate'])}</div>
                                <div>p95: {Math.round(node.metrics['solr.jetty']['org.eclipse.jetty.server.handler.DefaultHandler.get-requests']['p95_ms'])}ms</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Collections Column */}
                          <td className={`p-4 border-r ${isDeadNode ? 'text-red-600' : ''}`}>
                            {node.collections && node.collections.length > 0 ? (
                              <div>
                                {node.collections.slice(0, showDetails[node.id] ? 999 : 2).map((collection, idx) => (
                                  <div key={idx} className="text-sm text-blue-600">{collection}</div>
                                ))}
                                {node.collections.length > 2 && !showDetails[node.id] && (
                                  <button
                                    onClick={() => toggleDetails(node.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    (-{node.collections.length - 2} more...)
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">(none)</span>
                            )}
                          </td>
                          
                          {/* Replicas Column */}
                          <td className={`p-4 max-h-64 overflow-y-auto ${isDeadNode ? 'text-red-600' : ''}`}>
                            {node.cores && node.cores.length > 0 ? (
                              <div>
                                {node.cores.slice(0, showDetails[node.id] ? 999 : 2).map((core, idx) => (
                                  <div key={idx} className="text-sm text-blue-600">{core}</div>
                                ))}
                                {node.cores.length > 2 && !showDetails[node.id] && !isDeadNode && (
                                  <button
                                    onClick={() => toggleDetails(node.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    (-{node.cores.length - 2} more...)
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">(none)</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="shadow-sm border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                <Server className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Solr Nodes Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No Solr nodes are currently available in this datacenter.
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

const DatacenterNodes = () => {
  return (
    <DashboardLayout>
      <DatacenterNodesContent />
    </DashboardLayout>
  );
};

export default DatacenterNodes
