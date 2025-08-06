import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server } from "lucide-react"

const DatacenterNodes = () => {
  const { datacenter } = useParams<{ datacenter: string }>()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Server className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Nodes</h1>
            <p className="text-muted-foreground">{datacenter} Datacenter Nodes</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Solr Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Node management for {datacenter} datacenter is coming soon. This will include node health,
              core management, and performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterNodes
