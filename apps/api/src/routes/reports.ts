import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const reportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum(['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other']),
  details: z.string().max(1000).optional(),
});

// POST /api/reports
router.post('/', async (req: AuthRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid report data' });
    return;
  }
  const { reportedId, reason, details } = parsed.data;
  if (reportedId === req.userId) {
    res.status(400).json({ error: 'Cannot report yourself' });
    return;
  }
  try {
    const report = await prisma.report.create({
      data: { reporterId: req.userId!, reportedId, reason, details },
    });
    res.status(201).json(report);
  } catch {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

export default router;
