import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { listModels, getModel, getMyModel, updateMyModel, addPortfolioImage } from '../services/model.service';

const router = Router();

router.get('/', async (req, res) => {
  const { location, tags, page } = req.query;
  const tagArr = tags ? String(tags).split(',') : undefined;
  const result = await listModels({
    location: location ? String(location) : undefined,
    tags: tagArr,
    page: page ? Number(page) : 1,
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
  if (!model) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  res.json(model);
});

router.put('/me', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
  const allowed = [
    'displayName', 'bio', 'height', 'bust', 'waist', 'hips', 'shoeSize',
    'hairColor', 'eyeColor', 'location', 'instagramUrl', 'tags', 'coverImage',
    'portfolioImages',
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const profile = await updateMyModel(req.userId!, data);
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

export default router;
