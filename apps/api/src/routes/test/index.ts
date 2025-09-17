import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  readAndIncrement,
} from '@/routes/test/counterStore';

export const router = Router();

// Simple ping
router.get('/ping', (_req, res) => {
  res.json({ ok: true });
});

// GET /api/test/count -> returns current count and increments it
router.get('/count', (_req, res) => {
  const { current, next } = readAndIncrement();
  res.json({ count: current, next });
});

// GET /api/test/settings -> returns current settings
router.get('/settings', (_req, res) => {
  res.json(getSettings());
});

// POST /api/test/settings -> update value and/or step
// Body: { "value"?: number, "step"?: number }
router.post('/settings', (req, res) => {
  const { value, step } = req.body ?? {};
  const updated = updateSettings({ value, step });
  res.json(updated);
});
