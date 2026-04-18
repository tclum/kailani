import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const tutorials = await prisma.tutorial.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tutorials);
});

router.get('/:id', async (req, res: Response) => {
  const tutorial = await prisma.tutorial.findUnique({ where: { id: req.params.id } });
  if (!tutorial || !tutorial.published) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(tutorial);
});

export default router;
