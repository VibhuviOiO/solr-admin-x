import express, { Request, Response } from 'express';
import { SecurityService } from '../services/securityService';

const router = express.Router();

// GET /api/security/authentication
router.get('/authentication', async (req: Request, res: Response) => {
  const node = req.query.node as string | undefined;
  try {
    const data = await SecurityService.getSecurity('authentication', node);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch authentication config' });
  }
});

// POST /api/security/authentication
router.post('/authentication', async (req: Request, res: Response) => {
  const node = req.query.node as string | undefined;
  try {
    const data = await SecurityService.postSecurity('authentication', req.body, node);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update authentication config' });
  }
});

// GET /api/security/authorization
router.get('/authorization', async (req: Request, res: Response) => {
  const node = req.query.node as string | undefined;
  try {
    const data = await SecurityService.getSecurity('authorization', node);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch authorization config' });
  }
});

// POST /api/security/authorization
router.post('/authorization', async (req: Request, res: Response) => {
  const node = req.query.node as string | undefined;
  try {
    const data = await SecurityService.postSecurity('authorization', req.body, node);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update authorization config' });
  }
});

export default router;
