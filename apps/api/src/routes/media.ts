import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * POST /api/media/upload
 * Generic single-image upload. Returns a URL.
 * In production: pipe req.file.buffer to S3 or Cloudinary and return the CDN URL.
 */
router.post(
  '/upload',
  requireAuth,
  upload.single('image'),
  (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    // Placeholder — replace with real S3/Cloudinary upload
    const url = `https://placeholder.kailani.app/uploads/${Date.now()}-${req.file.originalname}`;
    res.json({ url });
  }
);

export default router;
