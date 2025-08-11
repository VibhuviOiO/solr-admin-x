import express, { Request, Response } from 'express';
import { fetchMetrics } from '../services/metricsService';
import { loadDatacenterConfig } from '../utils/datacenter';

const router = express.Router();

// GET /api/solr/metrics?datacenter=dc1&node=solr1
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { node } = req.query;
    if (!node) {
      return res.status(400).json({ error: 'Missing node parameter' });
    }
    const dcConfig = loadDatacenterConfig();
    // Expecting dcConfig to have a datacenters array, each with nodes array
    let foundNode = null;
    let foundHost = null;
    let foundPort = null;
    if (Array.isArray(dcConfig.datacenters)) {
      for (const dc of dcConfig.datacenters) {
        if (Array.isArray(dc.nodes)) {
          for (const n of dc.nodes) {
            if (n.name === node) {
              foundNode = n;
              foundHost = n.host;
              foundPort = n.port;
              break;
            }
          }
        }
        if (foundNode) break;
      }
    }
    if (!foundNode || !foundHost || !foundPort) {
      return res.status(404).json({ error: 'Node not found in any datacenter' });
    }
    const baseUrl = `http://${foundHost}:${foundPort}/solr`;
  const data = await fetchMetrics(baseUrl);
  res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
