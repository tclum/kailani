import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

type Role = 'MODEL' | 'BRAND' | 'ADMIN';

const SALT_ROUNDS = 12;

function signAccess(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET ?? '', {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any,
  });
}

function signRefresh(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET ?? '', {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
  });
}

function secureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function register(email: string, password: string, role: Role) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = secureToken();
  const user = await prisma.user.create({
    data: { email, passwordHash, role, verificationToken },
    select: { id: true, email: true, role: true, approved: true, createdAt: true, updatedAt: true },
  });

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  return { accessToken, refreshToken, user, verificationToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const { passwordHash: _, ...safeUser } = user;
  const accessToken = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  return { accessToken, refreshToken, user: safeUser };
}

export function refreshAccessToken(refreshToken: string) {
  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET ?? '') as {
    userId: string;
  };
  return payload.userId;
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) throw new Error('INVALID_TOKEN');

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // Don't reveal whether the email exists

  const resetToken = secureToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry) throw new Error('INVALID_TOKEN');
  if (user.resetTokenExpiry < new Date()) throw new Error('TOKEN_EXPIRED');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });
}
