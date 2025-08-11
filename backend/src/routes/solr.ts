
import express, { Request, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Load datacenter configuration from environment or file
function loadDatacenterConfig() {
  if (!process.env.DC_CONFIG_PATH) {
    throw new Error('DC_CONFIG_PATH environment variable is required. Please set it to point to your datacenter configuration file.');
  }
  const configPath = process.env.DC_CONFIG_PATH;
  try {
    const dcDataRaw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(dcDataRaw);
  } catch (error) {
    console.error(`Error loading datacenter config from ${configPath}:`, error);
    throw new Error(`Failed to load datacenter config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const dcDataConfig = loadDatacenterConfig();
// Configuration loaded successfully

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

interface DatacenterConfig {
  datacenters: DataCenter[];
}

// Generate SOLR_NODES from datacenter configuration
// Fix the SOLR_NODES generation with proper typing
const SOLR_NODES: SolrNodeInfo[] = dcDataConfig.datacenters?.flatMap((dc: DataCenter, dcIndex: number) => 
  dc.nodes.map((node: ClusterNode, nodeIndex: number) => ({
    id: `${node.name}-${dc.name.toLowerCase()}`,
    name: node.name,
    url: `http://${node.host}:${node.port}/solr`,
    datacenter: dc.name,
    host: node.host,
    port: node.port,
    default: nodeIndex === 0,
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
  // ...existing code...
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
router.get('/system/info', async (req: Request, res: Response) => {
  try {
    const nodeParam = req.query.node as string;
    
    // Load datacenter configuration using the same method as other endpoints
    const dcData: DatacenterConfig = loadDatacenterConfig();
    
    // If nodeParam is provided, try to find specific node
    if (nodeParam) {
      for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          if (node.name === nodeParam) {
            const nodeUrl = `http://${node.host}:${node.port}/solr`;
            try {
              const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
              
              const nodeInfo = {
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'online' as const,
                systemInfo: response.data
              };
              
              return res.json(nodeInfo);
            } catch (error) {
              console.error(`Error fetching system info from node ${node.name}:`, error);
              
              const nodeInfo = {
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'offline' as const,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
              
              return res.json(nodeInfo);
            }
          }
        }
      }
      
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If no specific node, get first available node (original behavior)
    for (const dc of dcData.datacenters) {
      for (const node of dc.nodes) {
        const nodeUrl = `http://${node.host}:${node.port}/solr`;
        try {
          const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
          
          const nodeInfo = {
            id: `${node.name}-${dc.name.toLowerCase()}`,
            name: node.name,
            url: nodeUrl,
            datacenter: dc.name,
            status: 'online' as const,
            systemInfo: response.data
          };
          
          return res.json(nodeInfo);
        } catch (error) {
          console.error(`Error fetching system info from node ${node.name}:`, error);
          continue;
        }
      }
    }
    
    res.status(500).json({ error: 'No available Solr nodes found' });
  } catch (error) {
    console.error('Error in /system/info endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    
    // Load nodes with filtering
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

// Datacenter configuration endpoint (alternative path for frontend dashboard)
router.get('/datacenter-config', async (req: Request, res: Response) => {
  try {
    // Return the same datacenter configuration in expected format
    res.json(dcDataConfig);
  } catch (error) {
    console.error('Error fetching datacenter config:', error);
    res.status(500).json({
      error: 'Failed to fetch datacenter configuration',
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
                }
              }
            } catch (zkError) {
              // ZK health check failed - node will show as unhealthy
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

// Get nodes for a specific datacenter
router.get('/datacenter/:datacenter/nodes', async (req: Request, res: Response) => {
  try {
    const { datacenter } = req.params;
    const decodedDatacenter = decodeURIComponent(datacenter);
    
    console.log('Fetching nodes for datacenter:', decodedDatacenter);
    console.log('Available datacenters:', dcDataConfig.datacenters?.map((dc: DataCenter) => dc.name));
    
    // Find the datacenter configuration
    const dcConfig = dcDataConfig.datacenters?.find((dc: DataCenter) => 
      dc.name.toLowerCase() === decodedDatacenter.toLowerCase()
    );
    
    if (!dcConfig) {
      console.error(`Datacenter '${decodedDatacenter}' not found`);
      return res.status(404).json({
        datacenter: decodedDatacenter,
        status: 'error',
        error: `Datacenter '${decodedDatacenter}' not found`,
        availableDatacenters: dcDataConfig.datacenters?.map((dc: DataCenter) => dc.name) || [],
        nodes: []
      });
    }
    
    console.log('Found datacenter config:', dcConfig.name);
    
    // Get nodes for this datacenter
    const datacenterNodes = SOLR_NODES.filter(node => 
      node.datacenter.toLowerCase() === decodedDatacenter.toLowerCase()
    );
    
    console.log('Found nodes:', datacenterNodes.length);
    
    const nodesWithInfo = await Promise.all(
      datacenterNodes.map(async (node: any) => {
        try {
          console.log(`Fetching data for node ${node.id} at ${node.url}`);
          
          // Fetch system info and metrics for each node
          const [systemResponse, metricsResponse] = await Promise.allSettled([
            axios.get(`${node.url}/admin/info/system`, { timeout: 10000 }),
            axios.get(`${node.url}/admin/metrics`, { timeout: 10000 })
          ]);
          
          let systemInfo = null;
          let metrics = null;
          let status: 'online' | 'offline' | 'error' = 'offline';
          let error = null;
          
          // Process system info
          if (systemResponse.status === 'fulfilled' && systemResponse.value.status === 200) {
            const systemData = systemResponse.value.data;
            const nodeKey = Object.keys(systemData).find(key => key !== 'responseHeader');
            if (nodeKey) {
              systemInfo = systemData[nodeKey];
              status = 'online';
              console.log(`System info for ${node.id}: OK`);
            }
          } else {
            error = 'Failed to fetch system info';
            console.error(`System info for ${node.id}: ${systemResponse.status === 'rejected' ? systemResponse.reason.message : 'Unknown error'}`);
          }
          
          // Process metrics
          if (metricsResponse.status === 'fulfilled' && metricsResponse.value.status === 200) {
            const metricsData = metricsResponse.value.data;
            const nodeKey = Object.keys(metricsData).find(key => key !== 'responseHeader');
            if (nodeKey) {
              metrics = metricsData[nodeKey];
              console.log(`Metrics for ${node.id}: OK`);
            }
          } else {
            console.error(`Metrics for ${node.id}: ${metricsResponse.status === 'rejected' ? metricsResponse.reason.message : 'Unknown error'}`);
          }
          
          // If system info failed but we got metrics, try to infer some info
          if (status === 'offline' && metrics) {
            status = 'error';
            error = 'System info unavailable but metrics accessible';
          }
          
          // TODO: Fetch collections and cores info
          // This would require additional Solr API calls like:
          // - /solr/admin/collections?action=CLUSTERSTATUS
          // - /solr/admin/cores?action=STATUS
          const collections: string[] = [];
          const cores: string[] = [];
          
          return {
            ...node,
            status,
            systemInfo,
            metrics,
            error,
            collections,
            cores
          };
        } catch (nodeError) {
          console.error(`Error fetching data for node ${node.id}:`, nodeError);
          return {
            ...node,
            status: 'error' as const,
            error: nodeError instanceof Error ? nodeError.message : 'Unknown error',
            collections: [],
            cores: []
          };
        }
      })
    );
    
    res.json({
      datacenter: decodedDatacenter,
      status: 'success',
      nodes: nodesWithInfo
    });
    
  } catch (error) {
    console.error(`Error fetching nodes for datacenter ${req.params.datacenter}:`, error);
    res.status(500).json({
      datacenter: req.params.datacenter,
      status: 'error',
      error: `Failed to fetch nodes for datacenter ${req.params.datacenter}`,
      details: error instanceof Error ? error.message : 'Unknown error',
      nodes: []
    });
  }
});

// Fix the properties endpoint with proper typing
router.get('/admin/properties/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    
    // Find the node configuration
    const config: DatacenterConfig = loadDatacenterConfig();
    let nodeConfig: ClusterNode | null = null;
    
    // Find the node across all datacenters
    for (const dc of config.datacenters) {
      const node = dc.nodes.find((n: ClusterNode) => n.name === nodeId);
      if (node) {
        nodeConfig = node;
        break;
      }
    }
    
    if (!nodeConfig) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const solrUrl = `http://${nodeConfig.host}:${nodeConfig.port}/solr/admin/info/properties`;
    
    console.log(`Fetching properties from: ${solrUrl}`);
    
    const response = await axios.get(solrUrl);
    if (!response.data) {
      throw new Error(`Solr properties API returned empty response`);
    }
    
    // Transform the properties data for easier frontend consumption
    const properties = response.data['system.properties'] || {};
    
    res.json({
      node: nodeConfig.name,
      properties: properties,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching Solr properties:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system properties',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix the security endpoint with proper typing
router.get('/admin/security/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    
    // Find the node configuration
    const config: DatacenterConfig = loadDatacenterConfig();
    let nodeConfig: ClusterNode | null = null;
    
    // Find the node across all datacenters
    for (const dc of config.datacenters) {
      const node = dc.nodes.find((n: ClusterNode) => n.name === nodeId);
      if (node) {
        nodeConfig = node;
        break;
      }
    }
    
    if (!nodeConfig) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Define security configuration interface
    interface SecurityConfig {
      authentication: { enabled: boolean; scheme: string | null; realm: string | null };
      authorization: { enabled: boolean; class: string | null };
      ssl: { 
        enabled: boolean;
        clientAuth: boolean;
        keyStore: string | null;
        trustStore: string | null;
      };
    }

    const security: SecurityConfig = {
      authentication: { enabled: false, scheme: null, realm: null },
      authorization: { enabled: false, class: null },
      ssl: { 
        enabled: nodeConfig.port === 8443 || nodeConfig.host.includes('https'),
        clientAuth: false,
        keyStore: null,
        trustStore: null
      }
    };

    try {
      // Try to get system info for security detection
      const systemUrl = `http://${nodeConfig.host}:${nodeConfig.port}/solr/admin/info/system?wt=json`;
      const systemResponse = await axios.get(systemUrl, { timeout: 5000 });
      
      if (systemResponse.data?.jvm) {
        const jvm = systemResponse.data.jvm;
        
        // Check JVM arguments for security indicators
        const jvmArgs = JSON.stringify(jvm).toLowerCase();
        
        if (jvmArgs.includes('solr.authentication') || jvmArgs.includes('basicauth')) {
          security.authentication.enabled = true;
          security.authentication.scheme = 'BasicAuth';
        }
        
        if (jvmArgs.includes('solr.authorization') || jvmArgs.includes('rulebasedauthorization')) {
          security.authorization.enabled = true;
          security.authorization.class = 'RuleBasedAuthorizationPlugin';
        }

        // SSL detection from system properties
        if (jvmArgs.includes('ssl') || jvmArgs.includes('https') || jvmArgs.includes('keystore')) {
          security.ssl.enabled = true;
          if (jvmArgs.includes('clientauth')) {
            security.ssl.clientAuth = true;
          }
        }
      }
    } catch (systemError) {
      console.warn(`Could not fetch system info for security detection: ${systemError instanceof Error ? systemError.message : 'Unknown error'}`);
    }
    
    res.json({
      node: nodeConfig.name,
      security: security,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching security info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix the system info endpoint with proper typing
router.get('/system/info', async (req: Request, res: Response) => {
  try {
    const nodeParam = req.query.node as string;
    
    // Load datacenter configuration using the same method as other endpoints
    const dcData: DatacenterConfig = loadDatacenterConfig();
    
    // If nodeParam is provided, try to find specific node
    if (nodeParam) {
      for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          if (node.name === nodeParam) {
            const nodeUrl = `http://${node.host}:${node.port}/solr`;
            try {
              const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
              
              const nodeInfo = {
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'online' as const,
                systemInfo: response.data
              };
              
              return res.json(nodeInfo);
            } catch (error) {
              console.error(`Error fetching system info from node ${node.name}:`, error);
              
              const nodeInfo = {
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'offline' as const,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
              
              return res.json(nodeInfo);
            }
          }
        }
      }
      
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If no specific node, get first available node (original behavior)
    for (const dc of dcData.datacenters) {
      for (const node of dc.nodes) {
        const nodeUrl = `http://${node.host}:${node.port}/solr`;
        try {
          const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
          
          const nodeInfo = {
            id: `${node.name}-${dc.name.toLowerCase()}`,
            name: node.name,
            url: nodeUrl,
            datacenter: dc.name,
            status: 'online' as const,
            systemInfo: response.data
          };
          
          return res.json(nodeInfo);
        } catch (error) {
          console.error(`Error fetching system info from node ${node.name}:`, error);
          continue;
        }
      }
    }
    
    res.status(500).json({ error: 'No available Solr nodes found' });
  } catch (error) {
    console.error('Error in /system/info endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logging interfaces
interface SolrLogger {
  name: string;
  level: string;
  set: boolean;
}

interface SolrLoggingResponse {
  responseHeader: {
    status: number;
  // ...existing code...
  };
  levels: string[];
  loggers: SolrLogger[];
  watcher: string;
}

interface NodeLoggingResponse {
  nodeId: string;
  nodeName: string;
  host: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  loggingInfo?: {
    levels: string[];
    loggers: SolrLogger[];
    watcher: string;
    rootLogger: {
      level: string;
    };
  };
  error?: string;
  timestamp: string;
}

// Get logging information for all nodes in a datacenter
router.get('/datacenter/:datacenter/logging', async (req: Request, res: Response) => {
  try {
    const { datacenter } = req.params;
    const decodedDatacenter = decodeURIComponent(datacenter);
    
    console.log('Fetching logging info for datacenter:', decodedDatacenter);
    
    // Find the datacenter configuration
    const config: DatacenterConfig = loadDatacenterConfig();
    const dcConfig = config.datacenters?.find((dc: DataCenter) => 
      dc.name.toLowerCase() === decodedDatacenter.toLowerCase()
    );
    
    if (!dcConfig) {
      return res.status(404).json({
        datacenter: decodedDatacenter,
        status: 'error',
        error: `Datacenter '${decodedDatacenter}' not found`,
        nodes: []
      });
    }
    
    // Get logging info from all nodes in the datacenter
    const nodeLoggingPromises = dcConfig.nodes.map(async (nodeConfig: ClusterNode): Promise<NodeLoggingResponse> => {
      const nodeId = `${nodeConfig.name}-${decodedDatacenter.toLowerCase()}`;
      
      try {
        // Get logging information directly
        const loggingUrl = `http://${nodeConfig.host}:${nodeConfig.port}/solr/admin/info/logging?wt=json`;
        console.log(`Fetching logging from: ${loggingUrl}`);
        
        const loggingResponse = await axios.get(loggingUrl, { timeout: 10000 });
        
        if (loggingResponse.data?.responseHeader?.status === 0) {
          const solrLoggingData: SolrLoggingResponse = loggingResponse.data;
          
          // Find root logger level
          const rootLogger = solrLoggingData.loggers.find(logger => logger.name === 'root');
          
          return {
            nodeId,
            nodeName: nodeConfig.name,
            host: nodeConfig.host,
            port: nodeConfig.port,
            status: 'online',
            loggingInfo: {
              levels: solrLoggingData.levels || ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'],
              loggers: solrLoggingData.loggers || [],
              watcher: solrLoggingData.watcher || 'Unknown',
              rootLogger: {
                level: rootLogger?.level || 'WARN'
              }
            },
            timestamp: new Date().toISOString()
          };
        } else {
          throw new Error('Invalid logging response from Solr');
        }
        
      } catch (error) {
        console.error(`Error fetching logging info for node ${nodeConfig.name}:`, error);
        return {
          nodeId,
          nodeName: nodeConfig.name,
          host: nodeConfig.host,
          port: nodeConfig.port,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });
    
    const nodesLogging = await Promise.all(nodeLoggingPromises);
    
    res.json({
      datacenter: decodedDatacenter,
      status: 'success',
      nodes: nodesLogging,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error fetching logging info for datacenter ${req.params.datacenter}:`, error);
    res.status(500).json({
      datacenter: req.params.datacenter,
      status: 'error',
      error: 'Failed to fetch logging information',
      details: error instanceof Error ? error.message : 'Unknown error',
      nodes: []
    });
  }
});

// Get specific node logging details - simplified for now as Solr doesn't provide log history by default
router.get('/datacenter/:datacenter/logging/:nodeId', async (req: Request, res: Response) => {
  try {
    const { datacenter, nodeId } = req.params;
    const decodedDatacenter = decodeURIComponent(datacenter);
    
    // Find the datacenter and node configuration
    const config: DatacenterConfig = loadDatacenterConfig();
    const dcConfig = config.datacenters?.find((dc: DataCenter) => 
      dc.name.toLowerCase() === decodedDatacenter.toLowerCase()
    );
    
    if (!dcConfig) {
      return res.status(404).json({ error: `Datacenter '${decodedDatacenter}' not found` });
    }
    
    const nodeConfig = dcConfig.nodes.find((n: ClusterNode) => n.name === nodeId);
    if (!nodeConfig) {
      return res.status(404).json({ error: `Node '${nodeId}' not found in datacenter '${decodedDatacenter}'` });
    }
    
    // Get detailed logging configuration
    const loggingUrl = `http://${nodeConfig.host}:${nodeConfig.port}/solr/admin/info/logging?wt=json`;
    console.log(`Fetching detailed logging from: ${loggingUrl}`);
    
    const response = await axios.get(loggingUrl, { timeout: 10000 });
    
    if (response.data?.responseHeader?.status === 0) {
      res.json({
        nodeId,
        nodeName: nodeConfig.name,
        host: nodeConfig.host,
        port: nodeConfig.port,
        loggingData: response.data,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Invalid logging response from Solr');
    }
    
  } catch (error) {
    console.error(`Error fetching detailed logging for node ${req.params.nodeId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch detailed logging information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;