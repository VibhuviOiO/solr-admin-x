import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Database, 
  Search, 
  Plus, 
  Settings,
  BarChart3,
  FileText
} from "lucide-react"

const Collections = () => {
  // Mock data for collections
  const collections = [
    {
      name: "products",
      numDocs: 125000,
      maxDoc: 125000,
      deletedDocs: 0,
      instanceDir: "/var/solr/data/products",
      dataDir: "/var/solr/data/products/data",
      config: "solrconfig.xml",
      schema: "managed-schema",
      uptime: "2d 14h 32m",
      status: "active"
    },
    {
      name: "users",
      numDocs: 45000,
      maxDoc: 45000,
      deletedDocs: 0,
      instanceDir: "/var/solr/data/users",
      dataDir: "/var/solr/data/users/data",
      config: "solrconfig.xml",
      schema: "managed-schema",
      uptime: "2d 14h 32m",
      status: "active"
    },
    {
      name: "logs",
      numDocs: 2500000,
      maxDoc: 2600000,
      deletedDocs: 100000,
      instanceDir: "/var/solr/data/logs",
      dataDir: "/var/solr/data/logs/data",
      config: "solrconfig.xml",
      schema: "managed-schema",
      uptime: "2d 14h 32m",
      status: "active"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Collections</h2>
            <p className="text-muted-foreground">
              Manage your Solr collections and cores
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="bg-admin-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search collections..." 
                  className="pl-10 bg-background border-border"
                />
              </div>
              <Badge variant="secondary" className="bg-admin-accent/10 text-admin-accent">
                {collections.length} Collections
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Collections Table */}
        <Card className="bg-admin-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Collection Overview
            </CardTitle>
            <CardDescription>
              Monitor your Solr collections status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Collection</TableHead>
                  <TableHead className="text-foreground">Documents</TableHead>
                  <TableHead className="text-foreground">Deleted</TableHead>
                  <TableHead className="text-foreground">Uptime</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <TableRow key={collection.name} className="border-border hover:bg-accent/50">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        {collection.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {collection.numDocs.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {collection.deletedDocs > 0 ? (
                        <span className="text-admin-warning">
                          {collection.deletedDocs.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-admin-success">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground font-mono text-sm">
                      {collection.uptime}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className="bg-admin-success/10 text-admin-success border-admin-success/20"
                      >
                        {collection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Search className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Collection Details Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card key={collection.name} className="bg-admin-card border-border hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    {collection.name}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="bg-admin-success/10 text-admin-success border-admin-success/20"
                  >
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Documents</p>
                    <p className="font-medium text-foreground">
                      {collection.numDocs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Docs</p>
                    <p className="font-medium text-foreground">
                      {collection.maxDoc.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Schema</p>
                    <p className="font-mono text-xs text-foreground">
                      {collection.schema}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Config</p>
                    <p className="font-mono text-xs text-foreground">
                      {collection.config}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Search className="w-3 h-3 mr-1" />
                    Query
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-3 h-3 mr-1" />
                    Schema
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Collections