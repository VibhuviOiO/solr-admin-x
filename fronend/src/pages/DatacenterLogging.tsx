import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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

// Use the correct interface that matches your backend response
interface NodeLoggingInfo {
  nodeId: string
  nodeName: string
  host: string
  port: number
  status: 'online' | 'offline' | 'error'
  loggingInfo?: any // Changed from loggingData to loggingInfo
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
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['ALL'])
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

  // Use your existing working API endpoint exactly as it was
  const fetchNodesLogging = async (showToast = true) => {
    try {
      setLoading(true)
      
      if (!datacenter) {
        throw new Error('No datacenter specified')
      }
      
      // Call your existing backend API that was already working
      const response = await fetch(`http://localhost:3001/api/solr/datacenter/${encodeURIComponent(datacenter)}/logging`)
      
      if (response.ok) {
        const data: DatacenterLoggingResponse = await response.json()
        console.log('API Response:', JSON.stringify(data, null, 2)) // Better debug log
        
        setNodes(data.nodes)
        
        // Auto-select first online node
        const onlineNode = data.nodes.find(node => node.status === 'online')
        if (onlineNode && !selectedNode) {
          setSelectedNode(onlineNode.nodeId)
        }
        
        setLastRefresh(new Date())
        
        if (showToast) {
          const onlineCount = data.nodes.filter(n => n.status === 'online').length
          toast({
            title: "Logging information updated",
            description: `${onlineCount} of ${data.nodes.length} nodes online in ${datacenter}`,
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

  const handleLevelChange = (level: string, checked: boolean) => {
    if (level === 'ALL') {
      setSelectedLevels(checked ? ['ALL'] : [])
    } else {
      setSelectedLevels(prev => {
        const filtered = prev.filter(l => l !== 'ALL')
        if (checked) {
          return [...filtered, level]
        } else {
          return filtered.filter(l => l !== level)
        }
      })
    }
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'destructive'
      case 'warn':
        return 'secondary'
      case 'info':
        return 'default'
      case 'debug':
        return 'outline'
      case 'trace':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getLogsFromNode = (node: NodeLoggingInfo) => {
    console.log('Getting logs from node:', node.nodeName, 'loggingInfo:', node.loggingInfo)
    
    // Check loggingInfo instead of loggingData
    if (!node.loggingInfo) {
      console.log('No loggingInfo found for node:', node.nodeName)
      return []
    }
    
    // Try different possible structures
    const loggingInfo = node.loggingInfo
    
    // If it's directly an array of logs
    if (Array.isArray(loggingInfo)) {
      console.log('Found array of logs:', loggingInfo.length)
      return loggingInfo
    }
    
    // If it has a logs property
    if (loggingInfo.logs && Array.isArray(loggingInfo.logs)) {
      console.log('Found logs property:', loggingInfo.logs.length)
      return loggingInfo.logs
    }
    
    // If it has loggers with events/messages
    if (loggingInfo.loggers && Array.isArray(loggingInfo.loggers)) {
      console.log('Found loggers, checking for log entries')
      // Look for actual log entries in the loggers structure
      const logs = []
      for (const logger of loggingInfo.loggers) {
        if (logger.events && Array.isArray(logger.events)) {
          logs.push(...logger.events)
        }
        if (logger.messages && Array.isArray(logger.messages)) {
          logs.push(...logger.messages)
        }
      }
      console.log('Extracted logs from loggers:', logs.length)
      return logs
    }
    
    // If it's an object with potential log entries
    if (typeof loggingInfo === 'object') {
      console.log('Checking object structure for logs')
      // Look for properties that might contain log entries
      const possibleLogArrays = Object.values(loggingInfo).filter((value: any) => 
        Array.isArray(value) && value.length > 0 && 
        value[0] && typeof value[0] === 'object' && 
        (value[0].time || value[0].timestamp || value[0].level || value[0].message)
      )
      
      if (possibleLogArrays.length > 0) {
        console.log('Found possible log arrays:', possibleLogArrays.length)
        return possibleLogArrays.flat()
      }
      
      // Look for individual log entries as object values
      const logEntries = Object.values(loggingInfo).filter((item: any) => 
        item && typeof item === 'object' && 
        (item.time || item.timestamp) && 
        (item.level || item.severity) && 
        item.message
      )
      
      if (logEntries.length > 0) {
        console.log('Found individual log entries:', logEntries.length)
        return logEntries
      }
    }
    
    console.log('No logs found in structure:', typeof loggingInfo)
    return []
  }

  const getFilteredLogs = (logs: any[]) => {
    if (selectedLevels.includes('ALL') || selectedLevels.length === 0) {
      return logs
    }
    return logs.filter(log => selectedLevels.includes(log.level || log.severity))
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleString()
    } catch {
      return timeStr
    }
  }

  const extractLoggerName = (fullLogger: string) => {
    if (!fullLogger) return '-'
    const parts = fullLogger.split('.')
    return parts[parts.length - 1]
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

        {/* Log Level Filters */}
        <div className="flex items-center gap-4 flex-wrap p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Log Level:</span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {LOG_LEVELS.map(level => (
              <div key={level} className="flex items-center gap-2">
                <Checkbox
                  id={level}
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={(checked) => handleLevelChange(level, checked as boolean)}
                />
                <label 
                  htmlFor={level} 
                  className="text-sm cursor-pointer hover:text-primary"
                >
                  <Badge variant={getLevelBadgeVariant(level)} className="text-xs">
                    {level}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground ml-auto">
            {selectedLevels.length === 0 || selectedLevels.includes('ALL') ? 'All levels' : `${selectedLevels.length} level(s) selected`}
          </div>
        </div>

        {/* Node Tabs */}
        <Tabs value={selectedNode} onValueChange={setSelectedNode}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
            {nodes.map((node) => (
              <TabsTrigger key={node.nodeId} value={node.nodeId} className="flex items-center gap-2">
                {node.status === 'online' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium">{node.nodeName}</span>
                <Badge 
                  variant={node.status === 'online' ? 'secondary' : 'destructive'} 
                  className="text-xs"
                >
                  {node.status}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {nodes.map((node) => {
            const logs = getLogsFromNode(node)
            const filteredLogs = getFilteredLogs(logs)
            
            return (
              <TabsContent key={node.nodeId} value={node.nodeId} className="space-y-4">
                {node.status === 'online' ? (
                  <>
                    {/* Always show the raw data for debugging */}
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Debug - Raw loggingInfo structure:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(node.loggingInfo, null, 2)}
                      </pre>
                    </div>
                    
                    {logs.length > 0 ? (
                      <div className="space-y-4">
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground">
                          Debug: Found {logs.length} logs, showing {filteredLogs.length} after filtering
                        </div>
                        
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            Recent Logs - {node.nodeName}
                          </h2>
                          <div className="text-sm text-muted-foreground">
                            Showing {filteredLogs.length} of {logs.length} log entries
                          </div>
                        </div>

                        {/* Logs Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-3 font-medium">Time (Local)</th>
                                  <th className="text-left p-3 font-medium">Level</th>
                                  <th className="text-left p-3 font-medium">Core</th>
                                  <th className="text-left p-3 font-medium">Logger</th>
                                  <th className="text-left p-3 font-medium">Message</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredLogs.length > 0 ? (
                                  filteredLogs.map((log: any, index: number) => (
                                    <tr key={index} className="border-t hover:bg-muted/30">
                                      <td className="p-3 text-sm font-mono whitespace-nowrap">
                                        {formatTime(log.time || log.timestamp || 'N/A')}
                                      </td>
                                      <td className="p-3">
                                        <Badge variant={getLevelBadgeVariant(log.level || log.severity)} className="text-xs">
                                          {log.level || log.severity || 'UNKNOWN'}
                                        </Badge>
                                      </td>
                                      <td className="p-3 text-sm font-mono">
                                        {log.core || log.collection || '-'}
                                      </td>
                                      <td className="p-3 text-sm font-mono">
                                        {extractLoggerName(log.logger || log.category || '-')}
                                      </td>
                                      <td className="p-3 text-sm max-w-md">
                                        <div className="truncate" title={log.message || log.text || 'No message'}>
                                          {log.message || log.text || 'No message'}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                      <Filter className="w-12 h-12 mx-auto mb-3" />
                                      <div className="text-sm font-medium mb-1">No logs match the filter</div>
                                      <div className="text-xs">Try selecting "ALL" to see all log levels</div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold">No Logs Available</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            No recent log entries found for this node
                          </p>
                        </div>
                      </div>
                    )}
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
            )
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default DatacenterLogging
