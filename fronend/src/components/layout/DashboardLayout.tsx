import { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Settings, 
  User,
  Activity
} from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
          <SidebarTrigger className="-ml-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white p-2 rounded-md transition-colors" />
          <div className="flex items-center gap-2 ml-4">
            <Activity className="w-5 h-5 text-green-600 animate-pulse" />
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              Online
            </Badge>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}