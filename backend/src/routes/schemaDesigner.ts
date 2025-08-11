import express, { Request, Response } from 'express';
import { schemaDesignerService } from '../services/schemaDesignerService';

const router = express.Router();

// GET /api/schema-designer/configs
router.get('/configs', (req: Request, res: Response) => {
  try {
    const result = schemaDesignerService.getConfigSets();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/schema-designer/configs
router.post('/configs', (req: Request, res: Response) => {
  try {
    const { name, copyFrom } = req.body;
    const result = schemaDesignerService.createConfigSet(name, copyFrom);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/schema-designer/configs/:configSet/info
router.get('/configs/:configSet/info', (req: Request, res: Response) => {
  try {
    const { configSet } = req.params;
    const result = schemaDesignerService.getConfigSetInfo(configSet);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// TODO: Add endpoints for prep, analyze, add, update, publish, diff, file, sample, query, download, etc.

// POST /api/schema-designer/configs/:configSet/prep
router.post('/configs/:configSet/prep', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/schema-designer/configs/:configSet/analyze
router.post('/configs/:configSet/analyze', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/schema-designer/configs/:configSet/add
router.post('/configs/:configSet/add', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// PUT /api/schema-designer/configs/:configSet/update
router.put('/configs/:configSet/update', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// PUT /api/schema-designer/configs/:configSet/publish
router.put('/configs/:configSet/publish', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/schema-designer/configs/:configSet/diff
router.get('/configs/:configSet/diff', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/schema-designer/configs/:configSet/file
router.get('/configs/:configSet/file', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/schema-designer/configs/:configSet/file
router.post('/configs/:configSet/file', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/schema-designer/configs/:configSet/sample
router.get('/configs/:configSet/sample', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/schema-designer/configs/:configSet/sample
router.post('/configs/:configSet/sample', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/schema-designer/configs/:configSet/query
router.get('/configs/:configSet/query', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/schema-designer/download/:filename
router.get('/download/:filename', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
