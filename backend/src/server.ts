import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import solrRoutes from './routes/solr';
import coresRoutes from './routes/cores';
import loggingRoutes from './routes/logging';
import loggingLevelsRoutes from './routes/loggingLevels';
import securityRoutes from './routes/security';
import metricsRoutes from './routes/metrics';

import zookeeperTreeRoutes from './routes/zookeeperTree';
import zookeeperStatusRoutes from './routes/zookeeperStatus';

import schemaDesignerRouter from './routes/schemaDesigner';
import solrInfoPropertiesRouter from './routes/solrInfoProperties';
import infoThreadsRouter from './routes/infoThreads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/solr', solrRoutes);
app.use('/api/solr', coresRoutes);
app.use('/api/solr/logging', loggingRoutes);
app.use('/api/solr/logging', loggingLevelsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/solr', metricsRoutes);
app.use('/api/solr', zookeeperTreeRoutes);
app.use('/api/solr', zookeeperStatusRoutes);
app.use('/api/schema-designer', schemaDesignerRouter);
app.use('/api/solr', solrInfoPropertiesRouter);
app.use('/api', infoThreadsRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'public')));

  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SolrLens Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Configuration: ${process.env.DC_CONFIG_PATH || 'Using fallback sample config'}`);
});
