import 'dotenv/config';
import express from 'express';
import { router as apiRouter } from '@/routes';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// Basic CORS for dev: allow web client to call API and send Authorization header
app.use((req, res, next) => {
  const origin = (process.env.WEB_ORIGIN as string) ?? 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// Middleware
app.use(express.json());

// Attach Clerk auth to every request; requires CLERK_SECRET_KEY in env
app.use(clerkMiddleware());

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
