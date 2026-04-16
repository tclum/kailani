import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kailani/portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  } as object,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const multerInstance = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only jpg, png, and webp are allowed.'));
    }
  },
});

/**
 * Drop-in replacement for multer().single() that returns shaped 400 JSON
 * errors instead of letting multer errors fall through to the global handler.
 */
export function uploadSingle(field: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.single(field)(req, res, (err: unknown) => {
      if (!err) return next();

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        return;
      }

      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
        return;
      }

      next(err as Error);
    });
  };
}
