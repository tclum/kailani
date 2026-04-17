import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadVerification } from '../middleware/upload';
import { prisma } from '../lib/prisma';
import { sendAdminVerificationAlert } from '../services/email.service';

const router = Router();
router.use(requireAuth);

/** GET /api/verification/me — current user's verification request */
router.get('/me', async (req: AuthRequest, res) => {
  const request = await prisma.verificationRequest.findUnique({
    where: { userId: req.userId! },
    select: {
      id: true,
      status: true,
      idImageUrl: true,
      selfieUrl: true,
      adminNote: true,
      submittedAt: true,
      reviewedAt: true,
    },
  });
  res.json(request ?? null);
});

/** POST /api/verification/submit — upload ID image, create/update request */
router.post('/submit', uploadVerification('idImage'), async (req: AuthRequest, res) => {
  const file = req.file as (Express.Multer.File & { path: string }) | undefined;
  if (!file?.path) {
    res.status(400).json({ error: 'ID image is required' });
    return;
  }

  const selfieFile = undefined; // selfie upload handled separately if needed
  const idImageUrl = file.path;

  try {
    const request = await prisma.verificationRequest.upsert({
      where: { userId: req.userId! },
      update: { idImageUrl, selfieUrl: null, status: 'PENDING', adminNote: null, submittedAt: new Date(), reviewedAt: null, reviewedBy: null },
      create: { userId: req.userId!, idImageUrl },
    });

    // Get user name for email notification
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        email: true,
        modelProfile: { select: { displayName: true } },
        brandProfile: { select: { brandName: true } },
        photographerProfile: { select: { displayName: true } },
      },
    });
    const name =
      user?.modelProfile?.displayName ??
      user?.brandProfile?.brandName ??
      user?.photographerProfile?.displayName ??
      user?.email ??
      'Unknown';

    // Fire-and-forget admin alert
    sendAdminVerificationAlert(name, req.userId!).catch(() => {});

    res.json(request);
  } catch (err) {
    console.error('[verification/submit]', err);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

export default router;
