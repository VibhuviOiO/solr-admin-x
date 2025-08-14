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
  Network,
  Home
} from "lucide-react";

import { datacenterMenuItems, collectionMenuItems, coreMenuItems } from "@/constants/solrMenus";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
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
  // Per-DC state for Solr mode, collections, cores, and selection
  const [dcState, setDcState] = useState<Record<string, {
    isCloudEnabled: boolean,
    collections: Array<{ name: string, type: string }>,
    cores: Array<{ name: string }>,
    currentCollection?: { name: string, type: string },
    currentCore?: { name: string },
  }>>({})

  // Get active datacenter from current route
  const getActiveDatacenter = () => {
    const pathSegments = location.pathname.split('/')
    if (pathSegments[1] === 'datacenter' && pathSegments[2]) {
      return pathSegments[2]
    }
    return null
  }

  const activeDatacenter = getActiveDatacenter()

  // Fetch datacenter configuration and per-DC state from backend
  useEffect(() => {
    const fetchDatacenters = async () => {
      try {
        // Try to fetch from backend API first
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBase}/solr/datacenters`)
        if (response.ok) {
          const data = await response.json()
          setDatacenters(data.datacenters || data)
          // Initialize only the default datacenter as open
          const initialOpenState = (data.datacenters || data).reduce((acc: Record<string, boolean>, dc: DatacenterConfig) => {
            acc[dc.name] = dc.default || false
            return acc
          }, {})
          setOpenDatacenters(initialOpenState)
          // Simulate per-DC state (replace with real API calls per DC)
          const state: Record<string, any> = {}
          for (const dc of data.datacenters || data) {
            // TODO: Replace with real API calls for each DC
            state[dc.name] = {
              isCloudEnabled: true, // Simulate all as cloud for now
              collections: [
                { name: 'collection1', type: 'collection' },
                { name: 'alias1', type: 'alias' }
              ],
              cores: [
                { name: 'core1' },
                { name: 'core2' }
              ],
              currentCollection: undefined,
              currentCore: undefined
            }
          }
          setDcState(state)
        } else {
          throw new Error('API not available')
        }
      } catch (error) {
        console.error('Failed to fetch datacenter config:', error)
        // Fallback to hardcoded values from dc-data.json structure
        const fallbackHost = window.location.hostname || 'localhost';
        const fallbackDatacenters = [
          {
            name: 'London',
            default: true,
            zookeeperNodes: [
              { host: fallbackHost, port: 2181 },
              { host: fallbackHost, port: 2182 },
              { host: fallbackHost, port: 2183 }
            ],
            nodes: [
              { name: 'solr1', host: fallbackHost, port: 8983 },
              { name: 'solr2', host: fallbackHost, port: 8982 }
            ]
          },
          {
            name: 'Virginia',
            zookeeperNodes: [
              { host: fallbackHost, port: 5181 },
              { host: fallbackHost, port: 4182 },
              { host: fallbackHost, port: 5183 }
            ],
            nodes: [
              { name: 'solr1_dc2', host: fallbackHost, port: 8883 },
              { name: 'solr2_dc2', host: fallbackHost, port: 8882 }
            ]
          }
        ]
        setDatacenters(fallbackDatacenters)
        setOpenDatacenters({
          'London': true,
          'Virginia': false
        })
        // Simulate per-DC state for fallback
        setDcState({
          'London': {
            isCloudEnabled: true,
            collections: [
              { name: 'collection1', type: 'collection' },
              { name: 'alias1', type: 'alias' }
            ],
            cores: [
              { name: 'core1' },
              { name: 'core2' }
            ],
            currentCollection: undefined,
            currentCore: undefined
          },
          'Virginia': {
            isCloudEnabled: false,
            collections: [],
            cores: [
              { name: 'core1' },
              { name: 'core2' }
            ],
            currentCollection: undefined,
            currentCore: undefined
          }
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

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">UniSolr</h2>
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
                const dc = dcState[datacenter.name]
                // Only render selectors/menus if dc state is loaded
                return (
                  <SidebarMenuItem key={datacenter.name}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={(open) => {
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
                        {/* Shared menu per DC */}
                        {/* Default Menus */}
                        {dc && datacenterMenuItems.map((item) => {
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
                        {/* Separator: Collections */}
                        <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }} />
                        {/* Collection selector and menu (Cloud mode only) */}
                        {dc && dc.isCloudEnabled && (
                          <div className="pl-8 mt-4">
                            <div>
                              <select
                                className="w-full border rounded p-1 text-xs"
                                value={dc.currentCollection?.name || ''}
                                onChange={e => {
                                  const selected = dc.collections.find(c => c.name === e.target.value)
                                  setDcState(prev => ({
                                    ...prev,
                                    [datacenter.name]: {
                                      ...prev[datacenter.name],
                                      currentCollection: selected
                                    }
                                  }))
                                }}
                              >
                                <option value="">Select Collection</option>
                                {dc.collections.map(coll => (
                                  <option key={coll.name} value={coll.name}>{coll.name}</option>
                                ))}
                              </select>
                            </div>
                            {dc.currentCollection && (
                              <div className="sub-menu mt-2">
                                {collectionMenuItems.map(menu => {
                                  // Show/hide based on collection type, as in Angular
                                  if (menu.title === 'Analysis' && dc.currentCollection.type === 'alias') return null
                                  if (menu.title === 'Documents' && dc.currentCollection.type === 'alias') return null
                                  if (menu.title === 'Paramsets' && dc.currentCollection.type === 'alias') return null
                                  if (menu.title === 'Files' && dc.currentCollection.type === 'alias') return null
                                  if (menu.title === 'Schema' && dc.currentCollection.type === 'alias') return null
                                  return (
                                    <NavLink
                                      key={menu.path}
                                      to={`/datacenter/${datacenter.name}/collection/${dc.currentCollection.name}${menu.path}`}
                                      className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-200'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`
                                      }
                                    >
                                      <menu.icon className="w-3 h-3" />
                                      {menu.title}
                                    </NavLink>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Separator: Cores */}
                        <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }} />
                        {/* Core selector and menu (non-cloud mode or always for demo) */}
                        {dc && dc.cores && dc.cores.length > 0 && (
                          <div className="pl-8 mt-4">
                            <div>
                              <select
                                className="w-full border rounded p-1 text-xs"
                                value={dc.currentCore?.name || ''}
                                onChange={e => {
                                  const selected = dc.cores.find(c => c.name === e.target.value)
                                  setDcState(prev => ({
                                    ...prev,
                                    [datacenter.name]: {
                                      ...prev[datacenter.name],
                                      currentCore: selected
                                    }
                                  }))
                                }}
                              >
                                <option value="">Select Core</option>
                                {dc.cores.map(core => (
                                  <option key={core.name} value={core.name}>{core.name}</option>
                                ))}
                              </select>
                            </div>
                            {dc.currentCore && (
                              <div className="sub-menu mt-2">
                                {coreMenuItems.map(menu => (
                                  <NavLink
                                    key={menu.path}
                                    to={`/datacenter/${datacenter.name}/core/${dc.currentCore.name}${menu.path}`}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-200'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                      }`
                                    }
                                  >
                                    <menu.icon className="w-3 h-3" />
                                    {menu.title}
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
