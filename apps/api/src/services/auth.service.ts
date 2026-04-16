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

export async function register(email: string, password: string, role: Role): Promise<any> {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, approved: true, createdAt: true, updatedAt: true },
  });

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  return { accessToken, refreshToken, user };
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
  // We need role from DB for a proper refresh — do a quick lookup in route
  return payload.userId;
}
