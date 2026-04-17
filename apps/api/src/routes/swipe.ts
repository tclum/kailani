import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getSwipeQueue, recordLike, recordPass, getMatches } from '../services/swipe.service';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const swipeBody = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(['MODEL', 'BRAND', 'PHOTOGRAPHER', 'CAMPAIGN']),
});

// GET /api/swipe/queue
router.get('/queue', async (req: AuthRequest, res) => {
  try {
    const queue = await getSwipeQueue(req.userId!, req.userRole!);
    res.json({ queue });
  } catch (err) {
    console.error('[swipe/queue]', err);
    res.status(500).json({ error: 'Failed to load queue' });
  }
});

// POST /api/swipe/like
router.post('/like', async (req: AuthRequest, res) => {
  const parsed = swipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'targetId and targetType required' });
    return;
  }
  try {
    const result = await recordLike(req.userId!, req.userRole!, parsed.data.targetId, parsed.data.targetType);

    // Auto-save to 'Liked' board when a brand likes a model or photographer
    if (req.userRole === 'BRAND' && (parsed.data.targetType === 'MODEL' || parsed.data.targetType === 'PHOTOGRAPHER')) {
      prisma.savedProfile.upsert({
        where: { savedById_savedId_boardName: { savedById: req.userId!, savedId: parsed.data.targetId, boardName: 'Liked' } },
        create: { savedById: req.userId!, savedId: parsed.data.targetId, boardName: 'Liked' },
        update: {},
      }).catch(() => {});
    }

    res.json(result);
  } catch (err) {
    console.error('[swipe/like]', err);
    res.status(500).json({ error: 'Failed to record like' });
  }
});

// POST /api/swipe/pass
router.post('/pass', async (req: AuthRequest, res) => {
  const parsed = swipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'targetId and targetType required' });
    return;
  }
  try {
    await recordPass(req.userId!, parsed.data.targetId, parsed.data.targetType);
    res.json({ ok: true });
  } catch (err) {
    console.error('[swipe/pass]', err);
    res.status(500).json({ error: 'Failed to record pass' });
  }
});

// GET /api/swipe/matches
router.get('/matches', async (req: AuthRequest, res) => {
  try {
    const matches = await getMatches(req.userId!);
    res.json({ matches });
  } catch (err) {
    console.error('[swipe/matches]', err);
    res.status(500).json({ error: 'Failed to load matches' });
  }
});

export default router;
