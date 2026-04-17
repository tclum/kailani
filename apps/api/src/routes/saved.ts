import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const saveSchema = z.object({
  savedId: z.string().min(1),
  boardName: z.string().min(1).max(50).default('Saved'),
});

// GET /api/saved
router.get('/', async (req: AuthRequest, res) => {
  const saved = await prisma.savedProfile.findMany({
    where: { savedById: req.userId! },
    orderBy: { createdAt: 'desc' },
    include: {
      savedBy: {
        select: {
          id: true, role: true,
          modelProfile: { select: { id: true, userId: true, displayName: true, profileImage: true, coverImage: true, location: true, tags: true } },
          photographerProfile: { select: { id: true, userId: true, displayName: true, profileImage: true, location: true, specialties: true } },
          brandProfile: { select: { id: true, userId: true, brandName: true, logoUrl: true, profileImage: true, location: true } },
        },
      },
    },
  });

  // Attach saved user info — we need to look up the savedId user
  const savedUserIds = [...new Set(saved.map((s) => s.savedId))];
  const savedUsers = await prisma.user.findMany({
    where: { id: { in: savedUserIds } },
    select: {
      id: true, role: true,
      modelProfile: { select: { id: true, userId: true, displayName: true, profileImage: true, coverImage: true, location: true, tags: true } },
      photographerProfile: { select: { id: true, userId: true, displayName: true, profileImage: true, location: true, specialties: true } },
      brandProfile: { select: { id: true, userId: true, brandName: true, logoUrl: true, profileImage: true, location: true } },
    },
  });
  const userMap = new Map(savedUsers.map((u) => [u.id, u]));

  const grouped: Record<string, any[]> = {};
  for (const s of saved) {
    const user = userMap.get(s.savedId);
    if (!user) continue;
    if (!grouped[s.boardName]) grouped[s.boardName] = [];
    grouped[s.boardName].push({ savedId: s.id, savedUserId: s.savedId, boardName: s.boardName, createdAt: s.createdAt, user });
  }

  res.json({ grouped, boards: Object.keys(grouped) });
});

// POST /api/saved
router.post('/', async (req: AuthRequest, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'savedId required' });
    return;
  }
  const { savedId, boardName } = parsed.data;
  try {
    const entry = await prisma.savedProfile.create({
      data: { savedById: req.userId!, savedId, boardName },
    });
    res.status(201).json(entry);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Already saved to this board' });
    } else {
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }
});

// DELETE /api/saved/:savedId  (savedId = the userId being unsaved)
router.delete('/:savedId', async (req: AuthRequest, res) => {
  const { boardName } = req.query as { boardName?: string };
  if (boardName) {
    await prisma.savedProfile.deleteMany({
      where: { savedById: req.userId!, savedId: req.params.savedId, boardName },
    });
  } else {
    await prisma.savedProfile.deleteMany({
      where: { savedById: req.userId!, savedId: req.params.savedId },
    });
  }
  res.status(204).send();
});

// GET /api/saved/check/:savedId — check if user is saved (and which boards)
router.get('/check/:savedId', async (req: AuthRequest, res) => {
  const entries = await prisma.savedProfile.findMany({
    where: { savedById: req.userId!, savedId: req.params.savedId },
    select: { boardName: true },
  });
  res.json({ saved: entries.length > 0, boards: entries.map((e) => e.boardName) });
});

export default router;
