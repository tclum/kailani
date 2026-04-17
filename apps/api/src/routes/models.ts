import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { validate, updateModelProfileSchema } from '../lib/validate';
import { listModels, getModel, getMyModel, updateMyModel, addPortfolioImage, removePortfolioImage } from '../services/model.service';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  const { location, tags, page } = req.query;
  const tagArr = tags ? String(tags).split(',') : undefined;

  // Exclude blocked users if authenticated
  let excludeUserIds: string[] | undefined;
  if (req.userId) {
    const [given, received] = await Promise.all([
      prisma.block.findMany({ where: { blockerId: req.userId }, select: { blockedId: true } }),
      prisma.block.findMany({ where: { blockedId: req.userId }, select: { blockerId: true } }),
    ]);
    excludeUserIds = [...given.map((b) => b.blockedId), ...received.map((b) => b.blockerId)];
  }

  const result = await listModels({
    location: location ? String(location) : undefined,
    tags: tagArr,
    page: page ? Number(page) : 1,
    approvedOnly: true,
    excludeUserIds,
  });
  res.json(result);
});

// Must be before /:id to avoid 'me' being treated as an ID
router.get('/me', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
  const profile = await getMyModel(req.userId!);
  if (!profile) {
    res.status(404).json({ error: 'Model profile not found' });
    return;
  }
  res.json(profile);
});

router.get('/:id', async (req, res) => {
  const model = await getModel(req.params.id);
  if (!model || !model.user.approved) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  res.json(model);
});

router.put('/me', requireAuth, requireRole('MODEL'), validate(updateModelProfileSchema), async (req: AuthRequest, res) => {
  const profile = await updateMyModel(req.userId!, req.body);
  res.json(profile);
});

router.post(
  '/me/portfolio',
  requireAuth,
  requireRole('MODEL'),
  uploadSingle('image'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      console.log('[portfolio] upload failed — no file on req');
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // (1) File received
    console.log('[portfolio] file received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // (2) Cloudinary result — multer-storage-cloudinary stores the CDN URL in
    //     req.file.path and the public_id in req.file.filename
    const file = req.file as Express.Multer.File & { path: string; filename: string };
    console.log('[portfolio] cloudinary result:', {
      url: file.path,
      publicId: file.filename,
    });

    if (!file.path) {
      console.error('[portfolio] cloudinary URL missing from req.file.path — full req.file:', req.file);
      res.status(500).json({ error: 'Upload succeeded but URL was not returned' });
      return;
    }

    // (3) Database write
    const saved = await addPortfolioImage(req.userId!, file.path);
    console.log('[portfolio] saved to db — portfolioImages:', saved.portfolioImages);

    res.json({ url: file.path });
  }
);

router.delete('/me/portfolio', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  const profile = await removePortfolioImage(req.userId!, url);
  res.json(profile);
});

router.post(
  '/me/profile-image',
  requireAuth,
  requireRole('MODEL'),
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
    const profile = await updateMyModel(req.userId!, { profileImage: file.path });
    res.json({ url: file.path, profile });
  }
);

export default router;
