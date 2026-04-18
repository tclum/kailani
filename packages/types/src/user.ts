export type Role = 'MODEL' | 'BRAND' | 'ADMIN' | 'PHOTOGRAPHER';

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
  location?: string;
  instagramUrl?: string;
  heightCm?: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoeSize?: number;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  rates?: { dayRate?: number; halfDayRate?: number; hourlyRate?: number };
  availability?: string[];
  profileImage?: string;
  portfolioImages: string[];
  coverImage?: string;
  tags: string[];

  // Physical attributes
  weightKg?: number;
  build?: string;
  playingAgeMin?: number;
  playingAgeMax?: number;
  gender?: string;

  // Credits
  televisionCredits?: Array<{ title: string; role?: string; production?: string; director?: string; location?: string; date?: string }>;
  modelingCredits?: Array<{ title: string; role?: string; client?: string; photographer?: string; location?: string; date?: string }>;
  filmCredits?: Array<{ title: string; role?: string; production?: string; director?: string; location?: string; date?: string }>;
  commercialCredits?: Array<{ title: string; role?: string; client?: string; location?: string; date?: string }>;

  // Skills
  skills?: string[];
  languages?: string[];
  education?: Array<{ institution: string; degree?: string; year?: string }>;

  // Professional
  unionStatus?: string;
  representation?: string;
  website?: string;

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
  instagramUrl?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotographerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  location?: string;
  instagramUrl?: string;
  specialties: string[];
  portfolioImages: string[];
  coverImage?: string;
  profileImage?: string;
  rates?: { dayRate?: number; halfDayRate?: number; hourlyRate?: number };
  availability?: string[];
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
