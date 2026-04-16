import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/:id', async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, email: true, approved: true } } },
  });
  if (!brand) {
    res.status(404).json({ error: 'Brand not found' });
    return;
  }
  res.json(brand);
});

router.put('/me', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
  const allowed = ['brandName', 'industry', 'website', 'logoUrl', 'bio', 'location'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }

  const profile = await prisma.brandProfile.upsert({
    where: { userId: req.userId! },
    update: data,
    create: { userId: req.userId!, brandName: (data.brandName as string) ?? '', ...data },
  });
  res.json(profile);
});

export default router;
