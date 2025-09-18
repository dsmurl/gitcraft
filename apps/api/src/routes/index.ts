import { Router } from 'express';
import { router as testRouter } from '@/routes/test';
import { router as userRouter } from '@/routes/user';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'API root' });
});

// Group: /api/test
router.use('/test', testRouter);

// Group: /api/user
router.use('/user', userRouter);
