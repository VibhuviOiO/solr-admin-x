import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, Legend, LabelList } from 'recharts';
import {
  BarChart3,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"



const formatBytes = (bytes: number): string => {
  if (!bytes || isNaN(bytes)) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (ms: number): string => {
  if (!ms || isNaN(ms)) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

interface SolrSystemInfo {
  id: string;
  name: string;
  url: string;
  datacenter: string;
  status: string;
  systemInfo: any;
}

const DatacenterDashboard = () => {
  // For JVM details expansion
  const [showJvmDetails, setShowJvmDetails] = useState(false);
  const [sortJvmArgs, setSortJvmArgs] = useState(true);
  const { datacenter } = useParams<{ datacenter: string }>()
  const [nodes, setNodes] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [solrInfo, setSolrInfo] = useState<SolrSystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const { toast } = useToast()

  // Fetch nodes for datacenter
  useEffect(() => {
    const fetchNodes = async () => {
      setLoading(true)
      setError(null)
      setNodes([])
      try {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const nodesRes = await fetch(`${apiBase}/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || "")}&loadAll=true`)
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

  // Fetch Solr info for selected node
  useEffect(() => {
    if (!selectedNode) return
    setSolrInfo(null)
    setLoading(true)
    setError(null)
    const fetchSolrInfo = async () => {
      try {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiBase}/solr/system/info?node=${encodeURIComponent(selectedNode)}`)
        if (!res.ok) throw new Error('Failed to fetch Solr node info')
        const data = await res.json()
        setSolrInfo(data)
        setLastRefresh(new Date())
        toast({
          title: "Node info updated",
          description: `Loaded Solr node info for ${selectedNode}`,
        })
      } catch (error: any) {
        setError(error.message || "Unknown error")
        toast({
          title: "Failed to fetch node info",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSolrInfo()
  }, [selectedNode])

  const handleRefresh = () => {
    if (!selectedNode) return
    setSolrInfo(null)
    setLoading(true)
    setError(null)
    const fetchSolrInfo = async () => {
      try {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiBase}/solr/system/info?node=${encodeURIComponent(selectedNode)}`)
        if (!res.ok) throw new Error('Failed to fetch Solr node info')
        const data = await res.json()
        setSolrInfo(data)
        setLastRefresh(new Date())
        toast({
          title: "Node info updated",
          description: `Loaded Solr node info for ${selectedNode}`,
        })
      } catch (error: any) {
        setError(error.message || "Unknown error")
        toast({
          title: "Failed to fetch node info",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSolrInfo()
  }

  // Find the selected node object for info display
  const selectedNodeObj = nodes.find((n) => n.name === selectedNode)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Datacenter Dashboard</h1>
                <p className="text-muted-foreground">{datacenter} Node Overview</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Datacenter Dashboard</h1>
                <p className="text-muted-foreground">{datacenter} Node Overview</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">Failed to Load Node Information</h3>
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

  if (!solrInfo || !selectedNodeObj) {
    return null
  }

  // Prepare data for charts
  const sys = solrInfo.systemInfo?.system
  const jvm = solrInfo.systemInfo?.jvm
  const lucene = solrInfo.systemInfo?.lucene

  // Bar chart data
  const memoryBarData = sys ? [{
    label: 'Physical Memory',
    Used: sys.totalPhysicalMemorySize - sys.freePhysicalMemorySize,
    Free: sys.freePhysicalMemorySize,
    Total: sys.totalPhysicalMemorySize
  }] : [];
  const swapBarData = sys && sys.totalSwapSpaceSize > 0 ? [{
    label: 'Swap',
    Used: sys.totalSwapSpaceSize - sys.freeSwapSpaceSize,
    Free: sys.freeSwapSpaceSize,
    Total: sys.totalSwapSpaceSize
  }] : [];
  const jvmBarData = jvm ? [{
    label: 'JVM Heap',
    Used: jvm.memory.raw.used,
    Free: jvm.memory.raw.max - jvm.memory.raw.used,
    Total: jvm.memory.raw.max
  }] : [];
  const cpuBarData = sys ? [{
    label: 'CPU Load',
    Load: sys.systemLoadAverage,
    Idle: Math.max(1 - sys.systemLoadAverage, 0)
  }] : [];
  const COLORS = ['#2563eb', '#e5e7eb', '#f59e42', '#10b981'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BarChart3 className="w-8 h-8 text-primary shrink-0" />
            <div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight truncate">{selectedNodeObj.name} Dashboard</h1>
              <span className="text-sm text-muted-foreground truncate">
                {selectedNodeObj.host}:{selectedNodeObj.port}
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-between md:justify-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground mr-1">Select Node:</span>
              {nodes.length > 0 && (
                <Tabs value={selectedNode || undefined} onValueChange={setSelectedNode}>
                  <TabsList className="flex bg-transparent shadow-none p-0 gap-1">
                    {nodes.map((node) => (
                      <TabsTrigger
                        key={node.name}
                        value={node.name}
                        className={
                          `h-9 px-4 text-sm font-mono rounded-md border border-border transition-colors ` +
                          `data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:border-primary/80 ` +
                          `data-[state=inactive]:bg-background data-[state=inactive]:text-primary data-[state=inactive]:border-primary/40 ` +
                          `hover:bg-primary/10 hover:text-primary`
                        }
                      >
                        {node.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
            <Button onClick={handleRefresh} variant="outline" className="h-9 px-4 text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Node Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="/solr-ico.png" alt="Solr" className="w-5 h-5" />
              Node Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 items-center">
              <Badge variant={solrInfo.status === 'online' ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                {solrInfo.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">{solrInfo.url}</span>
              {lucene && (
                <>
                  <Badge variant="secondary" className="text-xs font-mono bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                    Solr {lucene['solr-spec-version']}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-mono bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    Lucene {lucene['lucene-spec-version']}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* JVM Details & Graphs (Bar style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>JVM & System Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* JVM Heap Bar */}
                <div>
                  <div className="font-medium mb-1">JVM Heap</div>
                  <ResponsiveContainer width="100%" height={40}>
                    <BarChart data={jvmBarData} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" domain={[0, jvmBarData[0]?.Total || 1]} hide />
                      <YAxis type="category" dataKey="label" width={80} />
                      <Bar dataKey="Used" stackId="a" fill="#2563eb">
                        <LabelList dataKey="Used" position="inside" formatter={formatBytes} />
                      </Bar>
                      <Bar dataKey="Free" stackId="a" fill="#e5e7eb">
                        <LabelList dataKey="Free" position="inside" formatter={formatBytes} />
                      </Bar>
                      <RechartsTooltip formatter={formatBytes} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground mt-1">
                    Used: {jvm ? formatBytes(jvm.memory.raw.used) : '-'} / Max: {jvm ? formatBytes(jvm.memory.raw.max) : '-'}
                  </div>
                </div>
                {/* System Memory Bar */}
                <div>
                  <div className="font-medium mb-1">Physical Memory</div>
                  <ResponsiveContainer width="100%" height={40}>
                    <BarChart data={memoryBarData} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" domain={[0, memoryBarData[0]?.Total || 1]} hide />
                      <YAxis type="category" dataKey="label" width={80} />
                      <Bar dataKey="Used" stackId="a" fill="#10b981">
                        <LabelList dataKey="Used" position="inside" formatter={formatBytes} />
                      </Bar>
                      <Bar dataKey="Free" stackId="a" fill="#e5e7eb">
                        <LabelList dataKey="Free" position="inside" formatter={formatBytes} />
                      </Bar>
                      <RechartsTooltip formatter={formatBytes} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground mt-1">
                    Used: {sys ? formatBytes(sys.totalPhysicalMemorySize - sys.freePhysicalMemorySize) : '-'} / Total: {sys ? formatBytes(sys.totalPhysicalMemorySize) : '-'}
                  </div>
                </div>
                {/* Swap Bar */}
                {swapBarData.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Swap</div>
                    <ResponsiveContainer width="100%" height={40}>
                      <BarChart data={swapBarData} layout="vertical" margin={{ left: 40, right: 20 }}>
                        <XAxis type="number" domain={[0, swapBarData[0]?.Total || 1]} hide />
                        <YAxis type="category" dataKey="label" width={80} />
                        <Bar dataKey="Used" stackId="a" fill="#f59e42">
                          <LabelList dataKey="Used" position="inside" formatter={formatBytes} />
                        </Bar>
                        <Bar dataKey="Free" stackId="a" fill="#e5e7eb">
                          <LabelList dataKey="Free" position="inside" formatter={formatBytes} />
                        </Bar>
                        <RechartsTooltip formatter={formatBytes} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="text-xs text-muted-foreground mt-1">
                      Used: {sys ? formatBytes(sys.totalSwapSpaceSize - sys.freeSwapSpaceSize) : '-'} / Total: {sys ? formatBytes(sys.totalSwapSpaceSize) : '-'}
                    </div>
                  </div>
                )}
                {/* CPU Load Bar */}
                <div>
                  <div className="font-medium mb-1">CPU Load</div>
                  <ResponsiveContainer width="100%" height={40}>
                    <BarChart data={cpuBarData} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" domain={[0, 1]} hide />
                      <YAxis type="category" dataKey="label" width={80} />
                      <Bar dataKey="Load" stackId="a" fill="#6366f1">
                        <LabelList dataKey="Load" position="inside" formatter={(v: number) => (v * 100).toFixed(1) + '%'} />
                      </Bar>
                      <Bar dataKey="Idle" stackId="a" fill="#e5e7eb">
                        <LabelList dataKey="Idle" position="inside" formatter={(v: number) => (v * 100).toFixed(1) + '%'} />
                      </Bar>
                      <RechartsTooltip formatter={(v: number) => (v * 100).toFixed(1) + '%'} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground mt-1">
                    Load Avg: {sys ? sys.systemLoadAverage?.toFixed(2) : '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* JVM Info Badges */}
          <Card>
            <CardHeader>
              <CardTitle>JVM Info</CardTitle>
            </CardHeader>
            <CardContent>
              {jvm ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">JVM:</span>
                    <span>{jvm.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Version:</span>
                    <span>{jvm.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Processors:</span>
                    <span>{jvm.processors}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Uptime:</span>
                    <span>{formatUptime(jvm.jmx?.upTimeMS)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Memory Used:</span>
                    <span>{formatBytes(jvm.memory?.raw?.used)} / {formatBytes(jvm.memory?.raw?.max)} ({jvm.memory?.raw?.['used%']?.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Args:</span>
                    <span className="truncate max-w-xs">{jvm.jmx?.commandLineArgs?.slice(0, 3).join(' ') || '-'}</span>
                  </div>
                </div>
              ) : <span className="text-muted-foreground">No JVM info available</span>}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DatacenterDashboard
