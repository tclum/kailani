import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { validate, updatePhotographerProfileSchema } from '../lib/validate';
import {
  listPhotographers,
  getPhotographer,
  getMyPhotographer,
  upsertMyPhotographer,
  addPhotographerPortfolioImage,
  removePhotographerPortfolioImage,
} from '../services/photographer.service';

const router = Router();

router.get('/', async (req, res) => {
  const { location, specialties, page } = req.query;
  const specArr = specialties ? String(specialties).split(',') : undefined;
  const result = await listPhotographers({
    location: location ? String(location) : undefined,
    specialties: specArr,
    page: page ? Number(page) : 1,
    approvedOnly: true,
  });
  res.json(result);
});

// Must be before /:id
router.get('/me', requireAuth, requireRole('PHOTOGRAPHER'), async (req: AuthRequest, res) => {
  const profile = await getMyPhotographer(req.userId!);
  if (!profile) {
    res.status(404).json({ error: 'Photographer profile not found' });
    return;
  }
  res.json(profile);
});

router.get('/:id', async (req, res) => {
  const profile = await getPhotographer(req.params.id);
  if (!profile || !profile.user.approved) {
    res.status(404).json({ error: 'Photographer not found' });
    return;
  }
  res.json(profile);
});

router.put('/me', requireAuth, requireRole('PHOTOGRAPHER'), validate(updatePhotographerProfileSchema), async (req: AuthRequest, res) => {
  console.log('[PUT /photographers/me] userId:', req.userId, 'body:', JSON.stringify(req.body));
  try {
    const profile = await upsertMyPhotographer(req.userId!, req.body);
    res.json(profile);
  } catch (err) {
    console.error('[PUT /photographers/me] error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

router.post(
  '/me/portfolio',
  requireAuth,
  requireRole('PHOTOGRAPHER'),
  uploadSingle('image'),
  async (req: AuthRequest, res) => {
    console.log('[POST /photographers/me/portfolio] userId:', req.userId, 'file:', req.file?.originalname);
    if (!req.file) {
      console.error('[POST /photographers/me/portfolio] no file on req');
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const file = req.file as Express.Multer.File & { path: string; filename: string };
    console.log('[POST /photographers/me/portfolio] cloudinary result:', { url: file.path, publicId: file.filename });
    if (!file.path) {
      console.error('[POST /photographers/me/portfolio] cloudinary URL missing — full req.file:', req.file);
      res.status(500).json({ error: 'Upload succeeded but URL was not returned' });
      return;
    }
    try {
      const saved = await addPhotographerPortfolioImage(req.userId!, file.path);
      console.log('[POST /photographers/me/portfolio] saved to db — count:', saved.portfolioImages.length);
      res.json({ url: file.path, portfolioImages: saved.portfolioImages });
    } catch (err) {
      console.error('[POST /photographers/me/portfolio] db error:', err);
      res.status(500).json({ error: 'Failed to save portfolio image' });
    }
  }
);

router.delete('/me/portfolio', requireAuth, requireRole('PHOTOGRAPHER'), async (req: AuthRequest, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  const profile = await removePhotographerPortfolioImage(req.userId!, url);
  res.json(profile);
});

router.post(
  '/me/profile-image',
  requireAuth,
  requireRole('PHOTOGRAPHER'),
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
    const profile = await upsertMyPhotographer(req.userId!, { profileImage: file.path });
    res.json({ url: file.path, profile });
  }
);

export default router;
