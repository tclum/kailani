import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { listModels, getModel, updateMyModel } from '../services/model.service';

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
  upload.single('image'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    // In production: upload req.file.buffer to S3 / Cloudinary and get back a URL.
    // For the scaffold we return a placeholder URL.
    const imageUrl = `https://placehold.co/800x1200/fce7f3/be185d?text=${encodeURIComponent(req.file.originalname)}`;
    res.json({ url: imageUrl });
  }
);

export default router;
