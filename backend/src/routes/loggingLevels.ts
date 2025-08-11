import { Router, Request, Response } from 'express';
import { getLoggingLevels } from '../services/loggingLevelService';
import { LoggingLevelDefinition } from '../interfaces/loggingLevelDefinition';

const router = Router();

// GET /api/solr/logging/levels?node=solr1
router.get('/levels', async (req: Request, res: Response) => {
  const node = req.query.node as string;
  if (!node) {
    return res.status(400).json({ error: 'Missing node parameter' });
  }
  try {
    const levels: LoggingLevelDefinition = await getLoggingLevels(node);
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch logging levels' });
  }
});

export default router;
