import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate, createThreadSchema, sendMessageSchema } from '../lib/validate';
import {
  getThreadsForUser,
  findOrCreateThread,
  getMessages,
  createMessage,
} from '../services/message.service';
import { getIO } from '../lib/socket';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const threads = await getThreadsForUser(req.userId!);
  res.json(threads);
});

router.post('/', validate(createThreadSchema), async (req: AuthRequest, res) => {
  const thread = await findOrCreateThread(req.userId!, req.body.recipientId);
  res.status(201).json(thread);
});

router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const messages = await getMessages(req.params.id, req.userId!);
    res.json(messages);
  } catch (err: any) {
    if (err.message === 'NOT_MEMBER') {
      res.status(403).json({ error: 'Not a member of this thread' });
    } else {
      res.status(500).json({ error: 'Failed to load messages' });
    }
  }
});

router.post('/:id/messages', validate(sendMessageSchema), async (req: AuthRequest, res) => {
  try {
    const message = await createMessage(req.params.id, req.userId!, req.body.body);
    // Emit via socket to thread members
    try {
      getIO().to(`thread:${req.params.id}`).emit('new_message', message);
    } catch {
      // socket not initialized — ok in tests
    }
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
