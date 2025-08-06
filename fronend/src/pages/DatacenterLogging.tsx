import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

const DatacenterLogging = () => {
  const { datacenter } = useParams<{ datacenter: string }>()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Logging</h1>
            <p className="text-muted-foreground">{datacenter} Datacenter Logging</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Log Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Logging management for {datacenter} datacenter is coming soon. This will include log viewing,
              log level configuration, and log analysis tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterLogging
