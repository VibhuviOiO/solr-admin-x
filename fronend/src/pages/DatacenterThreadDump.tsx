import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
// ...existing code...
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Activity, RefreshCw, AlertTriangle, ChevronDown, ChevronRight, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"


interface ThreadDumpEntry {
  id: number;
  name: string;
  state: string;
  cpuTime: string;
  userTime: string;
  stackTrace: string[];
  lock?: string;
  "lock-waiting"?: {
    name: string;
    owner: string | null;
  };
  "synchronizers-locked"?: string[];
  "monitors-locked"?: string[];
  native?: boolean;
}

interface InfoThreadsResponse {
  responseHeader: {
    status: number;
    responseHeader: any;
  };
  system: {
    threadCount: {
      current: number;
      peak: number;
      daemon: number;
    };
    threadDump: Array<string | ThreadDumpEntry>;
  };
}

const DatacenterThreadDump = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nodes, setNodes] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [threadData, setThreadData] = useState<{ threads: ThreadDumpEntry[]; threadCount: { current: number; peak: number; daemon: number } | null; loading: boolean; error: string | null }>({ threads: [], threadCount: null, loading: false, error: null })
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<'cpu' | 'user' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  // Fetch nodes for datacenter, then fetch thread dump for selected node

  useEffect(() => {
    const fetchNodes = async () => {
      setLoading(true)
      setError(null)
      setNodes([])
      try {
        const nodesRes = await fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || "")}&loadAll=true`)
        if (!nodesRes.ok) throw new Error("Failed to fetch nodes")
        const nodesData = await nodesRes.json()
        const onlineNodes = nodesData.nodes?.filter((n: any) => n.status === "online") || []
        setNodes(onlineNodes)
        if (onlineNodes.length) setSelectedNode(onlineNodes[0].name)
      } catch (err: any) {
        setError(err.message || "Unknown error")
        toast({
          title: "Failed to load nodes",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchNodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datacenter])

  // Fetch thread dump for selected node
  useEffect(() => {
    if (!selectedNode) return
    setThreadData({ threads: [], threadCount: null, loading: true, error: null })
    setExpanded(new Set())
    const fetchThreads = async () => {
      try {
        const threadRes = await fetch(`http://localhost:3001/api/info/threads?node=${encodeURIComponent(selectedNode)}`)
        if (!threadRes.ok) throw new Error("Failed to fetch thread dump")
        const threadDataRes: InfoThreadsResponse = await threadRes.json()
        const entries = (threadDataRes.system.threadDump || []).filter((t: any) => typeof t === "object") as ThreadDumpEntry[]
        setThreadData({
          threads: entries,
          threadCount: threadDataRes.system.threadCount,
          loading: false,
          error: null
        })
      } catch (err: any) {
        setThreadData({
          threads: [],
          threadCount: null,
          loading: false,
          error: err.message || "Unknown error"
        })
      }
    }
    fetchThreads()
  }, [selectedNode])

  // No per-node effect needed; handled in fetchNodes above

  const handleRefresh = () => {
    if (!selectedNode) return
    setThreadData({ threads: [], threadCount: null, loading: true, error: null })
    setExpanded(new Set())
    const fetchThreads = async () => {
      try {
        const threadRes = await fetch(`http://localhost:3001/api/info/threads?node=${encodeURIComponent(selectedNode)}`)
        if (!threadRes.ok) throw new Error("Failed to fetch thread dump")
        const threadDataRes: InfoThreadsResponse = await threadRes.json()
        const entries = (threadDataRes.system.threadDump || []).filter((t: any) => typeof t === "object") as ThreadDumpEntry[]
        setThreadData({
          threads: entries,
          threadCount: threadDataRes.system.threadCount,
          loading: false,
          error: null
        })
      } catch (err: any) {
        setThreadData({
          threads: [],
          threadCount: null,
          loading: false,
          error: err.message || "Unknown error"
        })
      }
    }
    fetchThreads()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Thread Dump</h1>
                <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Thread Dump</h1>
                <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold">Failed to load thread dump</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
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
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Thread Dump</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        {nodes.length > 0 && (
          <Tabs value={selectedNode || undefined} onValueChange={setSelectedNode} className="w-full">
            <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
              {nodes.map((node) => (
                <TabsTrigger key={node.name} value={node.name} className="flex items-center gap-2">
                  <span className="font-mono text-xs">{node.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {nodes.map((node) => (
              <TabsContent key={node.name} value={node.name} className="space-y-4">
                {selectedNode === node.name && (
                  <div>
                    <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between bg-muted/50 rounded-lg px-4 py-3 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Server className="w-6 h-6 text-primary shrink-0" />
                        <h2 className="font-mono font-semibold text-lg truncate">{node.name.charAt(0).toUpperCase() + node.name.slice(1)}</h2>
                        <span className="text-xs text-muted-foreground truncate">{node.host}:{node.port}</span>
                        <span className="text-xs text-green-600 font-semibold ml-2">Online</span>
                      </div>
                      {threadData.threadCount && (
                        <div className="flex gap-2 flex-wrap md:justify-end">
                          <Badge variant="secondary" className="text-xs px-2 py-1">Threads: <span className="font-semibold ml-1">{threadData.threadCount.current}</span></Badge>
                          <Badge variant="secondary" className="text-xs px-2 py-1">Peak: <span className="font-semibold ml-1">{threadData.threadCount.peak}</span></Badge>
                          <Badge variant="secondary" className="text-xs px-2 py-1">Daemon: <span className="font-semibold ml-1">{threadData.threadCount.daemon}</span></Badge>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto border border-border rounded-lg">
                      {threadData.loading ? (
                        <div className="p-6 text-muted-foreground">Loading thread dump...</div>
                      ) : threadData.error ? (
                        <div className="p-6 text-red-600">{threadData.error}</div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="text-left p-3 w-8"></th>
                              <th className="text-left p-3">Name</th>
                              <th
                                className="text-left p-3 cursor-pointer select-none"
                                onClick={() => {
                                  setSortBy('cpu')
                                  setSortDir(sortBy === 'cpu' && sortDir === 'desc' ? 'asc' : 'desc')
                                }}
                              >
                                <span className="inline-flex items-center gap-1">
                                  CPU Time
                                  <span className={sortBy === 'cpu' ? 'text-primary' : 'text-muted-foreground'}>
                                    ▲
                                  </span>
                                  <span className={sortBy === 'cpu' ? 'text-primary' : 'text-muted-foreground'}>
                                    ▼
                                  </span>
                                </span>
                              </th>
                              <th
                                className="text-left p-3 cursor-pointer select-none"
                                onClick={() => {
                                  setSortBy('user')
                                  setSortDir(sortBy === 'user' && sortDir === 'desc' ? 'asc' : 'desc')
                                }}
                              >
                                <span className="inline-flex items-center gap-1">
                                  User Time
                                  <span className={sortBy === 'user' ? 'text-primary' : 'text-muted-foreground'}>
                                    ▲
                                  </span>
                                  <span className={sortBy === 'user' ? 'text-primary' : 'text-muted-foreground'}>
                                    ▼
                                  </span>
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...threadData.threads]
                              .sort((a, b) => {
                                if (sortBy === 'cpu') {
                                  const aVal = parseFloat(a.cpuTime.replace(/[^\d.]/g, '')) || 0
                                  const bVal = parseFloat(b.cpuTime.replace(/[^\d.]/g, '')) || 0
                                  return sortDir === 'desc' ? bVal - aVal : aVal - bVal
                                }
                                if (sortBy === 'user') {
                                  const aVal = parseFloat(a.userTime.replace(/[^\d.]/g, '')) || 0
                                  const bVal = parseFloat(b.userTime.replace(/[^\d.]/g, '')) || 0
                                  return sortDir === 'desc' ? bVal - aVal : aVal - bVal
                                }
                                return 0
                              })
                              .map((thread) => {
                                const isExpanded = expanded.has(thread.id)
                                return (
                                  <>
                                    <tr key={thread.id} className="border-b hover:bg-muted/50">
                                      <td className="p-3 align-top">
                                        <button
                                          className="focus:outline-none"
                                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                          onClick={() => {
                                            setExpanded(prev => {
                                              const set = new Set(prev)
                                              if (set.has(thread.id)) set.delete(thread.id)
                                              else set.add(thread.id)
                                              return new Set(set)
                                            })
                                          }}
                                        >
                                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                      </td>
                                      <td className="p-3 align-top font-mono text-xs text-blue-700 dark:text-blue-300">{thread.name}</td>
                                      <td className="p-3 align-top font-mono text-xs">{thread.cpuTime}</td>
                                      <td className="p-3 align-top font-mono text-xs">{thread.userTime}</td>
                                    </tr>
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={4} className="bg-muted/30 p-4">
                                          <div className="mb-2 text-xs">
                                            <span className="font-semibold">State:</span> {thread.state}
                                            {thread.lock && <><span className="font-semibold ml-2">Lock:</span> <span className="font-mono">{thread.lock}</span></>}
                                            {thread["lock-waiting"] && (
                                              <><span className="font-semibold ml-2">Waiting for:</span> <span className="font-mono">{thread["lock-waiting"].name} ({thread["lock-waiting"].owner || "unknown"})</span></>
                                            )}
                                          </div>
                                          <div className="bg-muted rounded p-2 overflow-x-auto">
                                            <pre className="text-xs leading-tight font-mono text-gray-800 dark:text-gray-200">
                                              {thread.stackTrace.map((line, idx) => (
                                                <div key={idx}>{line}</div>
                                              ))}
                                            </pre>
                                          </div>
                                          {thread["synchronizers-locked"] && thread["synchronizers-locked"].length > 0 && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                              <span className="font-semibold">Synchronizers locked:</span> {thread["synchronizers-locked"].join(", ")}
                                            </div>
                                          )}
                                          {thread["monitors-locked"] && thread["monitors-locked"].length > 0 && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                              <span className="font-semibold">Monitors locked:</span> {thread["monitors-locked"].join(", ")}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                )
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DatacenterThreadDump
