import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MetricCard } from "./MetricCard"
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Clock, 
  RefreshCw, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  Database
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolrSystemInfo {
  responseHeader: {
    status: number
    QTime: number
  }
  mode: string
  zkHost?: string
  solr_home: string
  core_root?: string
  lucene: {
    "solr-spec-version": string
    "solr-impl-version": string
    "lucene-spec-version": string
    "lucene-impl-version": string
  }
  jvm: {
    version: string
    name: string
    spec?: {
      vendor: string
      name: string
      version: string
    }
    jre?: {
      vendor: string
      version: string
    }
    vm?: {
      vendor: string
      name: string
      version: string
    }
    processors: number
    memory: {
      free: string
      total: string
      max: string
      used: string
      raw: {
        free: number
        total: number
        max: number
        used: number
        "used%": number
      }
    }
    jmx: {
      classpath?: string
      commandLineArgs: string[]
      startTime: string
      upTimeMS: number
    }
  }
  security: {
    tls: boolean
  }
  system: {
    name: string
    arch: string
    availableProcessors: number
    systemLoadAverage: number
    version?: string
    committedVirtualMemorySize?: number
    cpuLoad?: number
    freeMemorySize?: number
    freePhysicalMemorySize: number
    freeSwapSpaceSize: number
    processCpuLoad?: number
    processCpuTime?: number
    systemCpuLoad?: number
    totalMemorySize?: number
    totalPhysicalMemorySize: number
    totalSwapSpaceSize: number
    maxFileDescriptorCount: number
    openFileDescriptorCount: number
  }
  node: string
}

