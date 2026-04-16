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
  const profile = await upsertMyPhotographer(req.userId!, req.body);
  res.json(profile);
});

router.post(
  '/me/portfolio',
  requireAuth,
  requireRole('PHOTOGRAPHER'),
  uploadSingle('image'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const file = req.file as Express.Multer.File & { path: string; filename: string };
    if (!file.path) {
      res.status(500).json({ error: 'Upload succeeded but URL was not returned' });
      return;
    }
    const saved = await addPhotographerPortfolioImage(req.userId!, file.path);
    res.json({ url: file.path, portfolioImages: saved.portfolioImages });
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
