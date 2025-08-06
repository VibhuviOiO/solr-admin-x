import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import solrRoutes from './routes/solr';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/solr', solrRoutes);

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
  res.json({ status: 'OK', message: 'Solr Admin X Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Using datacenter configuration from dc-data.json');
});
