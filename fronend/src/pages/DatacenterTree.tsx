
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Folder, ChevronDown, ChevronRight, FileText, File } from "lucide-react";

interface TreeNode {
  id: string;
  label: string;
  path: string;
  children?: TreeNode[];
  isEphemeral?: boolean;
}

interface ZnodeData {
  path: string;
  data?: string;
  prop?: Record<string, string>;
}

export default function DatacenterTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [znode, setZnode] = useState<ZnodeData | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showProps, setShowProps] = useState(false);
  const [lang, setLang] = useState<string>("txt");

  // Hardcoded node for now, can be made dynamic
  const node = "solr1";


  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line
  }, []);

  // Recursively convert API tree to our TreeNode format
  function convertApiTree(apiNodes: any[], parentPath = ""): TreeNode[] {
    return apiNodes.map((n, idx) => {
      const label = n.text;
      let path = label;
      if (n.a_attr && n.a_attr.href) {
        const match = n.a_attr.href.match(/path=([^&]+)/);
        if (match) path = decodeURIComponent(match[1]);
      }
      if (!path.startsWith("/")) path = parentPath + (parentPath.endsWith("/") ? "" : "/") + label;
      return {
        id: path,
        label,
        path,
        isEphemeral: n.ephemeral,
        children: n.children ? convertApiTree(n.children, path) : undefined,
      };
    });
  }

  // Use /api/solr/admin/zookeeper/tree for both tree and file detail
  const API_BASE = "http://localhost:3001/api/solr/admin/zookeeper/tree";

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?node=${encodeURIComponent(node)}`);
      const data = await res.json();
      const treeData = convertApiTree(data.tree || []);
      setTree(treeData);
      // Expand all first-level folders/files
      const firstLevelIds = treeData.map(n => n.id);
      setExpanded(new Set(firstLevelIds));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (path: string) => {
    setSelected(path);
    setShowProps(false);
    setZnode(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?node=${encodeURIComponent(node)}&detail=true&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      // Use znode from response if present
      if (data.znode) {
        setZnode(data.znode);
        if (data.znode.path.endsWith("/managed-schema") || data.znode.path.endsWith(".xml.bak")) {
          setLang("xml");
        } else {
          const last = data.znode.path.split("/").pop();
          const lastDot = last ? last.lastIndexOf(".") : -1;
          setLang(lastDot !== -1 ? last!.substring(lastDot + 1) : "txt");
        }
      } else {
        setZnode(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      // Only expand/collapse the clicked node, not all nodes with the same id
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTree = (nodes: TreeNode[], level = 0) => (
    <ul className={level === 0 ? "pl-0" : "pl-4 border-l border-gray-200 dark:border-gray-700"}>
      {nodes.map((node, idx) => {
        const isFolder = !!(node.children && node.children.length);
        const isSelected = selected === node.path;
        return (
          <li key={node.id}>
            <div
              className={
                `flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded transition-colors select-none ` +
                (isSelected
                  ? "bg-blue-100 text-blue-900 font-bold border border-blue-300"
                  : "hover:bg-blue-50 hover:text-blue-900")
              }
              style={{ fontSize: level === 0 ? '1.08rem' : '1rem', minHeight: 32, color: isSelected ? '#1e3a8a' : '#222' }}
              onClick={() => isFolder ? toggleExpand(node.id) : handleSelect(node.path)}
            >
              {isFolder ? (
                expanded.has(node.id)
                  ? <ChevronDown size={18} className="text-blue-700" />
                  : <ChevronRight size={18} className="text-blue-700" />
              ) : <File size={16} className="text-gray-400" />}
              {isFolder ? (
                <Folder size={16} className="text-yellow-600 mr-1" />
              ) : (
                <FileText size={16} className="text-gray-400 mr-1" />
              )}
              <span
                className={
                  `ml-1 font-mono truncate` +
                  (isSelected ? "" : "")
                }
                onClick={e => { e.stopPropagation(); handleSelect(node.path); }}
                title={node.label}
                style={{ color: isSelected ? '#1e3a8a' : '#222' }}
              >{node.label}</span>
              {node.isEphemeral && <span className="ml-1 px-1 text-xs rounded bg-gray-200 text-gray-600">ephemeral</span>}
            </div>
            {isFolder && expanded.has(node.id) && renderTree(node.children!, level + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <DashboardLayout>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ZooKeeper Tree</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTree} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="w-1/3 min-w-[250px] max-w-[350px] border-r border-gray-200 dark:border-gray-700 pr-4 bg-white dark:bg-gray-950">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Loading tree...
              </div>
            ) : (
              renderTree(tree)
            )}
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-md min-h-[300px] border border-gray-200 dark:border-gray-800">
            {znode ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    className="flex items-center gap-1 text-blue-700 hover:underline text-sm font-semibold bg-transparent border-none cursor-pointer px-0 py-0"
                    onClick={() => setShowProps((v) => !v)}
                  >
                    <span className="text-lg font-bold select-none">{showProps ? "−" : "+"}</span> Metadata
                  </button>
                  <span className="text-muted-foreground font-mono text-sm">{znode.path}</span>
                </div>
                {showProps && znode.prop && (
                  <div className="mb-2 border rounded p-2 bg-white dark:bg-gray-950">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries(znode.prop).map(([k, v], i) => (
                        <li key={k} className={i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-950"}>
                          <span className="font-mono text-xs text-gray-700 dark:text-gray-300 inline-block w-40">{k}</span>
                          <span className="text-gray-900 dark:text-gray-100">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border rounded p-2 bg-white dark:bg-gray-950 mt-2">
                  {znode.data !== undefined ? (
                    <pre className={`whitespace-pre-wrap language-${lang} font-mono text-[15px] text-gray-800 dark:text-gray-100`} style={{maxHeight: 500, overflow: 'auto'}}>{znode.data}</pre>
                  ) : (
                    <em className="text-gray-500">No utf8 Content</em>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">Select a file or folder to view details.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
