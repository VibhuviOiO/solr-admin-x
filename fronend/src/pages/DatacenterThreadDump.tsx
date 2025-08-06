import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

const DatacenterThreadDump = () => {
  const { datacenter } = useParams<{ datacenter: string }>()

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
          <CardHeader>
            <CardTitle>Thread Dump Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thread dump analysis for {datacenter} datacenter is coming soon. This will include thread state monitoring,
              deadlock detection, and performance analysis tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterThreadDump
