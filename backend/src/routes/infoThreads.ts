import express, { Request, Response } from 'express';
import { infoThreadsService } from '../services/infoThreadsService';

const router = express.Router();

// GET /api/info/threads
router.get('/info/threads', async (req: Request, res: Response) => {
  try {
    const data = await infoThreadsService.getInfoThreads();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
