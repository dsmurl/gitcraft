import 'dotenv/config';
import express from 'express';
import { router as apiRouter } from '@/routes';

const app = express();

// Middleware
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api', time: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRouter);

// Static (optional): serve a simple index if you want to check quickly
app.get('/', (_req, res) => {
  res.type('text').send('API is running. Try GET /health or /api/test/count');
});

// Start server
const port = Number(process.env.API_PORT ?? 3001);
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});
