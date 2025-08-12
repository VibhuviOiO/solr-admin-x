import { NavLink, useSearchParams, useLocation } from "react-router-dom"
import {
  ChevronRight,
  ChevronDown,
  BarChart3,
  Server,
  Database,
  Settings,
  Shield,
  FileText,
  Activity,
  Zap,
  HardDrive,
  Network,
  Home
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"

interface DatacenterConfig {
  name: string
  default?: boolean
  zookeeperNodes: Array<{
    host: string
    port: number
  }>
  nodes: Array<{
    name: string
    host: string
    port: number
  }>
}

export function AppSidebar() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const currentDatacenter = searchParams.get('datacenter') || 'all'
  const [datacenters, setDatacenters] = useState<DatacenterConfig[]>([])
  const [openDatacenters, setOpenDatacenters] = useState<Record<string, boolean>>({})

  // Get active datacenter from current route
  const getActiveDatacenter = () => {
    const pathSegments = location.pathname.split('/')
    if (pathSegments[1] === 'datacenter' && pathSegments[2]) {
      return pathSegments[2]
    }
    return null
  }

  const activeDatacenter = getActiveDatacenter()

  // Fetch datacenter configuration from backend
  useEffect(() => {
    const fetchDatacenters = async () => {
      try {
        // Try to fetch from backend API first
        const response = await fetch('http://localhost:3001/api/solr/datacenters')
        if (response.ok) {
          const data = await response.json()
          setDatacenters(data.datacenters || data)
          
          // Initialize only the default datacenter as open
          const initialOpenState = (data.datacenters || data).reduce((acc: Record<string, boolean>, dc: DatacenterConfig) => {
            acc[dc.name] = dc.default || false
            return acc
          }, {})
          setOpenDatacenters(initialOpenState)
        } else {
          throw new Error('API not available')
        }
      } catch (error) {
        console.error('Failed to fetch datacenter config:', error)
        // Fallback to hardcoded values from dc-data.json structure
        const fallbackDatacenters = [
          {
            name: 'London',
            default: true,
            zookeeperNodes: [
              { host: 'localhost', port: 2181 },
              { host: 'localhost', port: 2182 },
              { host: 'localhost', port: 2183 }
            ],
            nodes: [
              { name: 'solr1', host: 'localhost', port: 8983 },
              { name: 'solr2', host: 'localhost', port: 8982 }
            ]
          },
          {
            name: 'Virginia',
            zookeeperNodes: [
              { host: 'localhost', port: 5181 },
              { host: 'localhost', port: 4182 },
              { host: 'localhost', port: 5183 }
            ],
            nodes: [
              { name: 'solr1_dc2', host: 'localhost', port: 8883 },
              { name: 'solr2_dc2', host: 'localhost', port: 8882 }
            ]
          }
        ]
        setDatacenters(fallbackDatacenters)
        // Initialize only the default datacenter as open
        setOpenDatacenters({
          'London': true,   // Default datacenter open
          'Virginia': false // Others closed
        })
      }
    }

    fetchDatacenters()
  }, [])

  // Ensure active datacenter menu stays open when navigating within it
  useEffect(() => {
    if (activeDatacenter) {
      setOpenDatacenters(prev => ({
        ...prev,
        [activeDatacenter]: true
      }))
    }
  }, [activeDatacenter])

  // Menu items for each datacenter
  const datacenterMenuItems = [
    {
      title: "Overview",
      icon: BarChart3,
      path: "/dashboard"
    },
    {
      title: "ZK Status",
      icon: Zap,
      path: "/zk-status"
    },
    {
      title: "Nodes",
      icon: Server,
      path: "/nodes"
    },
    {
      title: "Security",
      icon: Shield,
      path: "/security"
    },
    {
      title: "Logging",
      icon: FileText,
      path: "/logging",
      children: [
        {
          title: "Level",
          icon: FileText,
          path: "/logging-level"
        }
      ]
    },
    {
      title: "Java Properties",
      icon: Settings,
      path: "/java-properties"
    },
    {
      title: "Thread Dump",
      icon: Activity,
      path: "/thread-dump"
    }
  ]

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Solr Admin</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">Cluster Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Main Dashboard */}
              <SidebarMenuItem>
                <NavLink
                  to="/cluster/nodes"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Home className="w-4 h-4" />
                  Main Dashboard
                </NavLink>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Clusters
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {datacenters.map((datacenter) => {
                const isActiveDatacenter = activeDatacenter === datacenter.name
                const isOpen = openDatacenters[datacenter.name] || false

                return (
                  <SidebarMenuItem key={datacenter.name}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={(open) => {
                        // Simple toggle behavior - user controls when menus open/close
                        setOpenDatacenters(prev => ({
                          ...prev,
                          [datacenter.name]: open
                        }))
                      }}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isActiveDatacenter
                                ? 'bg-blue-500'
                                : datacenter.default
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                              }`} />
                            <span>{datacenter.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({datacenter.nodes.length})</span>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 space-y-1">
                        {datacenterMenuItems.map((item) => {
                          const linkPath = `/datacenter/${datacenter.name}${item.path}`
                          if (!item.children) {
                            return (
                              <div key={item.path} className="pl-8">
                                <NavLink
                                  to={linkPath}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200'
                                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`
                                  }
                                >
                                  <item.icon className="w-4 h-4" />
                                  {item.title}
                                </NavLink>
                              </div>
                            )
                          } else {
                            // Render parent and children (submenu)
                            return (
                              <div key={item.path} className="pl-8">
                                <NavLink
                                  to={linkPath}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200'
                                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`
                                  }
                                >
                                  <item.icon className="w-4 h-4" />
                                  {item.title}
                                </NavLink>
                                {/* Submenu */}
                                <div className="pl-6 mt-1 space-y-1">
                                  {item.children.map((child) => {
                                    const childPath = `/datacenter/${datacenter.name}${child.path}`
                                    return (
                                      <NavLink
                                        key={child.path}
                                        to={childPath}
                                        className={({ isActive }) =>
                                          `flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-200'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                          }`
                                        }
                                      >
                                        <child.icon className="w-3 h-3" />
                                        {child.title}
                                      </NavLink>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
