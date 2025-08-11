import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  ShieldX, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolrNode {
  name: string
  host: string
  port: number
}

interface SecurityInfo {
  authentication?: {
    enabled: boolean
    scheme?: string
    realm?: string
  }
  authorization?: {
    enabled: boolean
    class?: string
  }
  ssl?: {
    enabled: boolean
    clientAuth?: boolean
    keyStore?: string
    trustStore?: string
  }
}

interface DatacenterSecurity {
  name: string
  solrNodes: Array<SolrNode & { security?: SecurityInfo }>
  zkHosts?: string[]
}

const DatacenterSecurity = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [datacenterSecurity, setDatacenterSecurity] = useState<DatacenterSecurity | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchSecurityInfo = async () => {
    try {
      setLoading(true)

      // Fetch nodes and ZK info
      const [nodesResponse, zkResponse] = await Promise.allSettled([
        fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || 'APAC Singapore')}&loadAll=true`),
        fetch(`http://localhost:3001/api/solr/cluster/zookeeper${datacenter ? `?datacenter=${encodeURIComponent(datacenter)}` : ''}`)
      ])

      let zkHosts: string[] = []
      
      // Get ZK hosts for security command examples
      if (zkResponse.status === 'fulfilled' && zkResponse.value.ok) {
        const zkData = await zkResponse.value.json()
        const dcZkInfo = zkData.datacenters?.[datacenter || 'APAC Singapore']
        
        if (dcZkInfo?.zkHosts) {
          zkHosts = dcZkInfo.zkHosts.map((host: any) => 
            `${host.hostname || host.host?.split(':')[0] || 'localhost'}:${host.port || host.clientPort || 2181}`
          )
        }
      }

      // Fetch only online nodes
      if (nodesResponse.status !== 'fulfilled' || !nodesResponse.value.ok) {
        throw new Error(`Nodes API returned ${nodesResponse.value?.status || 'error'}`)
      }

      const nodesData = await nodesResponse.value.json()
      
      // Process only online nodes for security info
      const onlineNodes = (nodesData.nodes || []).filter((node: any) => node.status === 'online')
      
      const securityPromises = onlineNodes.map(async (node: any) => {
        const baseNode: SolrNode = {
          name: node.name,
          host: node.host,
          port: node.port
        }

        try {
          const securityResponse = await fetch(`http://localhost:3001/api/solr/admin/security/${node.name}`)
          if (securityResponse.ok) {
            const securityData = await securityResponse.json()
            return {
              ...baseNode,
              security: securityData.security || {}
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch security info for ${node.name}:`, error)
        }

        return baseNode
      })

      const solrNodes = await Promise.all(securityPromises)

      setDatacenterSecurity({
        name: datacenter || 'Unknown',
        solrNodes,
        zkHosts
      })

      toast({
        title: "Security information loaded",
        description: `Loaded security data for ${solrNodes.length} nodes`,
      })

    } catch (error) {
      console.error('Error fetching security info:', error)
      toast({
        title: "Failed to load security information",
        description: "Could not fetch security data from the cluster",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleShowSecret = (nodeKey: string) => {
    const newShowSecrets = new Set(showSecrets)
    if (newShowSecrets.has(nodeKey)) {
      newShowSecrets.delete(nodeKey)
    } else {
      newShowSecrets.add(nodeKey)
    }
    setShowSecrets(newShowSecrets)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  useEffect(() => {
    fetchSecurityInfo()
  }, [datacenter])

  // Check if any security is enabled across all nodes
  const isAnySecurityEnabled = datacenterSecurity?.solrNodes.some(node => 
    node.security?.authentication?.enabled || 
    node.security?.authorization?.enabled || 
    node.security?.ssl?.enabled
  ) || false

  // Generate ZK connection string for commands
  const zkConnectionString = datacenterSecurity?.zkHosts?.length 
    ? datacenterSecurity.zkHosts.join(',')
    : 'localhost:2181'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Security</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Security</p>
            </div>
          </div>
          
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!datacenterSecurity || datacenterSecurity.solrNodes.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Security</h1>
              <p className="text-muted-foreground">{datacenter} Datacenter Security</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">No Online Nodes Available</h3>
                  <p className="text-muted-foreground">No online nodes found to check security configuration.</p>
                </div>
                <Button onClick={fetchSecurityInfo} variant="outline">
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
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Security</h1>
              <p className="text-muted-foreground">{datacenterSecurity.name} Datacenter Security</p>
            </div>
          </div>
          
          <Button onClick={fetchSecurityInfo} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Security Warning Card - Show when security is disabled */}
        {!isAnySecurityEnabled && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5" />
                WARNING: Security is not enabled for this server!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-red-600 dark:text-red-400">
                <p className="mb-3">
                  Use the <code className="bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded font-mono text-xs">bin/solr auth</code> command-line tool to enable security and then reload this panel.
                </p>
                <p className="mb-3">
                  For more information, see: <a href="https://solr.apache.org/guide/solr/latest/deployment-guide/authentication-and-authorization-plugins.html" target="_blank" rel="noopener noreferrer" className="text-red-700 dark:text-red-300 underline hover:no-underline inline-flex items-center gap-1">
                    Using security.json with Solr <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Example usage of bin/solr auth to enable basic authentication:
                </h4>
                
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                  <code className="text-xs font-mono text-red-800 dark:text-red-200 block whitespace-pre-wrap">
                    {`bin/solr auth enable --type=basicAuth --prompt=true -z${zkConnectionString}`}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-6 px-2 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                    onClick={() => copyToClipboard(`bin/solr auth enable --type=basicAuth --prompt=true -z${zkConnectionString}`, 'Authentication command')}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Command
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Other authentication options:</p>
                  
                  <div className="space-y-2">
                    <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded text-xs">
                      <div className="text-red-700 dark:text-red-300 font-medium mb-1">JWT Authentication:</div>
                      <code className="text-red-800 dark:text-red-200 block">
                        {`bin/solr auth enable --type jwt -z ${zkConnectionString}`}
                      </code>
                    </div>
                    
                    <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded text-xs">
                      <div className="text-red-700 dark:text-red-300 font-medium mb-1">Kerberos Authentication:</div>
                      <code className="text-red-800 dark:text-red-200 block">
                        {`bin/solr auth enable --type kerberos -z ${zkConnectionString}`}
                      </code>
                    </div>
                  </div>
                </div>

                {datacenterSecurity.zkHosts && datacenterSecurity.zkHosts.length > 0 && (
                  <div className="border-t border-red-200 dark:border-red-700 pt-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>ZooKeeper Hosts for this datacenter:</strong> {datacenterSecurity.zkHosts.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Details Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="authorization">Authorization</TabsTrigger>
            <TabsTrigger value="ssl">SSL/TLS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Node Security Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left p-3">Node</th>
                      <th className="text-left p-3">Authentication</th>
                      <th className="text-left p-3">Authorization</th>
                      <th className="text-left p-3">SSL/TLS</th>
                      <th className="text-left p-3">Security Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datacenterSecurity.solrNodes.map((node) => {
                      const authEnabled = node.security?.authentication?.enabled || false
                      const authzEnabled = node.security?.authorization?.enabled || false
                      const sslEnabled = node.security?.ssl?.enabled || false
                      const securityScore = [authEnabled, authzEnabled, sslEnabled].filter(Boolean).length
                      
                      return (
                        <tr key={node.name} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <span className="font-medium">{node.name}</span>
                            <div className="text-xs text-muted-foreground">{node.host}:{node.port}</div>
                          </td>
                          <td className="p-3">
                            {authEnabled ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                ENABLED
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <ShieldX className="w-3 h-3 mr-1" />
                                DISABLED
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {authzEnabled ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                ENABLED
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <ShieldX className="w-3 h-3 mr-1" />
                                DISABLED
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {sslEnabled ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                ENABLED
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <ShieldX className="w-3 h-3 mr-1" />
                                DISABLED
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={securityScore === 3 ? 'default' : securityScore > 0 ? 'secondary' : 'destructive'}>
                              {securityScore}/3
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Authentication Configuration</h3>
              <div className="space-y-4">
                {datacenterSecurity.solrNodes.map((node) => (
                  <div key={node.name} className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold mb-3">{node.name} Authentication</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className="ml-2" variant={node.security?.authentication?.enabled ? 'default' : 'secondary'}>
                          {node.security?.authentication?.enabled ? 'ENABLED' : 'DISABLED'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Scheme:</span>
                        <span className="ml-2 text-sm font-mono">{node.security?.authentication?.scheme || 'none'}</span>
                      </div>
                      {node.security?.authentication?.realm && (
                        <div>
                          <span className="text-sm font-medium">Realm:</span>
                          <span className="ml-2 text-sm font-mono">{node.security.authentication.realm}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="authorization" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Authorization Configuration</h3>
              <div className="space-y-4">
                {datacenterSecurity.solrNodes.map((node) => (
                  <div key={node.name} className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold mb-3">{node.name} Authorization</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className="ml-2" variant={node.security?.authorization?.enabled ? 'default' : 'secondary'}>
                          {node.security?.authorization?.enabled ? 'ENABLED' : 'DISABLED'}
                        </Badge>
                      </div>
                      {node.security?.authorization?.class && (
                        <div>
                          <span className="text-sm font-medium">Class:</span>
                          <span className="ml-2 text-sm font-mono">{node.security.authorization.class}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ssl" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">SSL/TLS Configuration</h3>
              <div className="space-y-4">
                {datacenterSecurity.solrNodes.map((node) => {
                  const nodeKey = `${node.host}:${node.port}`
                  const showNodeSecrets = showSecrets.has(nodeKey)
                  
                  return (
                    <div key={node.name} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{node.name} SSL Configuration</h4>
                        {(node.security?.ssl?.keyStore || node.security?.ssl?.trustStore) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleShowSecret(nodeKey)}
                          >
                            {showNodeSecrets ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide Secrets
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Show Secrets
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">SSL Enabled:</span>
                          <Badge className="ml-2" variant={node.security?.ssl?.enabled ? 'default' : 'secondary'}>
                            {node.security?.ssl?.enabled ? 'YES' : 'NO'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Client Auth:</span>
                          <Badge className="ml-2" variant={node.security?.ssl?.clientAuth ? 'default' : 'secondary'}>
                            {node.security?.ssl?.clientAuth ? 'REQUIRED' : 'NOT REQUIRED'}
                          </Badge>
                        </div>
                        {node.security?.ssl?.keyStore && (
                          <div className="col-span-2">
                            <span className="text-sm font-medium">KeyStore:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {showNodeSecrets ? node.security.ssl.keyStore : '***hidden***'}
                              </span>
                              {showNodeSecrets && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(node.security!.ssl!.keyStore!, 'KeyStore path')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        {node.security?.ssl?.trustStore && (
                          <div className="col-span-2">
                            <span className="text-sm font-medium">TrustStore:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {showNodeSecrets ? node.security.ssl.trustStore : '***hidden***'}
                              </span>
                              {showNodeSecrets && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(node.security!.ssl!.trustStore!, 'TrustStore path')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default DatacenterSecurity
