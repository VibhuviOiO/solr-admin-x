import { Router, Request, Response } from 'express';
import { getLoggingInfo } from '../services/loggingInfoService';
import { LoggingInfoResponse } from '../interfaces/loggingInfoResponse';

const router = Router();

// GET /api/solr/logging/info?node=solr1
router.get('/info', async (req: Request, res: Response) => {
	const node = req.query.node as string;
	if (!node) {
		return res.status(400).json({ error: 'Missing node parameter' });
	}
	try {
		const loggingInfo: LoggingInfoResponse = await getLoggingInfo(node);
		res.json(loggingInfo);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message || 'Failed to fetch logging info' });
	}
});

export default router;
