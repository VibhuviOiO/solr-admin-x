import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coffee, RefreshCw, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface SolrNode {
  name: string
  host: string
  port: number
  status: 'online' | 'offline'
}

interface NodeProperties {
  node: string
  properties: Record<string, string>
  timestamp: string
}

const DatacenterJavaProperties = () => {
  const { datacenter } = useParams<{ datacenter: string }>()
  const [nodes, setNodes] = useState<SolrNode[]>([])
  const [nodeProperties, setNodeProperties] = useState<Record<string, NodeProperties>>({})
  const [loading, setLoading] = useState(true)
  const [sortProperties, setSortProperties] = useState<boolean>(true)
  const { toast } = useToast()

  const fetchNodesAndProperties = async () => {
    try {
      setLoading(true)
      
      // Use the same approach as DatacenterDashboard - fetch from cluster/nodes with datacenter filter
      const nodesResponse = await fetch(`http://localhost:3001/api/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || 'APAC Singapore')}&loadAll=true`)
      if (!nodesResponse.ok) {
        throw new Error(`API returned ${nodesResponse.status}`)
      }
      
      const nodesData = await nodesResponse.json()
      console.log('Nodes API response:', nodesData)
      
      // Transform nodes data similar to DatacenterDashboard
      const solrNodes: SolrNode[] = nodesData.nodes?.map((node: any) => ({
        name: node.name,
        host: node.host,
        port: node.port,
        status: node.status === 'online' ? 'online' : 'offline'
      })) || []
      
      setNodes(solrNodes)

      // Fetch properties for all online nodes
      const onlineNodes = solrNodes.filter(node => node.status === 'online')
      const propertiesPromises = onlineNodes.map(async (node) => {
        try {
          const response = await fetch(`http://localhost:3001/api/solr/admin/properties/${node.name}`)
          if (!response.ok) {
            throw new Error(`Properties API returned ${response.status} for ${node.name}`)
          }
          const data = await response.json()
          return { nodeId: node.name, data }
        } catch (error) {
          console.error(`Error fetching properties for ${node.name}:`, error)
          return null
        }
      })

      const propertiesResults = await Promise.all(propertiesPromises)
      const propertiesMap: Record<string, NodeProperties> = {}
      
      propertiesResults.forEach(result => {
        if (result) {
          propertiesMap[result.nodeId] = result.data
        }
      })

      setNodeProperties(propertiesMap)
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded properties for ${Object.keys(propertiesMap).length} of ${onlineNodes.length} nodes`,
      })
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Failed to load data",
        description: "Could not fetch nodes and properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodesAndProperties()
  }, [datacenter])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Coffee className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Java Properties</h1>
              <p className="text-muted-foreground"> Datacenter Java Configuration</p>
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

  const onlineNodes = nodes.filter(node => node.status === 'online')
  const offlineNodes = nodes.filter(node => node.status === 'offline')

  if (onlineNodes.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Coffee className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Java Properties</h1>
              <p className="text-muted-foreground">Datacenter Java Configuration</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">No Online Solr Nodes</h3>
                  <p className="text-muted-foreground">No online nodes available in {datacenter} datacenter.</p>
                </div>
                <Button onClick={fetchNodesAndProperties} variant="outline">
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

  // Get all unique property keys from all nodes
  const allPropertyKeys = new Set<string>()
  onlineNodes.forEach(node => {
    if (nodeProperties[node.name]) {
      Object.keys(nodeProperties[node.name].properties).forEach(key => {
        allPropertyKeys.add(key)
      })
    }
  })

  let sortedPropertyKeys = Array.from(allPropertyKeys)
  if (sortProperties) {
    sortedPropertyKeys = sortedPropertyKeys.sort()
  }

  const truncateValue = (value: string, maxLength: number = 50) => {
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + '...'
    }
    return value
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - match Thread Dump style, align with table */}
        <div className="px-1 pt-2 pb-1">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div className="flex items-center gap-4 min-w-0 pb-1">
              <Coffee className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight truncate">Java Properties</h1>
                <span className="text-sm text-muted-foreground truncate">Datacenter Java Configuration</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-1 md:pb-0">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={sortProperties}
                  onChange={(e) => setSortProperties(e.target.checked)}
                  className="w-4 h-4 rounded border border-input bg-background"
                />
                Sort alphabetically
              </label>
              <Button onClick={fetchNodesAndProperties} variant="outline" className="h-9 px-4 text-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Table - align with header, no extra spacing */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-0 rounded-none">
            <thead className="bg-muted/50 border-0 rounded-none">
              <tr className="border-b-0">
                <th className="text-left p-3 font-semibold bg-muted/50 uppercase tracking-wide">JVM Property</th>
                {onlineNodes.map(node => (
                  <th key={node.name} className="text-left p-3 font-semibold bg-muted/50 min-w-[200px]">
                    <span className="capitalize">{node.name.replace(/[-_]/g, ' ')}</span>
                    <span className="ml-2 align-middle">
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 align-middle"
                        title="Property count"
                      >
                        {nodeProperties[node.name] ? Object.keys(nodeProperties[node.name].properties).length : 0} Properties
                      </Badge>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPropertyKeys.map((propertyKey, index) => (
                <tr key={propertyKey} className={`transition-colors duration-150 hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
                  <td className="p-3 font-mono text-xs font-medium text-blue-700 dark:text-blue-300">
                    <div title={propertyKey} className="truncate max-w-[300px]">
                      {propertyKey}
                    </div>
                  </td>
                  {onlineNodes.map(node => {
                    const nodeProps = nodeProperties[node.name]
                    const value = nodeProps?.properties[propertyKey] || '-'
                    const truncatedValue = value === '-' ? '-' : truncateValue(value)
                    
                    return (
                      <td key={node.name} className="p-3 font-mono text-xs">
                        <div 
                          title={value} 
                          className="truncate max-w-[200px] cursor-default"
                        >
                          {truncatedValue}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Offline Nodes (if any) */}
        {offlineNodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Offline Nodes ({offlineNodes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlineNodes.map(node => (
                  <div key={node.name} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">{node.name} ({node.host}:{node.port})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DatacenterJavaProperties
