import { useParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

const DatacenterSecurity = () => {
  const { datacenter } = useParams<{ datacenter: string }>()

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
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Security management for {datacenter} datacenter is coming soon. This will include authentication,
              authorization, SSL configuration, and security audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatacenterSecurity
