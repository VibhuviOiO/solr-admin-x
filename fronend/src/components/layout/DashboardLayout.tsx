import { ReactNode } from "react"
import { useLocation, Link } from "react-router-dom"
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
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
          <SidebarTrigger className="-ml-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white p-2 rounded-md transition-colors" />
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-2">
            <Link to="/" className="hover:underline text-gray-700 dark:text-gray-200 font-medium">Home</Link>
            {pathnames.map((segment, idx) => {
              const to = "/" + pathnames.slice(0, idx + 1).join("/");
              const isLast = idx === pathnames.length - 1;
              // Convert to Title Case and replace dashes/underscores with spaces
              const label = decodeURIComponent(segment)
                .replace(/[-_]/g, ' ')
                .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
              return (
                <span key={to} className="flex items-center">
                  <span className="mx-2">/</span>
                  {isLast ? (
                    <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
                  ) : (
                    <Link to={to} className="hover:underline text-gray-700 dark:text-gray-200">{label}</Link>
                  )}
                </span>
              );
            })}
          </nav>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}