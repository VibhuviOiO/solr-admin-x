import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

const DatacenterDashboard = () => {
  const { datacenter } = useParams<{ datacenter: string }>()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{datacenter} Datacenter Overview</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Datacenter Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Dashboard for {datacenter} datacenter is coming soon. This will include comprehensive metrics,
              health status, and operational insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterDashboard
