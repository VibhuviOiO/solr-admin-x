import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { 
  RefreshCw, 
  FileText, 
  Server, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Filter,
  Pause,
  Play
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolrLogger {
  name: string
  level: string
  set: boolean
}

interface SolrLoggingInfo {
  loggers: SolrLogger[]
  levels: string[]
  watcher: string
  rootLogger: {
    level: string
  }
}

interface NodeLoggingInfo {
  nodeId: string
  nodeName: string
  host: string
  port: number
  status: 'online' | 'offline' | 'error'
  loggingInfo?: SolrLoggingInfo
  error?: string
  timestamp: string
}

interface DatacenterLoggingResponse {
  datacenter: string
  status: 'success' | 'error'
  nodes: NodeLoggingInfo[]
  timestamp: string
}

const LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF']
const REFRESH_INTERVALS = [
  { label: 'Manual', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 }
]

const DatacenterLogging = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [nodes, setNodes] = useState<NodeLoggingInfo[]>([])
  const [selectedNode, setSelectedNode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<number>(0)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const { toast } = useToast()

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchNodesLogging(false) // Silent refresh
      }, refreshInterval)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval])

  const fetchNodesLogging = async (showToast = true) => {
    try {
      setLoading(true)
      
      if (!datacenter) {
        throw new Error('No datacenter specified')
      }
      
      const response = await fetch(`http://localhost:3001/api/solr/datacenter/${encodeURIComponent(datacenter)}/logging`)
      
      if (response.ok) {
        const data: DatacenterLoggingResponse = await response.json()
        setNodes(data.nodes)
        
        // Auto-select first online node
        const onlineNode = data.nodes.find(node => node.status === 'online')
        if (onlineNode && !selectedNode) {
          setSelectedNode(onlineNode.nodeId)
        }
        
        setLastRefresh(new Date())
        
        if (showToast) {
          toast({
            title: "Logging information loaded",
            description: `Found ${data.nodes.length} nodes in ${datacenter}`,
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch logging information')
      }
    } catch (error) {
      console.error('Error fetching logging info:', error)
      if (showToast) {
        toast({
          title: "Failed to fetch logging information",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshIntervalChange = (value: string) => {
    const interval = parseInt(value)
    setRefreshInterval(interval)
    if (interval === 0) {
      setAutoRefresh(false)
    }
  }

  const toggleAutoRefresh = () => {
    if (refreshInterval === 0) {
      toast({
        title: "Select refresh interval",
        description: "Please select a refresh interval before enabling auto-refresh",
        variant: "destructive",
      })
      return
    }
    setAutoRefresh(!autoRefresh)
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'debug':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'trace':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'all':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'off':
        return 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getFilteredLoggers = (loggers: SolrLogger[]) => {
    if (levelFilter === 'ALL') {
      return loggers
    }
    return loggers.filter(logger => logger.level === levelFilter)
  }

  useEffect(() => {
    if (datacenter) {
      fetchNodesLogging()
    }
  }, [datacenter])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold">Logging</h1>
              <p className="text-muted-foreground">Loading logging information...</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Logging</h1>
              <p className="text-muted-foreground">
                {datacenter} Datacenter • {nodes.length} Node{nodes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoRefresh}
              >
                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Select value={refreshInterval.toString()} onValueChange={handleRefreshIntervalChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_INTERVALS.map(interval => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {lastRefresh && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {lastRefresh.toLocaleTimeString()}
              </div>
            )}
            
            <Button onClick={() => fetchNodesLogging()} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Node Tabs with inline information */}
        <Tabs value={selectedNode} onValueChange={setSelectedNode}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
            {nodes.map((node) => (
              <TabsTrigger key={node.nodeId} value={node.nodeId} className="flex items-center gap-2">
                {node.status === 'online' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                {node.nodeName}
                <Badge variant={node.status === 'online' ? 'secondary' : 'destructive'} className="text-xs">
                  {node.status}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {nodes.map((node) => (
            <TabsContent key={node.nodeId} value={node.nodeId} className="space-y-6">
              {node.status === 'online' ? (
                <>
                  {/* Node Info and Logger Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          <CardTitle>Logger Configuration</CardTitle>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Root Logger Level Badge */}
                          {node.loggingInfo && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Root:</span>
                              <Badge className={getLevelBadgeColor(node.loggingInfo.rootLogger.level)}>
                                {node.loggingInfo.rootLogger.level}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Log Watcher Badge */}
                          {node.loggingInfo && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Watcher:</span>
                              <Badge variant="outline">{node.loggingInfo.watcher}</Badge>
                            </div>
                          )}
                          
                          {/* Filter Control */}
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <Select value={levelFilter} onValueChange={setLevelFilter}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LOG_LEVELS.map(level => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <CardDescription>
                        Showing {node.loggingInfo ? getFilteredLoggers(node.loggingInfo.loggers).length : 0} of {node.loggingInfo?.loggers.length || 0} loggers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {node.loggingInfo && (
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {getFilteredLoggers(node.loggingInfo.loggers).length > 0 ? (
                            getFilteredLoggers(node.loggingInfo.loggers)
                              .sort((a, b) => {
                                // Sort root logger first, then alphabetically
                                if (a.name === 'root') return -1;
                                if (b.name === 'root') return 1;
                                return a.name.localeCompare(b.name);
                              })
                              .map((logger, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-sm truncate" title={logger.name}>
                                    {logger.name === 'root' ? (
                                      <span className="font-bold text-primary">root</span>
                                    ) : (
                                      logger.name
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge className={getLevelBadgeColor(logger.level)}>
                                    {logger.level}
                                  </Badge>
                                  {logger.set && (
                                    <Badge variant="secondary" className="text-xs">
                                      SET
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                No loggers match the filter
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Select "ALL" to see all loggers
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Node Unavailable</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {node.error || 'This node is currently offline or unreachable'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fetchNodesLogging()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default DatacenterLogging
