import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { validate, registerSchema, loginSchema } from '../lib/validate';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  register,
  login,
  refreshAccessToken,
  verifyEmail,
  createPasswordResetToken,
  resetPassword,
} from '../services/auth.service';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { prisma } from '../lib/prisma';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { verificationToken, ...result } = await register(
      req.body.email,
      req.body.password,
      req.body.role,
    );
    // Fire-and-forget — don't block the response on email delivery
    sendVerificationEmail(req.body.email, verificationToken).catch((err) =>
      console.error('Failed to send verification email:', err),
    );
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken required' });
    return;
  }
  try {
    const userId = refreshAccessToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET ?? '',
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/verify-email', async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: 'token required' });
    return;
  }
  try {
    await verifyEmail(token);
    res.json({ message: 'Email verified successfully' });
  } catch {
    res.status(400).json({ error: 'Invalid or expired verification link' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  try {
    const resetToken = await createPasswordResetToken(email);
    if (resetToken) {
      sendPasswordResetEmail(email, resetToken).catch((err) =>
        console.error('Failed to send password reset email:', err),
      );
    }
    // Always return 200 to avoid leaking whether the email exists
    res.json({ message: 'If that email is registered you will receive a reset link shortly' });
  } catch {
    res.status(500).json({ error: 'Request failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ error: 'token and password required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  try {
    await resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    if (err.message === 'TOKEN_EXPIRED') {
      res.status(400).json({ error: 'Reset link has expired, please request a new one' });
    } else {
      res.status(400).json({ error: 'Invalid or expired reset link' });
    }
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, role: true, approved: true, emailVerified: true, verified: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
