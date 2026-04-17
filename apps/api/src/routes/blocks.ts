import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const blockSchema = z.object({ blockedId: z.string().min(1) });

// POST /api/blocks
router.post('/', async (req: AuthRequest, res) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'blockedId required' });
    return;
  }
  const { blockedId } = parsed.data;
  if (blockedId === req.userId) {
    res.status(400).json({ error: 'Cannot block yourself' });
    return;
  }
  try {
    const block = await prisma.block.create({
      data: { blockerId: req.userId!, blockedId },
    });
    res.status(201).json(block);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Already blocked' });
    } else {
      res.status(500).json({ error: 'Failed to block user' });
    }
  }
});

// DELETE /api/blocks/:blockedId
router.delete('/:blockedId', async (req: AuthRequest, res) => {
  await prisma.block.deleteMany({
    where: { blockerId: req.userId!, blockedId: req.params.blockedId },
  });
  res.status(204).send();
});

// GET /api/blocks — list blocked user IDs for current user
router.get('/', async (req: AuthRequest, res) => {
  const blocks = await prisma.block.findMany({
    where: { blockerId: req.userId! },
    select: { blockedId: true },
  });
  res.json({ blockedIds: blocks.map((b) => b.blockedId) });
});

export default router;
