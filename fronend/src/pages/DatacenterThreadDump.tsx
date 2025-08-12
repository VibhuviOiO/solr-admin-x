
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Activity, RefreshCw, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react"
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
  const [threads, setThreads] = useState<ThreadDumpEntry[]>([])
  const [threadCount, setThreadCount] = useState<{ current: number; peak: number; daemon: number } | null>(null)
  const [expandedAll, setExpandedAll] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { toast } = useToast()

  // For demo, pick the first online node in the datacenter (could be improved to let user pick)
  const [node, setNode] = useState<string | null>(null)

  // Fetch nodes for datacenter, then fetch thread dump for first online node
  useEffect(() => {
    const fetchNodeAndThreads = async () => {
      setLoading(true)
      setError(null)
      setThreads([])
      setThreadCount(null)
      setNode(null)
      try {
        // Get nodes for datacenter
        const nodesRes = await fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || "")}&loadAll=true`)
        if (!nodesRes.ok) throw new Error("Failed to fetch nodes")
        const nodesData = await nodesRes.json()
        const onlineNodes = nodesData.nodes?.filter((n: any) => n.status === "online") || []
        if (!onlineNodes.length) throw new Error("No online nodes in datacenter")
        setNode(onlineNodes[0].name)

        // Fetch thread dump for first online node
        const threadRes = await fetch(`http://localhost:3001/api/info/threads?node=${encodeURIComponent(onlineNodes[0].name)}`)
        if (!threadRes.ok) throw new Error("Failed to fetch thread dump")
        const threadData: InfoThreadsResponse = await threadRes.json()
        setThreadCount(threadData.system.threadCount)
        // Only keep ThreadDumpEntry objects (ignore string lines)
        const entries = (threadData.system.threadDump || []).filter((t: any) => typeof t === "object") as ThreadDumpEntry[]
        setThreads(entries)
      } catch (err: any) {
        setError(err.message || "Unknown error")
        toast({
          title: "Failed to load thread dump",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchNodeAndThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datacenter])

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    setThreads([])
    setThreadCount(null)
    setNode(null)
    setTimeout(() => {
      // re-run effect
      window.location.reload()
    }, 200)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Thread Dump</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
            </div>
          </div>
          <Card className="animate-pulse">
            <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-32 bg-muted rounded"></div></CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Thread Dump</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-16">
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Thread Dump</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Thread Analysis</p>
              {node && <p className="text-xs text-muted-foreground mt-1">Node: <span className="font-mono text-blue-700 dark:text-blue-300">{node}</span></p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                if (expandedAll) {
                  setExpandedItems([])
                  setExpandedAll(false)
                } else {
                  setExpandedItems(threads.map(t => t.id.toString()))
                  setExpandedAll(true)
                }
              }}
              variant="ghost"
            >
              {expandedAll ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              {expandedAll ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        </div>

        {/* Thread Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Thread Summary</CardTitle>
            <CardDescription>
              {threadCount && (
                <div className="flex gap-6 text-sm mt-2">
                  <span>Current: <span className="font-semibold">{threadCount.current}</span></span>
                  <span>Peak: <span className="font-semibold">{threadCount.peak}</span></span>
                  <span>Daemon: <span className="font-semibold">{threadCount.daemon}</span></span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Thread Dump Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Threads ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {threads.length === 0 ? (
              <div className="text-muted-foreground">No thread dump data available.</div>
            ) : (
              <Accordion
                type="multiple"
                value={expandedAll ? threads.map(t => t.id.toString()) : expandedItems}
                onValueChange={v => {
                  setExpandedItems(v as string[])
                  setExpandedAll((v as string[]).length === threads.length)
                }}
              >
                {threads.map((thread) => (
                  <AccordionItem key={thread.id} value={thread.id.toString()}>
                    <AccordionTrigger>
                      <div className="flex flex-col text-left">
                        <span className="font-mono text-blue-700 dark:text-blue-300 text-xs">{thread.name}</span>
                        <span className="text-xs text-muted-foreground">{thread.state}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-2">
                        <span className="font-semibold">CPU Time:</span> <span className="font-mono text-xs">{thread.cpuTime}</span> &nbsp;|
                        <span className="font-semibold ml-2">User Time:</span> <span className="font-mono text-xs">{thread.userTime}</span>
                        {thread.lock && <><span className="font-semibold ml-2">Lock:</span> <span className="font-mono text-xs">{thread.lock}</span></>}
                        {thread["lock-waiting"] && (
                          <><span className="font-semibold ml-2">Waiting for:</span> <span className="font-mono text-xs">{thread["lock-waiting"].name} ({thread["lock-waiting"].owner || "unknown"})</span></>
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
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DatacenterThreadDump
