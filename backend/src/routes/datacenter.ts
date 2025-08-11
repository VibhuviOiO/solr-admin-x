import express, { Request, Response } from 'express';
import { DatacenterConfig, DataCenter } from '../interfaces/datacenterConfig';
import { loadDatacenterConfig } from '../utils/datacenter';

const router = express.Router();

// Get datacenter configuration
router.get('/datacenters', async (req: Request, res: Response) => {
  // ...implement as in original, using imported interfaces...
});

// Get datacenter summary
router.get('/datacenters/summary', async (req: Request, res: Response) => {
  // ...implement as in original, using imported interfaces...
});

export default router;
