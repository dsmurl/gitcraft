import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load shared env first (workspace root), then allow app-specific overrides.
dotenv.config({ path: resolve(process.cwd(), '../../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import express from 'express';
import { router as apiRouter } from '@/routes';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// CORS: allowlist multiple origins via API_WEB_ORIGINS (comma-separated) and reflect matching origin.
const allowedOrigins: string[] = (
  (process.env.API_WEB_ORIGINS as string) ??
  'http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const originHeader = req.headers.origin as string | undefined;

  if (originHeader && allowedOrigins.includes(originHeader)) {
    res.header('Access-Control-Allow-Origin', originHeader);
    res.header('Vary', 'Origin');
  }

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

// Start server: prefer API_PORT.
const port = Number(process.env.API_PORT ?? 3001);
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});
