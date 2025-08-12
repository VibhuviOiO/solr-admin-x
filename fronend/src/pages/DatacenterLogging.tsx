

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RefreshCw, FileText, AlertTriangle, Clock, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface LoggingEvent {
  time: string;
  level: string;
  logger: string;
  message: string;
  node_name?: string;
  core: string;
  trace?: string;
  [key: string]: any;
}

interface LoggingInfoResponse {
  responseHeader: any;
  info: {
    levels: string[];
    last: number;
    buffer: number;
  };
  history: {
    numFound: number;
    start: number;
    numFoundExact: boolean;
    docs: LoggingEvent[];
  };
  watcher: string;
}

interface SolrNode {
  name: string;
  host: string;
  port: number;
  status: 'online' | 'offline';
}

const DatacenterLogging = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [nodes, setNodes] = useState<SolrNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string>("")
  const [nodeLog, setNodeLog] = useState<LoggingInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [timezone, setTimezone] = useState<'Local' | 'UTC'>("Local")
  const { toast } = useToast()

  // Fetch nodes for datacenter
  useEffect(() => {
    const fetchNodes = async () => {
      setLoading(true)
      setError(null)
      try {
        const nodesRes = await fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || "")}&loadAll=true`)
        if (!nodesRes.ok) throw new Error("Failed to fetch nodes")
        const nodesData = await nodesRes.json()
        const onlineNodes = nodesData.nodes?.filter((n: any) => n.status === "online") || []
        setNodes(onlineNodes)
        if (onlineNodes.length > 0) setSelectedNode(onlineNodes[0].name)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchNodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datacenter])

  // Fetch logs for selected node
  useEffect(() => {
    if (!selectedNode) return
    setNodeLog(null)
    setExpandedRows(new Set())
    setLoading(true)
    fetch(`http://localhost:3001/api/solr/logging/info?node=${encodeURIComponent(selectedNode)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setNodeLog(data))
      .catch(() => setNodeLog(null))
      .finally(() => setLoading(false))
  }, [selectedNode])

  const handleRefresh = () => {
    if (selectedNode) {
      setLoading(true)
      setNodeLog(null)
      setExpandedRows(new Set())
      fetch(`http://localhost:3001/api/solr/logging/info?node=${encodeURIComponent(selectedNode)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setNodeLog(data))
        .catch(() => setNodeLog(null))
        .finally(() => setLoading(false))
    }
  }

  const toggleTimezone = () => {
    setTimezone(tz => tz === "Local" ? "UTC" : "Local")
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return timezone === "UTC" ? date.toLocaleString("en-US", { timeZone: "UTC" }) : date.toLocaleString()
    } catch {
      return timeStr
    }
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level?.toLowerCase?.()) {
      case 'error':
      case 'fatal':
        return 'destructive'
      case 'warn':
        return 'secondary'
      case 'info':
        return 'default'
      case 'debug':
      case 'trace':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleRowToggle = (idx: number) => {
    setExpandedRows(prev => {
      const set = new Set(prev)
      if (set.has(idx)) set.delete(idx)
      else set.add(idx)
      return set
    })
  }

  const TRUNCATE_LENGTH = 120;
  const isTruncated = (msg: string) => msg && msg.length > TRUNCATE_LENGTH;
  const getTruncated = (msg: string) => isTruncated(msg) ? msg.slice(0, TRUNCATE_LENGTH) + '...' : msg;

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

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Logging</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Logging</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={toggleTimezone} variant="outline">
              {timezone === "UTC" ? "Show Local" : "Show UTC"}
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        {nodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Online Nodes</h3>
              <p className="text-muted-foreground mt-2">No online nodes found in this datacenter.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedNode} onValueChange={setSelectedNode} className="w-full">
            <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
              {nodes.map((node) => (
                <TabsTrigger key={node.name} value={node.name} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{node.name}</Badge>
                  <span className="text-xs text-muted-foreground">{node.host}:{node.port}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {nodes.map((node) => (
              <TabsContent key={node.name} value={node.name} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{node.name}</Badge>
                      <span className="text-xs text-muted-foreground">{node.host}:{node.port}</span>
                    </CardTitle>
                    <CardDescription>
                      {nodeLog?.watcher && <span>Watcher: <span className="font-mono text-blue-700 dark:text-blue-300">{nodeLog.watcher}</span></span>}
                      {nodeLog?.info && (
                        <span className="ml-4">Buffer: <span className="font-mono">{nodeLog.info.buffer}</span> | Last: <span className="font-mono">{nodeLog.info.last}</span></span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedNode === node.name && nodeLog?.history?.docs?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No log events found for this node.</div>
                    ) : selectedNode === node.name && nodeLog?.history?.docs ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold bg-muted/50">Time ({timezone})</th>
                              <th className="text-left p-3 font-semibold bg-muted/50">Level</th>
                              <th className="text-left p-3 font-semibold bg-muted/50">Core</th>
                              <th className="text-left p-3 font-semibold bg-muted/50">Logger</th>
                              <th className="text-left p-3 font-semibold bg-muted/50">Message</th>
                              <th className="w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedNode === node.name && nodeLog?.history?.docs?.map((event, idx) => (
                              <>
                                <tr
                                  key={idx}
                                  className={`border-b hover:bg-muted/30 cursor-pointer`}
                                  onClick={() => handleRowToggle(idx)}
                                >
                                  <td className="p-3 font-mono text-xs">{formatTime(event.time)}</td>
                                  <td className="p-3">
                                    <Badge variant={getLevelBadgeVariant(event.level)} className="text-xs">
                                      {event.level}
                                    </Badge>
                                  </td>
                                  <td className="p-3 font-mono text-xs">{event.core}</td>
                                  <td className="p-3 font-mono text-xs" title={event.logger}>{event.logger?.split('.').pop()}</td>
                                  <td className="p-3 text-xs max-w-md">
                                    <span className="truncate" title={event.message}>
                                      {expandedRows.has(idx) ? event.message : getTruncated(event.message)}
                                    </span>
                                  </td>
                                  <td className="p-3 w-8 text-center">
                                    {expandedRows.has(idx)
                                      ? <ChevronDown className="w-4 h-4 mx-auto transition-transform duration-200 rotate-180 text-blue-600" />
                                      : <ChevronRight className="w-4 h-4 mx-auto transition-transform duration-200 text-gray-400" />}
                                  </td>
                                </tr>
                                {expandedRows.has(idx) && (
                                  <tr className="bg-muted/30">
                                    <td colSpan={6} className="p-3">
                                      {event.trace && (
                                        <>
                                          <div className="mb-2 text-xs font-semibold">Stack Trace:</div>
                                          <pre className="text-xs whitespace-pre-wrap mb-2">{event.trace}</pre>
                                        </>
                                      )}
                                      <div className="text-xs text-muted-foreground">
                                        <strong>All Properties:</strong>
                                        <pre className="whitespace-pre-wrap mt-1">{JSON.stringify(event, null, 2)}</pre>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DatacenterLogging
