import { Router } from 'express';
import { requireAuth, getAuth } from '@clerk/express';

export const testRouter = Router();

// Simple ping
testRouter.get('/ping', (_req, res) => {
  res.json({ ok: true });
});

// GET /api/test/private -> protected endpoint (requires valid Clerk bearer token)
testRouter.get('/private', requireAuth(), (req, res) => {
  const { userId, sessionId, orgId } = getAuth(req);
  res.json({ ok: true, userId, sessionId, orgId });
});
