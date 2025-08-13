import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Server, 
  Database, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Clock, 
  Shield,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

interface SolrNode {
  name: string
  host: string
  port: number
  status: 'healthy' | 'unhealthy'
  system?: {
    totalPhysicalMemorySize: number
    freePhysicalMemorySize: number
    totalSwapSpaceSize: number
    freeSwapSpaceSize: number
    openFileDescriptorCount: number
    maxFileDescriptorCount: number
    systemLoadAverage: number
  }
  jvm?: {
    memory: {
      raw: {
        used: number
        total: number
        max: number
        'used%': number
      }
    }
    jmx: {
      upTimeMS: number
      commandLineArgs: string[]
    }
    name: string
    version: string
    processors: number
  }
  lucene?: {
    'solr-spec-version': string
    'solr-impl-version': string
    'lucene-spec-version': string
    'lucene-impl-version': string
  }
}

interface ZookeeperNode {
  host: string
  port: number
  status: 'healthy' | 'unhealthy'
  mode?: 'leader' | 'follower' | 'observer'
  version?: string
  connections?: number
}

interface DatacenterInfo {
  name: string
  solrNodes: SolrNode[]
  zookeeperNodes: ZookeeperNode[]
}

const DatacenterOverview = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [datacenterInfo, setDatacenterInfo] = useState<DatacenterInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [sortJvmArgs, setSortJvmArgs] = useState<boolean>(true)
  const { toast } = useToast()

  const toggleNodeExpansion = (nodeKey: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeKey)) {
      newExpanded.delete(nodeKey)
    } else {
      newExpanded.add(nodeKey)
    }
    setExpandedNodes(newExpanded)
  }

  const fetchDatacenterInfo = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching datacenter info for:', datacenter)
      
      // Make parallel API calls like ClusterNodes does
      const [nodesResponse, zkResponse] = await Promise.allSettled([
        fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || 'APAC Singapore')}&loadAll=true`),
        fetch(`http://localhost:3001/api/solr/cluster/zookeeper${datacenter ? `?datacenter=${encodeURIComponent(datacenter)}` : ''}`)
      ])

      let solrNodes: SolrNode[] = []
      let zookeeperNodes: ZookeeperNode[] = []

      // Process Solr nodes response
      if (nodesResponse.status === 'fulfilled' && nodesResponse.value.ok) {
        const nodesData = await nodesResponse.value.json()
        console.log('Nodes API response:', nodesData)
        
        solrNodes = nodesData.nodes?.map((node: any) => {
          if (node.systemInfo) {
            return {
              name: node.name,
              host: node.host,
              port: node.port,
              status: node.status === 'online' ? 'healthy' : 'unhealthy',
              system: node.systemInfo.system,
              jvm: node.systemInfo.jvm,
              lucene: node.systemInfo.lucene
            }
          } else {
            return {
              name: node.name,
              host: node.host,
              port: node.port,
              status: 'unhealthy'
            }
          }
        }) || []
      } else {
        console.error('Failed to fetch Solr nodes:', nodesResponse)
        throw new Error('Failed to fetch Solr nodes information')
      }

      // Process ZooKeeper response
      if (zkResponse.status === 'fulfilled' && zkResponse.value.ok) {
        const zkData = await zkResponse.value.json()
        console.log('ZK API response:', zkData)
        
        const dcZkInfo = zkData.datacenters?.[datacenter || 'APAC Singapore']
        if (dcZkInfo?.zkHosts) {
          dcZkInfo.zkHosts.forEach((host: any, index: number) => {
            // Use hostname if available, fallback to host
            const hostname = host.hostname || (host.host ? host.host.split(':')[0] : `zookeeper-${index + 1}`)
            const port = host.port || host.clientPort || (2181 + index)
            
            zookeeperNodes.push({
              host: hostname,
              port: port,
              status: host.status === 'connected' ? 'healthy' : 'unhealthy',
              mode: host.role || undefined, // Use actual role, don't default to 'follower'
              version: host.version || undefined, // Use actual version, don't default
              connections: host.connections || undefined // Use actual connections from API
            })
          })
        } else {
          console.warn('No ZooKeeper information available from API for datacenter:', datacenter)
        }
      } else {
        console.warn('Failed to fetch ZooKeeper info - will show empty ZK section:', zkResponse)
      }

      setDatacenterInfo({
        name: datacenter || 'Unknown',
        solrNodes,
        zookeeperNodes
      })
      
      setLastRefresh(new Date())
      toast({
        title: "Datacenter information updated",
        description: `Loaded ${solrNodes.length} Solr nodes and ${zookeeperNodes.length} ZK nodes from real APIs.`,
      })
    } catch (error) {
      console.error('Error fetching datacenter info:', error)
      
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to backend API. Please ensure the backend server is running on port 3001."
        } else if (error.message.includes('SyntaxError')) {
          errorMessage = "Backend returned invalid JSON. Check if the API endpoint is correct."
        } else if (error.message.includes('404')) {
          errorMessage = "Datacenter API endpoint not found. Check the backend routes."
        } else if (error.message.includes('500')) {
          errorMessage = "Backend server error. Check the backend logs for details."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Failed to fetch datacenter information",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatacenterInfo()
  }, [datacenter])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Overview</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
              <CardContent><div className="h-32 bg-muted rounded"></div></CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
              <CardContent><div className="h-32 bg-muted rounded"></div></CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!datacenterInfo) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Overview</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">Failed to Load Datacenter Information</h3>
                  <p className="text-muted-foreground">Unable to fetch cluster metrics from APIs.</p>
                </div>
                <Button onClick={fetchDatacenterInfo} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const healthySolrNodes = datacenterInfo.solrNodes.filter(node => node.status === 'healthy').length
  const unhealthySolrNodes = datacenterInfo.solrNodes.filter(node => node.status === 'unhealthy').length
  const healthyZkNodes = datacenterInfo.zookeeperNodes.filter(node => node.status === 'healthy').length
  const unhealthyZkNodes = datacenterInfo.zookeeperNodes.filter(node => node.status === 'unhealthy').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">{datacenterInfo.name} Datacenter</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
            </div>
            <Button onClick={fetchDatacenterInfo} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Cluster Health Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Solr Nodes Total */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Solr Nodes</p>
                  <p className="text-2xl font-bold">{datacenterInfo.solrNodes.length}</p>
                </div>
                <img src="/solr-ico.png" alt="Solr" className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          {/* Solr Healthy */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{healthySolrNodes}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Zookeeper Nodes Total */}
          <Card className="border-l-4 border-l-slate-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ZK Nodes</p>
                  <p className="text-2xl font-bold">{datacenterInfo.zookeeperNodes.length}</p>
                </div>
                <img src="/zookeeper.png" alt="ZooKeeper" className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          {/* Zookeeper Healthy */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ZK Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{healthyZkNodes}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solr Nodes Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <img src="/solr-ico.png" alt="Solr" className="w-5 h-5" />
                Solr Nodes ({healthySolrNodes} healthy / {unhealthySolrNodes} unhealthy)
              </CardTitle>
              
              {/* Right Side Badges - Show versions only */}
              <div className="flex flex-wrap gap-2 items-center">
                {datacenterInfo.solrNodes.find(node => node.status === 'healthy' && node.jvm && node.lucene) && (() => {
                  const healthyNode = datacenterInfo.solrNodes.find(node => node.status === 'healthy' && node.jvm && node.lucene)!
                  return (
                    <>
                      <Badge variant="secondary" className="text-xs font-mono bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                        <img src="/solr-ico.png" alt="Solr" className="w-3 h-3 mr-1" />
                        Solr {healthyNode.lucene!['solr-spec-version']}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-mono bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                        Lucene {healthyNode.lucene!['lucene-spec-version']}
                      </Badge>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Node</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Uptime</th>
                    <th className="text-left p-2">Physical Memory</th>
                    <th className="text-left p-2">Swap Space</th>
                    <th className="text-left p-2">File Descriptors</th>
                    <th className="text-left p-2">JVM Memory</th>
                    <th className="text-left p-2">Load</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datacenterInfo.solrNodes.map((node) => {
                    const nodeKey = `${node.host}:${node.port}`
                    const isExpanded = expandedNodes.has(nodeKey)
                    
                    return (
                      <>
                        <tr key={nodeKey} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                node.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                              }`} title={node.status === 'healthy' ? 'Connected' : 'Disconnected'}></div>
                              <span className="font-medium">{node.name}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            {node.status === 'healthy' ? (
                              <Badge
                                variant="default"
                                className="text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md border-0"
                              >
                                CONNECTED
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-xs font-medium"
                              >
                                DISCONNECTED
                              </Badge>
                            )}
                          </td>
                          <td className="p-2">
                            {node.jvm ? (
                              <span className="text-xs">{formatUptime(node.jvm.jmx.upTimeMS)}</span>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {node.system ? (
                              <div className="space-y-1">
                                <div className="text-xs font-mono">
                                  {formatBytes(node.system.totalPhysicalMemorySize - node.system.freePhysicalMemorySize)} / 
                                  {formatBytes(node.system.totalPhysicalMemorySize)}
                                </div>
                                <Progress 
                                  value={((node.system.totalPhysicalMemorySize - node.system.freePhysicalMemorySize) / node.system.totalPhysicalMemorySize) * 100} 
                                  className="h-1 w-20"
                                />
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {node.system && node.system.totalSwapSpaceSize > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs font-mono">
                                  {formatBytes(node.system.totalSwapSpaceSize - node.system.freeSwapSpaceSize)} / 
                                  {formatBytes(node.system.totalSwapSpaceSize)}
                                </div>
                                <Progress 
                                  value={((node.system.totalSwapSpaceSize - node.system.freeSwapSpaceSize) / node.system.totalSwapSpaceSize) * 100} 
                                  className="h-1 w-20"
                                />
                              </div>
                            ) : 'No swap'}
                          </td>
                          <td className="p-2">
                            {node.system ? (
                              <div className="space-y-1">
                                <div className="text-xs font-mono">
                                  {node.system.openFileDescriptorCount.toLocaleString()} / 
                                  {node.system.maxFileDescriptorCount.toLocaleString()}
                                </div>
                                <Progress 
                                  value={(node.system.openFileDescriptorCount / node.system.maxFileDescriptorCount) * 100} 
                                  className="h-1 w-20"
                                />
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {node.jvm ? (
                              <div className="space-y-1">
                                <div className="text-xs font-mono">
                                  {formatBytes(node.jvm.memory.raw.used)} / {formatBytes(node.jvm.memory.raw.max)}
                                </div>
                                <Progress 
                                  value={node.jvm.memory.raw['used%']} 
                                  className="h-1 w-20"
                                />
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {node.system ? (
                              <span className="text-xs font-mono">{node.system.systemLoadAverage.toFixed(2)}</span>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {node.status === 'healthy' && node.jvm && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleNodeExpansion(nodeKey)}
                                className="text-xs flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-3 h-3" />
                                    JVM Details
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                        
                        {/* Expanded JVM Details Row */}
                        {isExpanded && node.jvm && (
                          <tr key={`${nodeKey}-details`} className="bg-muted/30">
                            <td colSpan={9} className="p-0">
                              <div className="p-6 space-y-6 border-l-4 border-l-blue-500">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <HardDrive className="w-5 h-5 text-slate-600" />
                                    JVM Details - {node.name}
                                  </h4>
                                  
                                  {/* Memory Details on Right Side */}
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <Badge variant="secondary" className="text-xs font-mono bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                      <MemoryStick className="w-3 h-3 mr-1" />
                                      Used: {formatBytes(node.jvm.memory.raw.used)}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                                      Total: {formatBytes(node.jvm.memory.raw.total)}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                                      Max: {formatBytes(node.jvm.memory.raw.max)}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs font-mono bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
                                      Usage: {node.jvm.memory.raw['used%'].toFixed(1)}%
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* JVM Info as Badges */}
                                <div className="space-y-4">
                                  {/* Runtime Badges */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-slate-800 dark:text-slate-200">Runtime</h5>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="secondary" className="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                        <Cpu className="w-3 h-3 mr-1" />
                                        {node.jvm.name}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                                        Version: {node.jvm.version}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                                        {node.jvm.processors} {node.jvm.processors === 1 ? 'Processor' : 'Processors'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* JVM Command Line Arguments */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-slate-800 dark:text-slate-200">JVM Arguments</h5>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={sortJvmArgs}
                                        onChange={(e) => setSortJvmArgs(e.target.checked)}
                                        className="w-3 h-3 rounded border border-input bg-background"
                                      />
                                      Sort alphabetically
                                    </label>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {(() => {
                                      let args = node.jvm.jmx.commandLineArgs.slice()
                                      if (sortJvmArgs) {
                                        args = args.sort((a, b) => {
                                          // Remove leading dashes for sorting comparison
                                          const cleanA = a.replace(/^-+/, '')
                                          const cleanB = b.replace(/^-+/, '')
                                          return cleanA.localeCompare(cleanB)
                                        })
                                      }
                                      return args.map((arg, index) => (
                                        <div key={index} className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                          {arg}
                                        </div>
                                      ))
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Zookeeper Nodes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="/zookeeper.png" alt="ZooKeeper" className="w-5 h-5" />
              Zookeeper Nodes ({healthyZkNodes} healthy / {unhealthyZkNodes} unhealthy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Host:Port</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Mode</th>
                    <th className="text-left p-2">Version</th>
                    <th className="text-left p-2">Connections</th>
                  </tr>
                </thead>
                <tbody>
                  {datacenterInfo.zookeeperNodes.map((node) => (
                    <tr key={`${node.host}:${node.port}`} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            node.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                          }`} title={node.status === 'healthy' ? 'Connected' : 'Disconnected'}></div>
                          <span className="font-medium">{node.host}:{node.port}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        {node.status === 'healthy' ? (
                          <Badge
                            variant="default"
                            className="text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md border-0"
                          >
                            CONNECTED
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="text-xs font-medium"
                          >
                            DISCONNECTED
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {node.mode ? (
                          <Badge 
                            variant="default"
                            className={`text-xs font-medium shadow-md border-0 ${
                              node.mode === 'leader' 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold' 
                                : node.mode === 'follower'
                                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                            }`}
                            title={node.mode === 'leader' ? 'Leader' : node.mode === 'follower' ? 'Follower' : 'Observer'}
                          >
                            {node.mode.toUpperCase()}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        <span className="text-xs font-mono">{node.version || '-'}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs">{node.connections || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterOverview
