import express from 'express';
import { getCores } from '../services/coresService';

const router = express.Router();

// GET /api/solr/admin/cores
router.get('/admin/cores', async (req, res) => {
  try {
    // Support datacenter and node selection via query params
    const datacenter = req.query.datacenter as string | undefined;
    const node = req.query.node as string | undefined;
    const result = await getCores({ datacenter, node, query: req.query });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
