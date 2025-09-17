import { Router } from 'express';
import { router as testRouter } from '@/routes/test';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'API root' });
});

// Group: /api/test
router.use('/test', testRouter);
