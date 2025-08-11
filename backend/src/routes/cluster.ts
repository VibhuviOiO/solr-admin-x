import express, { Request, Response } from 'express';
import axios from 'axios';
import { DatacenterConfig, ClusterNode } from '../interfaces/datacenterConfig';
import { loadDatacenterConfig } from '../utils/datacenter';

const router = express.Router();

// Get all cluster nodes information
router.get('/cluster/nodes', async (req: Request, res: Response) => {
  // ...implement as in original, using imported interfaces...
});

// Get specific node information
router.get('/cluster/nodes/:nodeId', async (req: Request, res: Response) => {
  // ...implement as in original, using imported interfaces...
});

export default router;
