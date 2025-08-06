import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  HardDrive,
  Cpu,
  ArrowLeft,
  MapPin,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolrNodeInfo {
  id: string
  name: string
  url: string
  datacenter: string
  status: 'online' | 'offline' | 'error'
  systemInfo?: any
  error?: string
}

interface ZooKeeperInfo {
  datacenter: string
  retrievedFrom: string
  zkStatus: any
  timestamp: string
}

interface DatacenterDetailResponse {
  datacenter: string
  nodes: SolrNodeInfo[]
  zkInfo?: ZooKeeperInfo
  config: {
    totalConfiguredNodes: number
    zkNodes: Array<{ host: string; port: number }>
  }
  summary: {
    totalNodes: number
    onlineNodes: number
    healthPercentage: number
    status: 'healthy' | 'degraded' | 'offline'
  }
  timestamp: string
}

const DatacenterDetail = () => {
  const { datacenterName } = useParams<{ datacenterName: string }>()
  const navigate = useNavigate()
  const [datacenterData, setDatacenterData] = useState<DatacenterDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDatacenterData = async () => {
    if (!datacenterName) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:3001/api/solr/datacenters/${datacenterName}`)
      
      if (response.ok) {
        const data: DatacenterDetailResponse = await response.json()
        setDatacenterData(data)
        setLastRefresh(new Date())
        
        toast({
          title: "Datacenter data updated",
          description: `${datacenterName} metrics have been fetched successfully.`,
        })
      } else if (response.status === 404) {
        setError(`Datacenter '${datacenterName}' not found`)
      } else {
        throw new Error(`Failed to fetch datacenter data: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching datacenter data:', error)
      setError('Failed to fetch datacenter information')
      toast({
        title: "Failed to fetch datacenter information",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatacenterData()
  }, [datacenterName])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !datacenterData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Datacenter Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error || `Failed to load datacenter '${datacenterName}'`}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const { nodes, summary, zkInfo, config } = datacenterData

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{datacenterName} Datacenter</h1>
                <p className="text-muted-foreground">
                  Detailed view • Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={fetchDatacenterData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.healthPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.onlineNodes} of {summary.totalNodes} nodes online
              </p>
              <Badge 
                variant={summary.status === 'healthy' ? "secondary" : summary.status === 'degraded' ? "default" : "destructive"}
                className="mt-2"
              >
                {summary.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solr Nodes</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalNodes}</div>
              <p className="text-xs text-muted-foreground">
                {config.totalConfiguredNodes} configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ZooKeeper</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config.zkNodes.length}</div>
              <p className="text-xs text-muted-foreground">
                {config.zkNodes.length > 0 ? 'Ensemble configured' : 'Not configured'}
              </p>
              {zkInfo && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Live data available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ZooKeeper Details */}
        {zkInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                ZooKeeper Ensemble Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200/50 dark:border-green-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">Live Connection</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Retrieved from: {zkInfo.retrievedFrom}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                    {new Date(zkInfo.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">Configuration</span>
                  </div>
                  <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    {config.zkNodes.map((zkNode, index) => (
                      <div key={index} className="font-mono">
                        {zkNode.host}:{zkNode.port}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Solr Nodes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Solr Nodes ({nodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <Card 
                  key={node.id} 
                  className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                  onClick={() => navigate(`/node/${encodeURIComponent(node.id)}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          node.status === 'online' 
                            ? 'bg-green-500 shadow-sm shadow-green-400/50' 
                            : 'bg-red-500 shadow-sm shadow-red-400/50'
                        }`} />
                        <h4 className="font-semibold text-foreground truncate">{node.name}</h4>
                      </div>
                      <Badge 
                        variant={node.status === 'online' ? "secondary" : "destructive"} 
                        className="text-xs font-medium px-2 py-1"
                      >
                        {node.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {node.url}
                      </p>
                    </div>
                    
                    {node.status === 'online' && node.systemInfo ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200/50 dark:border-blue-700/30">
                          <div className="flex items-center gap-1 mb-1">
                            <HardDrive className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Memory</span>
                          </div>
                          <div className="text-sm font-bold text-blue-800 dark:text-blue-200">
                            {node.systemInfo.jvm?.memory?.raw?.["used%"]?.toFixed(1) || 'N/A'}%
                          </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 border border-orange-200/50 dark:border-orange-700/30">
                          <div className="flex items-center gap-1 mb-1">
                            <Cpu className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">CPU</span>
                          </div>
                          <div className="text-sm font-bold text-orange-800 dark:text-orange-200">
                            {(node.systemInfo.system?.systemLoadAverage * 100)?.toFixed(1) || 'N/A'}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-200/50 dark:border-red-700/30">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-medium text-red-700 dark:text-red-300">Error</span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 truncate">
                          {node.error || 'Node offline'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterDetail;
