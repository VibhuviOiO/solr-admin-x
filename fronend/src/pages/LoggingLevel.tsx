import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

interface LoggerLevel {
  name: string;
  level: string | null;
  set?: boolean;
  children?: LoggerLevel[];
}

interface LoggingLevelsResponse {
  watcher: string;
  levels: string[];
  loggers: LoggerLevel[];
  responseHeader?: any;
}

interface SolrNode {
  name: string;
  host: string;
  port: number;
  status: 'online' | 'offline';
}

const LoggingLevel = () => {
  const { datacenter } = useParams<{ datacenter: string }>();
  const [nodes, setNodes] = useState<SolrNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [levelsData, setLevelsData] = useState<LoggingLevelsResponse | null>(null);
  const [loggerTree, setLoggerTree] = useState<LoggerLevel[]>([]);
  const [loading, setLoading] = useState(false);
  // No expanded state: tree is always expanded
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchNodes = async () => {
      setLoading(true);
      setError(null);
      try {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const nodesRes = await fetch(`${apiBase}/solr/cluster/nodes?datacenter=${encodeURIComponent(datacenter || "")}&loadAll=true`);
        if (!nodesRes.ok) throw new Error("Failed to fetch nodes");
        const nodesData = await nodesRes.json();
        const onlineNodes = nodesData.nodes?.filter((n: any) => n.status === "online") || [];
        setNodes(onlineNodes);
        if (onlineNodes.length > 0) setSelectedNode(onlineNodes[0].name);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, [datacenter]);

  useEffect(() => {
    if (!selectedNode) return;
    setLoading(true);
    setLevelsData(null);
    setLoggerTree([]);
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  fetch(`${apiBase}/solr/logging/levels?node=${encodeURIComponent(selectedNode)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setLevelsData(data);
        if (data && data.loggers) {
          setLoggerTree(buildLoggerTree(data.loggers));
        }
      })
      .catch(() => {
        setLevelsData(null);
        setLoggerTree([]);
      })
      .finally(() => setLoading(false));
  }, [selectedNode]);

  // Helper: build tree from flat logger list
  function buildLoggerTree(loggers: LoggerLevel[]): LoggerLevel[] {
    const map = new Map<string, LoggerLevel & { children: LoggerLevel[] }>();
    // Clone and add children array
    loggers.forEach(l => map.set(l.name, { ...l, children: [] }));
    const roots: LoggerLevel[] = [];
    for (const logger of map.values()) {
      const lastDot = logger.name.lastIndexOf('.');
      if (lastDot === -1) {
        roots.push(logger);
      } else {
        const parentName = logger.name.substring(0, lastDot);
        const parent = map.get(parentName);
        if (parent) {
          parent.children!.push(logger);
        } else {
          roots.push(logger); // fallback: treat as root
        }
      }
    }
    return roots;
  }

  // No expand/collapse: tree is always expanded

  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const handleSetLevel = async (logger: LoggerLevel, level: string) => {
    setOpenPopover(null);
    // TODO: Implement API call to set level
    // Optionally update UI optimistically
  };

  // Level color map (classic Solr style)
  const levelBg: Record<string, string> = {
    ALL: 'bg-blue-200',
    TRACE: 'bg-blue-100',
    DEBUG: 'bg-cyan-100',
    INFO: 'bg-yellow-100',
    WARN: 'bg-green-100',
    ERROR: 'bg-orange-100',
    FATAL: 'bg-red-100',
    OFF: 'bg-white',
    null: 'bg-gray-50',
    undefined: 'bg-gray-50',
  };

  // Render tree as a table row for each logger with columns: name | level | set | change
  function renderLoggerRow(logger: LoggerLevel, levels: string[], depth = 0, isLast = false, parentLine: boolean[] = []) {
    // Remove tree lines for a cleaner look
    // const lines = [];
    // for (let i = 0; i < depth; i++) {
    //   lines.push(
    //     <span
    //       key={i}
    //       className="absolute left-0 top-0 h-full border-l border-gray-300"
    //       style={{ left: `${i * 18 + 12}px`, borderColor: parentLine[i] ? '#d1d5db' : 'transparent', width: 0 }}
    //     />
    //   );
    // }
    // if (depth > 0) {
    //   lines.push(
    //     <span
    //       key={"h"}
    //       className="absolute border-t border-gray-300"
    //       style={{ left: `${(depth - 1) * 18 + 12}px`, top: '50%', width: '18px', borderColor: '#d1d5db', height: 0 }}
    //     />
    //   );
    // }
    const isExpanded = expanded[logger.name];
    return [
      <tr key={logger.name} className="group hover:bg-muted border-b">
        <td className="relative font-mono text-xs py-1 pr-2 min-w-[220px]" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
          <div className="relative flex items-center">
            <button
              className="mr-2 text-xs text-muted-foreground focus:outline-none"
              onClick={() => setExpanded(e => ({ ...e, [logger.name]: !isExpanded }))}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              style={{ minWidth: 18 }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className={logger.set ? 'font-bold' : ''} style={{ color: logger.set ? '#222' : undefined }}>{logger.name}</span>
          </div>
        </td>
        <td className={`px-2 py-1 text-xs font-mono italic text-right min-w-[60px] ${levelBg[(logger.level || '').toUpperCase() as string] || 'bg-gray-50'}`}>{logger.level || 'null'}</td>
        <td className="px-2 py-1 text-xs text-center">{logger.set ? <span className="text-green-700 font-bold">Yes</span> : <span className="text-gray-400">No</span>}</td>
        <td className="px-2 py-1 text-xs text-center">
          <Popover open={openPopover === logger.name} onOpenChange={open => setOpenPopover(open ? logger.name : null)}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={`px-2 py-0 h-6 text-xs flex items-center gap-1 ${openPopover === logger.name ? 'text-blue-700' : ''}`}
                style={{ background: 'none', boxShadow: 'none' }}
                title="Change level"
              >
                <Pencil className="w-4 h-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-0 rounded-md shadow-lg border bg-popover">
              <ul className="divide-y divide-gray-200">
                {levels.map(l => (
                  <li key={l}>
                    <button
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors ${logger.level === l ? 'font-bold text-blue-700' : ''}`}
                      onClick={() => handleSetLevel(logger, l)}
                    >
                      {l}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-red-100 hover:text-red-700 transition-colors ${!logger.level ? 'font-bold text-red-700' : ''}`}
                    onClick={() => handleSetLevel(logger, 'unset')}
                  >
                    UNSET
                  </button>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </td>
      </tr>,
      isExpanded && (
        <tr key={logger.name + '-details'} className="bg-muted/50">
          <td colSpan={4} className="px-4 py-2 text-xs">
            <div className="flex flex-col gap-1">
              {Object.entries(logger).map(([k, v]) => (
                <div key={k}><span className="font-semibold mr-2">{k}:</span><span className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span></div>
              ))}
            </div>
          </td>
        </tr>
      )
    ];
  }

  // Recursive render: flatten tree and render each logger
  function renderLoggerRows(loggers: LoggerLevel[], levels: string[], depth = 0, parentLine: boolean[] = []) {
    return loggers.flatMap((logger, idx) => {
      const isLast = idx === loggers.length - 1;
      const line = renderLoggerRow(logger, levels, depth, isLast, parentLine);
      // No children: return single line
      if (logger.children?.length === 0) return line;
      // Has children: render with recursive descent
      return [
        line,
        ...renderLoggerRows(logger.children, levels, depth + 1, [...parentLine, isLast])
      ];
    });
  }

  // Filter tree by search
  function filterTree(nodes: LoggerLevel[], query: string): LoggerLevel[] {
    if (!query) return nodes;
    const q = query.toLowerCase();
    function match(node: LoggerLevel): boolean {
      if (node.name.toLowerCase().includes(q)) return true;
      if (node.children) return node.children.some(match);
      return false;
    }
    function filterNode(node: LoggerLevel): LoggerLevel | null {
      if (node.name.toLowerCase().includes(q)) return node;
      if (node.children) {
        const filtered = node.children.map(filterNode).filter(Boolean) as LoggerLevel[];
        if (filtered.length > 0) return { ...node, children: filtered };
      }
      return null;
    }
    return nodes.map(filterNode).filter(Boolean) as LoggerLevel[];
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Logging Levels</h1>
        </div>
        {nodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold">No Online Nodes</h3>
              <p className="text-muted-foreground mt-2">No online nodes found in this datacenter.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedNode} onValueChange={setSelectedNode} className="w-full">
            <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
              {nodes.map((node) => (
                <TabsTrigger key={node.name} value={node.name} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{node.name}</Badge>
                  <span className="text-xs text-muted-foreground">{node.host}:{node.port}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {nodes.map((node) => (
              <TabsContent key={node.name} value={node.name} className="space-y-4">
                <Card className="p-0 border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-semibold text-sm">{levelsData?.watcher || 'Loggers'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <input
                      type="text"
                      placeholder="Search logger..."
                      className="mb-2 px-2 py-1 border rounded text-xs w-full max-w-xs"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <div className="overflow-x-auto max-h-[70vh]">
                      <table className="min-w-[350px] w-full border-separate" style={{ borderSpacing: 0 }}>
                        <thead className="sticky top-0 bg-muted z-10">
                          <tr>
                            <th className="text-left px-2 py-1 text-xs font-semibold w-[220px]">Name</th>
                            <th className="text-right px-2 py-1 text-xs font-semibold w-[60px]">Level</th>
                            <th className="text-center px-2 py-1 text-xs font-semibold w-[40px]">Set</th>
                            <th className="text-center px-2 py-1 text-xs font-semibold w-[60px]">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderLoggerRows(filterTree(loggerTree, search), levelsData?.levels || [], 0, []).flat()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoggingLevel;
