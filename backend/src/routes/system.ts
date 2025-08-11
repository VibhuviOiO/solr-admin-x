import express, { Request, Response } from 'express';
import axios from 'axios';
import { SystemInfoResponse } from '../interfaces/systemInfoResponse';
import { loadDatacenterConfig } from '../utils/datacenter';
import { DatacenterConfig } from '../interfaces/datacenterConfig';

const router = express.Router();

// Get system info for a specific node or first available node
router.get('/system/info', async (req: Request, res: Response) => {
  try {
    const nodeParam = req.query.node as string;
    const dcData: DatacenterConfig = loadDatacenterConfig();
    if (nodeParam) {
      for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          if (node.name === nodeParam) {
            const nodeUrl = `http://${node.host}:${node.port}/solr`;
            try {
              const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
              return res.json({
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'online' as const,
                systemInfo: response.data as SystemInfoResponse
              });
            } catch (error) {
              return res.json({
                id: `${node.name}-${dc.name.toLowerCase()}`,
                name: node.name,
                url: nodeUrl,
                datacenter: dc.name,
                status: 'offline' as const,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }
      return res.status(404).json({ error: 'Node not found' });
    }
    for (const dc of dcData.datacenters) {
      for (const node of dc.nodes) {
        const nodeUrl = `http://${node.host}:${node.port}/solr`;
        try {
          const response = await axios.get(`${nodeUrl}/admin/info/system?wt=json`);
          return res.json({
            id: `${node.name}-${dc.name.toLowerCase()}`,
            name: node.name,
            url: nodeUrl,
            datacenter: dc.name,
            status: 'online' as const,
            systemInfo: response.data as SystemInfoResponse
          });
        } catch (error) {
          continue;
        }
      }
    }
    res.status(500).json({ error: 'No available Solr nodes found' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
