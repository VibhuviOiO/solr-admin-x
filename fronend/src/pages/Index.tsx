import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
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
  MapPin,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatacenterSummary {
  name: string
  nodeCount: number
  onlineNodes: number
  healthStatus: 'online' | 'offline' | 'degraded'
  zkNodeCount: number
  hasZooKeeper: boolean
  zkHealthy?: boolean
  zkStatus?: string
  sampleNodeUrl?: string
  configuredNodes?: string[]
}

interface DatacenterSummaryResponse {
  datacenters: DatacenterSummary[]
  summary: {
    totalDatacenters: number
    healthyDatacenters: number
    totalNodes: number
    totalOnlineNodes: number
    overallHealth: number
  }
  timestamp: string
  debug?: {
    message: string
    configuredPorts: string[]
  }
}

const Index = () => {
  const navigate = useNavigate()
  const [clusterSummary, setClusterSummary] = useState<DatacenterSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchClusterSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBase}/solr/datacenters/summary`)
      
      if (response.ok) {
        const data: DatacenterSummaryResponse = await response.json()
        setClusterSummary(data)
        setLastRefresh(new Date())
        
        toast({
          title: "Cluster summary updated",
          description: "Latest cluster metrics have been fetched successfully.",
        })
      } else {
        throw new Error(`Failed to fetch cluster summary: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching cluster summary:', error)
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
    fetchClusterSummary()
  }, [])

  // Calculate metrics from summary data
  const summary = clusterSummary?.summary
  const datacenters = clusterSummary?.datacenters || []
  
  // Calculate cluster health percentage
  const clusterHealth = summary ? summary.overallHealth : 0
  
  // Calculate real-time node statistics
  const onlineNodes = summary?.totalOnlineNodes || 0
  const totalNodes = summary?.totalNodes || 0
  const offlineNodes = totalNodes - onlineNodes
  
  // Calculate ZooKeeper statistics
  const totalZkNodes = datacenters.reduce((sum, dc) => sum + dc.zkNodeCount, 0)
  const healthyZkDatacenters = datacenters.filter(dc => dc.zkHealthy).length
  const datacentersWithZk = datacenters.filter(dc => dc.hasZooKeeper).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Solr UIX Dashboard</h1>
              <p className="text-muted-foreground">Loading cluster overview...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Solr UIX Dashboard</h1>
            <p className="text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Refreshing cluster data...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live cluster metrics • Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchClusterSummary} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cluster Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Debug Information */}
        {clusterSummary?.debug && summary?.healthyDatacenters === 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Node Connectivity Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 mb-2">{clusterSummary.debug.message}</p>
              <div className="text-sm text-yellow-600">
                <p className="font-medium">Configured Solr URLs:</p>
                <ul className="list-disc list-inside mt-1">
                  {clusterSummary.debug.configuredPorts.map((port, index) => (
                    <li key={index} className="font-mono">http://{port}/solr</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cluster Health</CardTitle>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clusterHealth.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.healthyDatacenters || 0} of {summary?.totalDatacenters || 0} datacenters online
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${clusterHealth === 100 ? 'bg-green-500' : clusterHealth > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {clusterHealth === 100 ? 'Excellent' : clusterHealth > 50 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solr Nodes</CardTitle>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalNodes || 0}</div>
              <p className="text-xs text-muted-foreground">
                {onlineNodes} online • {offlineNodes} offline
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">
                  Across {summary?.totalDatacenters || 0} location{(summary?.totalDatacenters || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Datacenters</CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalDatacenters || 0}</div>
              <p className="text-xs text-muted-foreground">
                {datacenters.filter(dc => dc.healthStatus === 'online').length} online • {datacenters.filter(dc => dc.healthStatus === 'offline').length} offline
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs text-muted-foreground">
                  {datacenters.map(dc => dc.name).slice(0, 2).join(', ')}{datacenters.length > 2 ? ` +${datacenters.length - 2}` : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ZooKeeper</CardTitle>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalZkNodes}
              </div>
              <p className="text-xs text-muted-foreground">
                {healthyZkDatacenters}/{datacenters.length} datacenters online
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  healthyZkDatacenters === datacenters.length && datacenters.length > 0 
                    ? 'bg-green-500' 
                    : healthyZkDatacenters > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {healthyZkDatacenters === datacenters.length && datacenters.length > 0
                    ? 'All healthy' 
                    : healthyZkDatacenters > 0 
                    ? 'Partial health' 
                    : 'Unhealthy'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Datacenter Overview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Datacenter Overview</h2>
            <Button onClick={() => navigate('/cluster/nodes')} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View All Nodes
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {datacenters.map((datacenter) => (
              <Card 
                key={datacenter.name} 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-lg"
                onClick={() => navigate(`/datacenter/${datacenter.name}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground">
                          {datacenter.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {datacenter.nodeCount} nodes • {datacenter.zkNodeCount} ZK nodes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`w-3 h-3 rounded-full ${
                          datacenter.healthStatus === 'online' 
                            ? 'bg-green-500 shadow-sm shadow-green-400/50' 
                            : datacenter.healthStatus === 'degraded'
                            ? 'bg-yellow-500 shadow-sm shadow-yellow-400/50'
                            : 'bg-red-500 shadow-sm shadow-red-400/50'
                        }`} />
                      </div>
                      <Badge 
                        variant={datacenter.healthStatus === 'online' ? "secondary" : datacenter.healthStatus === 'degraded' ? "default" : "destructive"}
                        className="px-3 py-1 text-sm font-medium"
                      >
                        {datacenter.healthStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/50 dark:border-slate-600/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Solr Nodes
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {datacenter.onlineNodes}/{datacenter.nodeCount}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {datacenter.healthStatus === 'online' 
                          ? 'All nodes online' 
                          : datacenter.healthStatus === 'offline'
                          ? 'All nodes offline'
                          : `${datacenter.onlineNodes} of ${datacenter.nodeCount} online`
                        }
                      </p>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/50 dark:border-slate-600/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className={`w-4 h-4 ${
                          datacenter.zkHealthy 
                            ? 'text-green-600 dark:text-green-400' 
                            : datacenter.hasZooKeeper 
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          ZooKeeper
                        </span>
                        {datacenter.hasZooKeeper && (
                          <div className={`w-2 h-2 rounded-full ${
                            datacenter.zkHealthy ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        )}
                      </div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {datacenter.zkNodeCount}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {datacenter.zkHealthy 
                          ? 'Online & Healthy' 
                          : datacenter.hasZooKeeper 
                          ? 'Offline or Unreachable'
                          : 'Not configured'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Click to view detailed information
                      </span>
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-sm font-medium">View Details</span>
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {datacenters.length === 0 && !loading && (
          <Card className="bg-admin-card border-border">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No datacenters found</h3>
                <p className="text-sm text-muted-foreground">
                  No datacenters are currently configured or available.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
