import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate, createThreadSchema, sendMessageSchema } from '../lib/validate';
import {
  getThreadsForUser,
  findOrCreateThread,
  getMessages,
  createMessage,
  getUnreadCount,
  markThreadRead,
} from '../services/message.service';
import { getIO } from '../lib/socket';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const threads = await getThreadsForUser(req.userId!);
    res.json(threads);
  } catch {
    res.status(500).json({ error: 'Failed to load threads' });
  }
});

router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await getUnreadCount(req.userId!);
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.post('/', validate(createThreadSchema), async (req: AuthRequest, res) => {
  try {
    const thread = await findOrCreateThread(req.userId!, req.body.recipientId);
    res.status(201).json(thread);
  } catch (err: any) {
    if (err.message === 'RECIPIENT_NOT_FOUND') {
      res.status(404).json({ error: 'Recipient not found' });
    } else {
      res.status(500).json({ error: 'Failed to create thread' });
    }
  }
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
    try {
      getIO().to(`thread:${req.params.id}`).emit('new-message', message);
    } catch {
      // socket not initialized — ok in dev/tests
    }
    res.status(201).json(message);
  } catch {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:id/read', async (req: AuthRequest, res) => {
  try {
    await markThreadRead(req.params.id, req.userId!);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

export default router;
