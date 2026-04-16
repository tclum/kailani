import { z, ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

/**
 * Returns an Express middleware that validates req.body against the given Zod
 * schema. On failure it responds 400 { error: string } and stops the chain.
 * On success it replaces req.body with the parsed (and unknown-key-stripped)
 * data before calling next().
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.errors[0].message });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MODEL', 'BRAND'], { message: 'Invalid role.' }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const createCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  budget: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED']).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const applyToCampaignSchema = z.object({
  coverNote: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']),
});

// ── Messages ──────────────────────────────────────────────────────────────────

export const createThreadSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message body is required'),
});

// ── Brands ────────────────────────────────────────────────────────────────────

export const updateBrandSchema = z.object({
  brandName: z.string().min(1).optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  location: z.string().optional(),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  profileImage: z.string().optional(),
});

// ── Model profile ─────────────────────────────────────────────────────────────

const ratesSchema = z.object({
  dayRate:     z.number().nonnegative().optional(),
  halfDayRate: z.number().nonnegative().optional(),
  hourlyRate:  z.number().nonnegative().optional(),
}).optional();

export const updateModelProfileSchema = z.object({
  displayName:     z.string().min(1).optional(),
  bio:             z.string().max(400).optional(),
  location:        z.string().optional(),
  instagramUrl:    z.string().url().optional().or(z.literal('')),
  heightCm:        z.number().int().positive().optional(),
  bustCm:          z.number().int().positive().optional(),
  waistCm:         z.number().int().positive().optional(),
  hipsCm:          z.number().int().positive().optional(),
  shoeSize:        z.number().positive().optional(),
  hairColor:       z.string().optional(),
  eyeColor:        z.string().optional(),
  skinTone:        z.string().optional(),
  tags:            z.array(z.string()).optional(),
  coverImage:      z.string().optional(),
  portfolioImages: z.array(z.string()).optional(),
  profileImage:    z.string().optional(),
  rates:           ratesSchema,
  availability:    z.array(z.string()).optional(),
});

// ── Photographer profile ──────────────────────────────────────────────────────

export const updatePhotographerProfileSchema = z.object({
  displayName:     z.string().min(1).optional(),
  bio:             z.string().optional(),
  location:        z.string().optional(),
  instagramUrl:    z.string().url().optional().or(z.literal('')),
  specialties:     z.array(z.string()).optional(),
  coverImage:      z.string().optional(),
  portfolioImages: z.array(z.string()).optional(),
  profileImage:    z.string().optional(),
  rates:           ratesSchema,
  availability:    z.array(z.string()).optional(),
});
