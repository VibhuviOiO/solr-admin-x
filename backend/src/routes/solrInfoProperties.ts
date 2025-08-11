import express, { Request, Response } from 'express';
import { solrInfoPropertiesService } from '../services/solrInfoPropertiesService';

const router = express.Router();

// GET /api/solr/admin/info/properties
router.get('/admin/info/properties', async (req: Request, res: Response) => {
  try {
    const data = await solrInfoPropertiesService.getInfoProperties();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
