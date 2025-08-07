import express, { Request, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Load datacenter configuration from environment or file
function loadDatacenterConfig() {
  // Option 1: Load from environment variable (JSON string)
  if (process.env.DC_CONFIG_JSON) {
    try {
      return JSON.parse(process.env.DC_CONFIG_JSON);
    } catch (error) {
      console.error('Error parsing DC_CONFIG_JSON:', error);
      throw new Error('Invalid DC_CONFIG_JSON format');
    }
  }

  // Option 2: Load from custom file path
  const configPath = process.env.DC_CONFIG_PATH || path.join(__dirname, '../config/dc-data.json');
  
  try {
    const dcDataRaw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(dcDataRaw);
  } catch (error) {
    console.error(`Error loading datacenter config from ${configPath}:`, error);
    // Fallback to default configuration
    return {
      datacenters: [
        {
          name: "London",
          default: true,
          zookeeperNodes: [
            { host: "localhost", port: 2181 }
          ],
          nodes: [
            { name: "solr1", host: "localhost", port: 8983 }
          ]
        }
      ]
    };
  }
}

const dcDataConfig = loadDatacenterConfig();
console.log('Loaded datacenter configuration:', JSON.stringify(dcDataConfig, null, 2));

// Define types for datacenter configuration
interface ClusterNode {
  name: string;
  host: string;
  port: number;
}

interface DataCenter {
  name: string;
  default?: boolean;
  zookeeperNodes: Array<{ host: string; port: number }>;
  nodes: ClusterNode[];
}

// Generate SOLR_NODES from datacenter configuration
const SOLR_NODES: SolrNodeInfo[] = dcDataConfig.datacenters?.flatMap((dc: DataCenter, dcIndex: number) => 
  dc.nodes.map((node: ClusterNode, nodeIndex: number) => ({
    id: `${node.name}-${dc.name.toLowerCase()}`, // Generate ID from name and datacenter
    name: `${node.name} (${dc.name})`,
    url: `http://${node.host}:${node.port}/solr`,
    datacenter: dc.name,
    host: node.host,
    port: node.port,
    default: nodeIndex === 0, // First node in each datacenter is default
    status: 'offline' as const
  }))
) || [];


// Interface for Solr Node Info
interface SolrNodeInfo {
  id: string;
  name: string;
  url: string;
  datacenter: string;
  host: string;
  port: number;
  default?: boolean;
  status: 'online' | 'offline' | 'error';
  systemInfo?: SolrSystemInfo;
  metrics?: SolrMetrics;
  error?: string;
}

// Interface for Solr Metrics
interface SolrMetrics {
  [key: string]: any;
}

// Interface for Solr System Info Response
interface SolrSystemInfo {
  responseHeader: {
    status: number;
    QTime: number;
  };
  mode: string;
  zkHost?: string;
  solr_home: string;
  core_root?: string;
  lucene: {
    "solr-spec-version": string;
    "solr-impl-version": string;
    "lucene-spec-version": string;
    "lucene-impl-version": string;
  };
  jvm: {
    version: string;
    name: string;
    spec?: {
      vendor: string;
      name: string;
      version: string;
    };
    jre?: {
      vendor: string;
      version: string;
    };
    vm?: {
      vendor: string;
      name: string;
      version: string;
    };
    processors: number;
    memory: {
      free: string;
      total: string;
      max: string;
      used: string;
      raw: {
        free: number;
        total: number;
        max: number;
        used: number;
        "used%": number;
      };
    };
    jmx: {
      classpath?: string;
      commandLineArgs: string[];
      startTime: string;
      upTimeMS: number;
    };
  };
  security: {
    tls: boolean;
  };
  system: {
    name: string;
    arch: string;
    availableProcessors: number;
    systemLoadAverage: number;
    version?: string;
    committedVirtualMemorySize?: number;
    cpuLoad?: number;
    freeMemorySize?: number;
    freePhysicalMemorySize: number;
    freeSwapSpaceSize: number;
    processCpuLoad?: number;
    processCpuTime?: number;
    systemCpuLoad?: number;
    totalMemorySize?: number;
    totalPhysicalMemorySize: number;
    totalSwapSpaceSize: number;
    maxFileDescriptorCount: number;
    openFileDescriptorCount: number;
  };
  node: string;
}

// Get system info for a specific node or first available node
router.get('/system/info', async (req, res) => {
  try {
    const nodeParam = req.query.node as string
    
    // Load datacenter configuration
    const dcConfigPath = path.join(__dirname, '..', 'config', 'dc-data.json')
    const dcConfigContent = fs.readFileSync(dcConfigPath, 'utf-8')
    const dcData = JSON.parse(dcConfigContent)
    
    // If nodeParam is provided, try to find specific node
    if (nodeParam) {
      for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          if (node.id === nodeParam || node.name === nodeParam) {
            try {
              const response = await axios.get(`${node.url}/admin/info/system?wt=json`)
              
              const nodeInfo = {
                id: node.id,
                name: node.name,
                url: node.url,
                datacenter: dc.name,
                status: 'online' as const,
                systemInfo: response.data
              }
              
              return res.json(nodeInfo)
            } catch (error) {
              console.error(`Error fetching system info from node ${node.name}:`, error)
              
              const nodeInfo = {
                id: node.id,
                name: node.name,
                url: node.url,
                datacenter: dc.name,
                status: 'offline' as const,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
              
              return res.json(nodeInfo)
            }
          }
        }
      }
      
      return res.status(404).json({ error: 'Node not found' })
    }
    
    // If no specific node, get first available node (original behavior)
    for (const dc of dcData.datacenters) {
      for (const node of dc.nodes) {
        try {
          const response = await axios.get(`${node.url}/admin/info/system?wt=json`)
          
          const nodeInfo = {
            id: node.id,
            name: node.name,
            url: node.url,
            datacenter: dc.name,
            status: 'online' as const,
            systemInfo: response.data
          }
          
          return res.json(nodeInfo)
        } catch (error) {
          console.error(`Error fetching system info from node ${node.name}:`, error)
          continue
        }
      }
    }
    
    res.status(500).json({ error: 'No available Solr nodes found' })
  } catch (error) {
    console.error('Error in /system/info endpoint:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all cluster nodes information
router.get('/cluster/nodes', async (req: Request, res: Response) => {
  try {
    const datacenter = req.query.datacenter as string;
    const loadAll = req.query.loadAll === 'true'; // New parameter to load all nodes
    
    // Filter nodes based on datacenter and default flag
    let filteredNodes = SOLR_NODES;
    
    // Filter by datacenter if specified
    if (datacenter && datacenter !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.datacenter === datacenter);
    }
    
    // If loadAll is false (default), only load default nodes
    if (!loadAll) {
      filteredNodes = filteredNodes.filter(node => node.default === true);
    }
    
    console.log(`Loading ${filteredNodes.length} nodes (loadAll: ${loadAll}, datacenter: ${datacenter || 'all'})`);
    
    const nodesPromises = filteredNodes.map(async (node: SolrNodeInfo): Promise<SolrNodeInfo> => {
      try {
        const [systemResponse, metricsResponse] = await Promise.allSettled([
          axios.get(`${node.url}/admin/info/system?wt=json`, { timeout: 5000 }),
          axios.get(`${node.url}/admin/metrics?prefix=CONTAINER.fs,org.eclipse.jetty.server.handler.DefaultHandler.get-requests,INDEX.sizeInBytes,SEARCHER.searcher.numDocs,SEARCHER.searcher.deletedDocs,SEARCHER.searcher.warmupTime&wt=json`, { timeout: 5000 })
        ]);

        const nodeInfo: SolrNodeInfo = {
          ...node,
          status: 'online'
        };

        if (systemResponse.status === 'fulfilled') {
          nodeInfo.systemInfo = systemResponse.value.data;
        }

        if (metricsResponse.status === 'fulfilled') {
          nodeInfo.metrics = metricsResponse.value.data;
        }

        return nodeInfo;
      } catch (error) {
        return {
          ...node,
          status: 'offline',
          error: axios.isAxiosError(error) ? error.message : 'Unknown error'
        };
      }
    });

    const nodes = await Promise.all(nodesPromises);
    res.json({ 
      nodes, 
      datacenters: [...new Set(SOLR_NODES.map((n: SolrNodeInfo) => n.datacenter))],
      loadedDefaults: !loadAll // Indicates if only default nodes were loaded
    });
  } catch (error) {
    console.error('Error fetching cluster nodes:', error);
    res.status(500).json({
      error: 'Failed to fetch cluster nodes information',
      details: axios.isAxiosError(error) ? error.message : 'Unknown error'
    });
  }
});

// Get specific node information
router.get('/cluster/nodes/:nodeId', async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId;
    const node = SOLR_NODES.find((n: SolrNodeInfo) => n.id === nodeId);
    
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const [systemResponse, metricsResponse] = await Promise.allSettled([
      axios.get(`${node.url}/admin/info/system?wt=json`),
      axios.get(`${node.url}/admin/metrics?prefix=CONTAINER.fs,org.eclipse.jetty.server.handler.DefaultHandler.get-requests,INDEX.sizeInBytes,SEARCHER.searcher.numDocs,SEARCHER.searcher.deletedDocs,SEARCHER.searcher.warmupTime&wt=json`)
    ]);

    const nodeInfo: SolrNodeInfo = {
      ...node,
      status: 'online'
    };

    if (systemResponse.status === 'fulfilled') {
      nodeInfo.systemInfo = systemResponse.value.data;
    }

    if (metricsResponse.status === 'fulfilled') {
      nodeInfo.metrics = metricsResponse.value.data;
    }

    res.json(nodeInfo);
  } catch (error) {
    console.error('Error fetching node info:', error);
    res.status(500).json({
      error: 'Failed to fetch node information',
      details: axios.isAxiosError(error) ? error.message : 'Unknown error'
    });
  }
});

// Get ZooKeeper information per datacenter using proper Solr ZooKeeper status API
router.get('/cluster/zookeeper', async (req: Request, res: Response) => {
  try {
    const datacenterZkInfo: Record<string, any> = {};
    
    // Get ZooKeeper info from each datacenter using dedicated ZK status API
    for (const dc of dcDataConfig.datacenters) {
      const dcNodes = SOLR_NODES.filter(node => node.datacenter === dc.name);
      let zkStatusData = null;
      let nodeUsed = null;

      // Try to get ZK status from any node in this datacenter
      for (const node of dcNodes) {
        try {
          const response = await axios.get(`${node.url}/admin/zookeeper/status?wt=json`, { timeout: 10000 });
          if (response.data.zkStatus) {
            zkStatusData = response.data.zkStatus;
            nodeUsed = node.name;
            break;
          }
        } catch (error) {
          console.warn(`Failed to get ZK status from ${node.name}:`, axios.isAxiosError(error) ? error.message : 'Unknown error');
          continue;
        }
      }

      if (zkStatusData) {
        // Parse the actual ZK status data
        const zkHosts = zkStatusData.details?.map((detail: any, index: number) => ({
          hostname: detail.host ? detail.host.split(':')[0] : `zookeeper-${index + 1}`,
          port: detail.host ? parseInt(detail.host.split(':')[1]) || 2181 : 2181,
          status: detail.ok ? 'connected' : 'disconnected',
          role: detail.zk_server_state || 'unknown',
          serverId: detail.serverId || '',
          version: detail.zk_version || '',
          connections: detail.zk_num_alive_connections || 0,
          latency: detail.zk_avg_latency || 0,
          clientPort: detail.clientPort || 2181
        })) || [];

        datacenterZkInfo[dc.name] = {
          datacenter: dc.name,
          zkHosts,
          totalZkNodes: zkHosts.length,
          connectedNodes: zkHosts.filter((h: any) => h.status === 'connected').length,
          mode: zkStatusData.mode || 'ensemble',
          ensembleSize: zkStatusData.ensembleSize || zkHosts.length,
          status: zkStatusData.status || 'unknown',
          dynamicReconfig: zkStatusData.dynamicReconfig || false,
          zkConnectionString: zkStatusData.zkHost || '',
          errors: zkStatusData.errors || [],
          connectedNode: nodeUsed,
          retrievedFrom: nodeUsed,
          rawData: zkStatusData // Store full data for detailed view
        };
      } else {
        // Fallback to configuration data if API call fails
        const configZkHosts = dc.zookeeperNodes.map((zk: { host: string; port: number }, index: number) => ({
          hostname: zk.host,
          port: zk.port,
          status: 'unknown',
          role: 'unknown',
          serverId: `${index + 1}`,
          version: 'unknown',
          connections: 0,
          latency: 0,
          clientPort: zk.port
        }));

        datacenterZkInfo[dc.name] = {
          datacenter: dc.name,
          zkHosts: configZkHosts,
          totalZkNodes: configZkHosts.length,
          connectedNodes: 0,
          mode: 'unknown',
          ensembleSize: configZkHosts.length,
          status: 'unreachable',
          dynamicReconfig: false,
          zkConnectionString: configZkHosts.map((h: { hostname: string; port: number }) => `${h.hostname}:${h.port}`).join(','),
          errors: ['Unable to connect to any Solr node in this datacenter'],
          connectedNode: null,
          retrievedFrom: null,
          rawData: null
        };
      }
    }

    // Calculate overall cluster summary
    const totalZkNodes = Object.values(datacenterZkInfo).reduce((sum: number, dc: any) => sum + dc.totalZkNodes, 0);
    const totalConnectedNodes = Object.values(datacenterZkInfo).reduce((sum: number, dc: any) => sum + dc.connectedNodes, 0);
    const totalDatacenters = Object.keys(datacenterZkInfo).length;
    const overallStatus = totalConnectedNodes === totalZkNodes ? 'green' : totalConnectedNodes > 0 ? 'yellow' : 'red';

    res.json({
      datacenters: datacenterZkInfo,
      summary: {
        totalZkNodes,
        totalConnectedNodes,
        totalDatacenters,
        overallStatus,
        mode: 'ensemble' // All our clusters are ensemble mode
      }
    });
  } catch (error) {
    console.error('Error fetching ZooKeeper info:', error);
    res.status(500).json({
      error: 'Failed to fetch ZooKeeper information',
      details: axios.isAxiosError(error) ? error.message : 'Unknown error'
    });
  }
});

// Get detailed ZooKeeper information for a specific datacenter
router.get('/cluster/zookeeper/:datacenter/details', async (req: Request, res: Response) => {
  try {
    const datacenterName = req.params.datacenter;
    const dc = dcDataConfig.datacenters.find((d: any) => d.name === datacenterName);
    
    if (!dc) {
      return res.status(404).json({ error: `Datacenter '${datacenterName}' not found` });
    }

    const dcNodes = SOLR_NODES.filter(node => node.datacenter === datacenterName);
    let zkStatusData = null;
    let nodeUsed = null;

    // Try to get detailed ZK status from any node in this datacenter
    for (const node of dcNodes) {
      try {
        const response = await axios.get(`${node.url}/admin/zookeeper/status?wt=json`, { timeout: 10000 });
        if (response.data.zkStatus) {
          zkStatusData = response.data.zkStatus;
          nodeUsed = node.name;
          break;
        }
      } catch (error) {
        console.warn(`Failed to get detailed ZK status from ${node.name}:`, axios.isAxiosError(error) ? error.message : 'Unknown error');
        continue;
      }
    }

    if (!zkStatusData) {
      return res.status(503).json({ 
        error: `Unable to retrieve ZooKeeper details for datacenter '${datacenterName}'`,
        details: 'No Solr nodes in this datacenter are responding'
      });
    }

    res.json({
      datacenter: datacenterName,
      retrievedFrom: nodeUsed,
      zkStatus: zkStatusData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching detailed ZooKeeper info:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed ZooKeeper information',
      details: axios.isAxiosError(error) ? error.message : 'Unknown error'
    });
  }
});

// Get datacenter configuration (for frontend sidebar)
router.get('/datacenters', async (req: Request, res: Response) => {
  try {
    // Return the datacenter configuration that's already loaded
    res.json({
      datacenters: dcDataConfig.datacenters || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching datacenters config:', error);
    res.status(500).json({
      error: 'Failed to fetch datacenters configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New simplified endpoint: Get datacenter summary using only 2 APIs
router.get('/datacenters/summary', async (req: Request, res: Response) => {
  try {
    const summaries = await Promise.allSettled(
      dcDataConfig.datacenters?.map(async (dc: DataCenter) => {
        const dcNodes = SOLR_NODES.filter(node => node.datacenter === dc.name);
        
        // 1. Check Solr node health using /admin/info/system
        let healthStatus: 'online' | 'offline' | 'degraded' = 'offline';
        let onlineNodesInDc = 0;
        
        const nodeHealthPromises = dcNodes.map(async (node) => {
          try {
            const response = await axios.get(`${node.url}/admin/info/system?wt=json`, { timeout: 2000 });
            return response.data?.responseHeader?.status === 0;
          } catch (error) {
            return false;
          }
        });
        
        const nodeHealthResults = await Promise.all(nodeHealthPromises);
        onlineNodesInDc = nodeHealthResults.filter(Boolean).length;
        
        // Determine datacenter health based on online nodes
        if (onlineNodesInDc === dcNodes.length) {
          healthStatus = 'online';
        } else if (onlineNodesInDc > 0) {
          healthStatus = 'degraded';
        } else {
          healthStatus = 'offline';
        }
        
        // 2. Check ZooKeeper health using /admin/zookeeper/status (only if Solr is online)
        let zkHealthy = false;
        let actualZkNodes = 0;
        let zkOverallStatus = 'red';
        
        if (onlineNodesInDc > 0) {
          // Use first online node to check ZooKeeper status
          const onlineNodeIndex = nodeHealthResults.findIndex(Boolean);
          if (onlineNodeIndex !== -1) {
            const onlineNode = dcNodes[onlineNodeIndex];
            try {
              const zkResponse = await axios.get(`${onlineNode.url}/admin/zookeeper/status?wt=json`, { timeout: 2000 });
              if (zkResponse.data?.responseHeader?.status === 0) {
                const zkStatus = zkResponse.data.zkStatus;
                zkOverallStatus = zkStatus?.status || 'red';
                
                if (zkStatus?.details && Array.isArray(zkStatus.details)) {
                  actualZkNodes = zkStatus.details.length;
                  const healthyZkNodes = zkStatus.details.filter((detail: any) => detail.ok).length;
                  zkHealthy = healthyZkNodes > 0 && zkOverallStatus !== 'red';
                  console.log(`ZooKeeper status for ${dc.name}: ${healthyZkNodes}/${actualZkNodes} healthy, status: ${zkOverallStatus}`);
                }
              }
            } catch (zkError) {
              console.log(`ZooKeeper health check failed for ${dc.name}: ${zkError instanceof Error ? zkError.message : 'Unknown error'}`);
            }
          }
        }
        
        return {
          name: dc.name,
          nodeCount: dcNodes.length,
          onlineNodes: onlineNodesInDc,
          healthStatus,
          zkNodeCount: actualZkNodes,
          hasZooKeeper: actualZkNodes > 0,
          zkHealthy,
          zkStatus: zkOverallStatus,
          // Add debugging info
          sampleNodeUrl: dcNodes.length > 0 ? dcNodes[0].url : 'none',
          configuredNodes: dcNodes.map(n => n.url)
        };
      }) || []
    );

    const results = summaries
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const totalNodes = results.reduce((sum, dc) => sum + dc.nodeCount, 0);
    const totalOnlineNodes = results.reduce((sum, dc) => sum + dc.onlineNodes, 0);
    const healthyDatacenters = results.filter(dc => dc.healthStatus === 'online').length;

    res.json({
      datacenters: results,
      summary: {
        totalDatacenters: results.length,
        healthyDatacenters,
        totalNodes,
        totalOnlineNodes,
        overallHealth: totalNodes > 0 ? (totalOnlineNodes / totalNodes) * 100 : 0
      },
      timestamp: new Date().toISOString(),
      debug: {
        message: "Using simplified API calls: /admin/info/system for nodes, /admin/zookeeper/status for ZK",
        configuredPorts: dcDataConfig.datacenters?.flatMap((dc: DataCenter) => 
          dc.nodes.map(n => `${n.host}:${n.port}`)
        ) || []
      }
    });

  } catch (error) {
    console.error('Error fetching datacenter summary:', error);
    res.status(500).json({
      error: 'Failed to fetch datacenter summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint: Get single datacenter detailed view
router.get('/datacenters/:datacenter', async (req: Request, res: Response) => {
  try {
    const { datacenter } = req.params;
    
    // Find the datacenter configuration
    const dcConfig = dcDataConfig.datacenters?.find((dc: DataCenter) => dc.name === datacenter);
    if (!dcConfig) {
      return res.status(404).json({ error: `Datacenter ${datacenter} not found` });
    }

    // Get nodes for this datacenter only
    const dcNodes = SOLR_NODES.filter(node => node.datacenter === datacenter);
    
    // Check detailed status for each node in this datacenter
    const nodePromises = dcNodes.map(async (node) => {
      try {
        const [pingResponse, systemResponse] = await Promise.allSettled([
          axios.get(`${node.url}/admin/ping?wt=json`, { timeout: 5000 }),
          axios.get(`${node.url}/admin/info/system?wt=json`, { timeout: 5000 })
        ]);

        let status: 'online' | 'offline' | 'error' = 'offline';
        let systemInfo = null;
        let error = null;

        if (pingResponse.status === 'fulfilled' && pingResponse.value.data?.status === 'OK') {
          status = 'online';
          if (systemResponse.status === 'fulfilled') {
            systemInfo = systemResponse.value.data;
          }
        } else {
          status = 'error';
          error = pingResponse.status === 'rejected' 
            ? pingResponse.reason?.message || 'Connection failed'
            : 'Health check failed';
        }

        return {
          ...node,
          status,
          systemInfo,
          error
        };
      } catch (error) {
        return {
          ...node,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const nodes = await Promise.all(nodePromises);

    // Get ZooKeeper info for this datacenter (if available)
    let zkInfo = null;
    if (dcConfig.zookeeperNodes && dcConfig.zookeeperNodes.length > 0) {
      try {
        // Try to get ZK status from current datacenter API
        const zkResponse = await fetch(`http://localhost:3001/api/solr/cluster/zookeeper/${datacenter}/details`);
        if (zkResponse.ok) {
          zkInfo = await zkResponse.json();
        }
      } catch (error) {
        console.warn(`Failed to get ZK info for ${datacenter}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const onlineNodes = nodes.filter(n => n.status === 'online');
    const healthPercentage = nodes.length > 0 ? (onlineNodes.length / nodes.length) * 100 : 0;

    res.json({
      datacenter,
      nodes,
      zkInfo,
      config: {
        totalConfiguredNodes: dcConfig.nodes?.length || 0,
        zkNodes: dcConfig.zookeeperNodes || []
      },
      summary: {
        totalNodes: nodes.length,
        onlineNodes: onlineNodes.length,
        healthPercentage: healthPercentage,
        status: healthPercentage === 100 ? 'healthy' : healthPercentage > 0 ? 'degraded' : 'offline'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error fetching datacenter ${req.params.datacenter}:`, error);
    res.status(500).json({ 
      error: `Failed to fetch datacenter ${req.params.datacenter}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;