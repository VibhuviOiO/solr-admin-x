import express, { Request, Response } from 'express';
import axios from 'axios';
import { DatacenterConfig, ClusterNode } from '../interfaces/datacenterConfig';
import { loadDatacenterConfig } from '../utils/datacenter';

const router = express.Router();

// Get properties for a node
router.get('/admin/properties/:nodeId', async (req: Request, res: Response) => {
  // ...implement as in original, using imported interfaces...
});

export default router;
