import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { validate, updateBrandSchema } from '../lib/validate';
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

router.put('/me', requireAuth, requireRole('BRAND'), validate(updateBrandSchema), async (req: AuthRequest, res) => {
  const profile = await prisma.brandProfile.upsert({
    where: { userId: req.userId! },
    update: req.body,
    create: { userId: req.userId!, brandName: req.body.brandName ?? '', ...req.body },
  });
  res.json(profile);
});

export default router;
