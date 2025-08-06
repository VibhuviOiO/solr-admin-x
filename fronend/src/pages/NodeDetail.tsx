import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  ArrowLeft,
  MemoryStick,
  Gauge,
  Shield
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

const NodeDetail = () => {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const [nodeInfo, setNodeInfo] = useState<SolrNodeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchNodeDetail = async () => {
    if (!nodeId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:3001/api/solr/system/info?node=${nodeId}`)
      
      if (response.ok) {
        const data = await response.json()
        setNodeInfo(data)
      } else {
        setError('Failed to fetch node details')
      }
    } catch (error) {
      console.error('Error fetching node details:', error)
      setError('Failed to fetch node information')
      toast({
        title: "Failed to fetch node details",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodeDetail()
  }, [nodeId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/cluster/nodes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cluster
            </Button>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !nodeInfo) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/cluster/nodes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cluster
            </Button>
          </div>
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Loading Node
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error || 'Node not found'}</p>
              <Button onClick={fetchNodeDetail} className="mt-4" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const systemInfo = nodeInfo.systemInfo
  const isOnline = nodeInfo.status === 'online'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/cluster/nodes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cluster
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Server className="w-8 h-8 text-primary" />
                {nodeInfo.name}
              </h1>
              <p className="text-muted-foreground">
                {nodeInfo.url} • Datacenter: {nodeInfo.datacenter}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <Badge variant={isOnline ? "secondary" : "destructive"} className="text-sm">
                {nodeInfo.status}
              </Badge>
            </div>
            <Button onClick={fetchNodeDetail} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {isOnline && systemInfo ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemInfo.jvm.memory.raw["used%"].toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemInfo.jvm.memory.used} / {systemInfo.jvm.memory.max}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(systemInfo.system.systemLoadAverage * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemInfo.system.availableProcessors} processors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor(systemInfo.jvm.jmx.upTimeMS / (1000 * 60 * 60 * 24))}d
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor((systemInfo.jvm.jmx.upTimeMS % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h {Math.floor((systemInfo.jvm.jmx.upTimeMS % (1000 * 60 * 60)) / (1000 * 60))}m
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">File Descriptors</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((systemInfo.system.openFileDescriptorCount / systemInfo.system.maxFileDescriptorCount) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemInfo.system.openFileDescriptorCount} / {systemInfo.system.maxFileDescriptorCount}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* JVM Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    JVM Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Version</p>
                      <p className="font-mono text-sm">{systemInfo.jvm.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">VM Name</p>
                      <p className="font-mono text-sm">{systemInfo.jvm.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p className="font-mono text-sm">{systemInfo.jvm.spec?.vendor || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processors</p>
                      <p className="font-mono text-sm">{systemInfo.jvm.processors}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Memory Details</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="font-mono">{systemInfo.jvm.memory.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free:</span>
                        <span className="font-mono">{systemInfo.jvm.memory.free}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-mono">{systemInfo.jvm.memory.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span className="font-mono">{systemInfo.jvm.memory.max}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-500" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">OS Name</p>
                      <p className="font-mono text-sm">{systemInfo.system.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Architecture</p>
                      <p className="font-mono text-sm">{systemInfo.system.arch}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Processors</p>
                      <p className="font-mono text-sm">{systemInfo.system.availableProcessors}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Load Average</p>
                      <p className="font-mono text-sm">{systemInfo.system.systemLoadAverage.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Memory Details</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Total Physical:</span>
                        <span className="font-mono">{(systemInfo.system.totalPhysicalMemorySize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free Physical:</span>
                        <span className="font-mono">{(systemInfo.system.freePhysicalMemorySize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Swap:</span>
                        <span className="font-mono">{(systemInfo.system.totalSwapSpaceSize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free Swap:</span>
                        <span className="font-mono">{(systemInfo.system.freeSwapSpaceSize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solr Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-500" />
                    Solr Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mode</p>
                      <Badge variant="secondary">{systemInfo.mode}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Node ID</p>
                      <p className="font-mono text-sm">{systemInfo.node}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solr Version</p>
                      <p className="font-mono text-sm">{systemInfo.lucene["solr-spec-version"]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lucene Version</p>
                      <p className="font-mono text-sm">{systemInfo.lucene["lucene-spec-version"]}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Solr Home</p>
                        <p className="font-mono text-xs break-all">{systemInfo.solr_home}</p>
                      </div>
                      {systemInfo.zkHost && (
                        <div>
                          <p className="text-sm text-muted-foreground">ZooKeeper Host</p>
                          <p className="font-mono text-xs break-all">{systemInfo.zkHost}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Security & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">TLS Enabled</p>
                      <Badge variant={systemInfo.security.tls ? "secondary" : "outline"}>
                        {systemInfo.security.tls ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-mono text-xs">
                        {new Date(systemInfo.jvm.jmx.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">JVM Arguments</p>
                    <div className="max-h-32 overflow-y-auto">
                      {systemInfo.jvm.jmx.commandLineArgs.map((arg: string, index: number) => (
                        <p key={index} className="font-mono text-xs text-muted-foreground break-all">
                          {arg}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Node Offline</h3>
                <p className="text-sm text-red-600">
                  {nodeInfo.error || 'This node is currently offline or unreachable.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default NodeDetail
