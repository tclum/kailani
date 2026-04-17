import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { validate, updateBrandSchema } from '../lib/validate';
import { prisma } from '../lib/prisma';

const router = Router();

// Must be before /:id
router.get('/me', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
  const profile = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!profile) {
    res.status(404).json({ error: 'Brand profile not found' });
    return;
  }
  res.json(profile);
});

router.get('/:id', async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, email: true, approved: true, verified: true } } },
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

router.post(
  '/me/profile-image',
  requireAuth,
  requireRole('BRAND'),
  uploadSingle('image'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const file = req.file as Express.Multer.File & { path: string };
    if (!file.path) {
      res.status(500).json({ error: 'Upload succeeded but URL was not returned' });
      return;
    }
    const profile = await prisma.brandProfile.upsert({
      where: { userId: req.userId! },
      update: { profileImage: file.path },
      create: { userId: req.userId!, brandName: '', profileImage: file.path },
    });
    res.json({ url: file.path, profile });
  }
);

router.post(
  '/me/logo',
  requireAuth,
  requireRole('BRAND'),
  uploadSingle('image'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const file = req.file as Express.Multer.File & { path: string };
    if (!file.path) {
      res.status(500).json({ error: 'Upload succeeded but URL was not returned' });
      return;
    }
    const profile = await prisma.brandProfile.upsert({
      where: { userId: req.userId! },
      update: { logoUrl: file.path },
      create: { userId: req.userId!, brandName: '', logoUrl: file.path },
    });
    res.json({ url: file.path, profile });
  }
);

export default router;
