import express, { Request, Response } from 'express';
import { ZookeeperTreeService } from '../services/zookeeperTreeService';
import { DatacenterConfig } from '../interfaces/datacenterConfig';
import { ZookeeperTreeResponse } from '../interfaces/zookeeperTreeResponse';
import { loadDatacenterConfig } from '../utils/datacenter';

const router = express.Router();

router.get('/admin/zookeeper/tree', async (req: Request, res: Response) => {
  try {
    const nodeParam = req.query.node as string;
    const datacenterParam = req.query.datacenter as string;
    const dcData: DatacenterConfig = loadDatacenterConfig();
    let baseUrl = '';
    if (nodeParam) {
      for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          if (node.name === nodeParam) {
            baseUrl = `http://${node.host}:${node.port}`;
            break;
          }
        }
        if (baseUrl) break;
      }
    } else if (datacenterParam) {
      const dc = dcData.datacenters.find(dc => dc.name === datacenterParam);
      if (dc && dc.nodes.length > 0) {
        const node = dc.nodes[0];
        baseUrl = `http://${node.host}:${node.port}`;
      }
    } else {
      outer: for (const dc of dcData.datacenters) {
        for (const node of dc.nodes) {
          baseUrl = `http://${node.host}:${node.port}`;
          break outer;
        }
      }
    }
    if (!baseUrl) {
      return res.status(404).json({ error: 'No Solr node found for ZooKeeper tree' });
    }
    const zkTreeService = new ZookeeperTreeService(baseUrl);
    const tree: ZookeeperTreeResponse = await zkTreeService.getZookeeperTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ZooKeeper tree', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