export function SystemOverview() {
  const [systemInfo, setSystemInfo] = useState<SolrSystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { toast } = useToast()

  const fetchSystemInfo = async () => {
    try {
      setLoading(true)
      setConnectionError(null)
      
      // Call the backend API
      const response = await fetch('http://localhost:3001/api/solr/system/info')
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`)
      }
      
      const data: SolrSystemInfo = await response.json()
      
      setSystemInfo(data)
      setLastRefresh(new Date())
      
      toast({
        title: "System information updated",
        description: `Connected to ${data.node} successfully.`,
      })
    } catch (error) {
      console.error('Error fetching system info:', error)
      
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to backend server. Please check if the backend is running on port 3001."
        } else if (error.message.includes('HTTP 503')) {
          errorMessage = "Backend cannot connect to Solr. Please check if Solr is running on port 8983."
        } else {
          errorMessage = error.message
        }
      }
      
      setConnectionError(errorMessage)
      toast({
        title: "Failed to fetch system information",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchSystemInfo()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  if (!systemInfo && !connectionError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Overview</h2>
          <Button onClick={fetchSystemInfo} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (connectionError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">System Overview</h2>
            <p className="text-muted-foreground">
              Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
            </p>
          </div>
          <Button onClick={fetchSystemInfo} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
        
        <Card className="bg-admin-warning/5 border-admin-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-admin-warning">
              <AlertTriangle className="w-5 h-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-4">{connectionError}</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Check if the backend server is running on port 3001</p>
              <p>• Verify that Solr is accessible at http://localhost:8983</p>
              <p>• Ensure there are no network connectivity issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatUptime = (uptimeMs: number) => {
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const physicalMemoryUsage = ((systemInfo.system.totalPhysicalMemorySize - systemInfo.system.freePhysicalMemorySize) / systemInfo.system.totalPhysicalMemorySize) * 100
  const swapUsage = ((systemInfo.system.totalSwapSpaceSize - systemInfo.system.freeSwapSpaceSize) / systemInfo.system.totalSwapSpaceSize) * 100
  const fdUsage = (systemInfo.system.openFileDescriptorCount / systemInfo.system.maxFileDescriptorCount) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">System Overview</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">
              Last updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
            </p>
            {connectionError && (
              <Badge variant="destructive" className="text-xs">
                Connection Error
              </Badge>
            )}
            {systemInfo && !connectionError && (
              <Badge variant="secondary" className="text-xs bg-admin-success/10 text-admin-success">
                Connected to {systemInfo.node}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={fetchSystemInfo} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Node and Instance Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-admin-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Instance Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Node</p>
                <p className="font-medium text-foreground">{systemInfo.node}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mode</p>
                <Badge variant="secondary" className="bg-admin-accent/10 text-admin-accent">
                  {systemInfo.mode}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-medium text-foreground">
                  {formatUptime(systemInfo.jvm.jmx.upTimeMS)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solr Home</p>
                <p className="font-mono text-sm text-foreground break-all">
                  {systemInfo.solr_home}
                </p>
              </div>
              {systemInfo.zkHost && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">ZooKeeper Hosts</p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {systemInfo.zkHost}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-admin-warning" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {systemInfo.security.tls ? (
                <CheckCircle2 className="w-4 h-4 text-admin-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-admin-warning" />
              )}
              <span className="text-sm">
                TLS: {systemInfo.security.tls ? "Enabled" : "Disabled"}
              </span>
            </div>
            {!systemInfo.security.tls && (
              <div className="p-3 bg-admin-warning/10 border border-admin-warning/20 rounded-lg">
                <p className="text-xs text-admin-warning font-medium">
                  ⚠️ Security not enabled for this server
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="JVM Memory"
          value={systemInfo.jvm.memory.used.split(' (%')[0]}
          description={`Max: ${systemInfo.jvm.memory.max}`}
          percentage={systemInfo.jvm.memory.raw["used%"]}
          icon={<Cpu className="w-4 h-4" />}
          variant={systemInfo.jvm.memory.raw["used%"] > 80 ? "warning" : "default"}
        />
        
        <MetricCard
          title="Physical Memory"
          value={formatBytes(systemInfo.system.totalPhysicalMemorySize - systemInfo.system.freePhysicalMemorySize)}
          description={`Total: ${formatBytes(systemInfo.system.totalPhysicalMemorySize)}`}
          percentage={physicalMemoryUsage}
          icon={<HardDrive className="w-4 h-4" />}
          variant={physicalMemoryUsage > 85 ? "warning" : "default"}
        />

        <MetricCard
          title="File Descriptors"
          value={systemInfo.system.openFileDescriptorCount.toLocaleString()}
          description={`Max: ${systemInfo.system.maxFileDescriptorCount.toLocaleString()}`}
          percentage={fdUsage}
          icon={<Database className="w-4 h-4" />}
          variant={fdUsage > 80 ? "warning" : "default"}
        />

        <MetricCard
          title="System Load"
          value={systemInfo.system.systemLoadAverage.toFixed(2)}
          description={`Processors: ${systemInfo.system.availableProcessors}`}
          icon={<Clock className="w-4 h-4" />}
          variant={systemInfo.system.systemLoadAverage > systemInfo.system.availableProcessors ? "warning" : "default"}
        />
      </div>

      {/* Version Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle>Solr & Lucene Versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Solr Version</p>
              <p className="font-mono text-sm text-foreground">
                {systemInfo.lucene["solr-spec-version"]}
              </p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {systemInfo.lucene["solr-impl-version"]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucene Version</p>
              <p className="font-mono text-sm text-foreground">
                {systemInfo.lucene["lucene-spec-version"]}
              </p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {systemInfo.lucene["lucene-impl-version"]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle>JVM Runtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Runtime</p>
              <p className="font-mono text-sm text-foreground">
                {systemInfo.jvm.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-mono text-sm text-foreground">
                {systemInfo.jvm.version}
              </p>
            </div>
            {systemInfo.jvm.spec && (
              <div>
                <p className="text-sm text-muted-foreground">Specification</p>
                <p className="font-mono text-xs text-foreground">
                  {systemInfo.jvm.spec.name} {systemInfo.jvm.spec.version}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  by {systemInfo.jvm.spec.vendor}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle>Operating System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">OS</p>
              <p className="font-medium text-foreground">{systemInfo.system.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Architecture</p>
              <p className="font-medium text-foreground">{systemInfo.system.arch}</p>
            </div>
            {systemInfo.system.version && (
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-mono text-xs text-foreground">{systemInfo.system.version}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle>Memory Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Physical Memory</p>
              <p className="font-medium text-foreground">
                {formatBytes(systemInfo.system.totalPhysicalMemorySize)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Memory</p>
              <p className="font-medium text-foreground">
                {formatBytes(systemInfo.system.freePhysicalMemorySize)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Swap Space</p>
              <p className="font-medium text-foreground">
                {formatBytes(systemInfo.system.totalSwapSpaceSize)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">CPU Cores</p>
              <p className="font-medium text-foreground">{systemInfo.system.availableProcessors}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Load</p>
              <p className="font-medium text-foreground">
                {systemInfo.system.systemLoadAverage.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">JVM Processors</p>
              <p className="font-medium text-foreground">{systemInfo.jvm.processors}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}