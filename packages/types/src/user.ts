export type Role = 'MODEL' | 'BRAND' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  height?: number;
  bust?: number;
  waist?: number;
  hips?: number;
  shoeSize?: number;
  hairColor?: string;
  eyeColor?: string;
  location?: string;
  instagramUrl?: string;
  portfolioImages: string[];
  coverImage?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  userId: string;
  brandName: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
