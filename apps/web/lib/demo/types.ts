import type {
  Role,
  ModelProfile,
  BrandProfile,
  PhotographerProfile,
  Campaign,
  Application,
} from '@kailani/types';

// Row shapes for the in-browser demo backend. They mirror the Prisma models in
// apps/api/prisma/schema.prisma; relations are resolved by the handlers.

export interface DemoUser {
  id: string;
  email: string;
  role: Role;
  approved: boolean;
  emailVerified: boolean;
  verified: boolean;
  communityFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DemoModelProfile = ModelProfile;
export type DemoBrandProfile = BrandProfile;
export type DemoPhotographerProfile = PhotographerProfile;
export type DemoCampaign = Omit<Campaign, '_count'> & { flagged: boolean };
export type DemoApplication = Application;

export interface DemoThread {
  id: string;
  createdAt: string;
  members: { userId: string; lastReadAt: string | null }[];
}

export interface DemoMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export type SwipeTargetType = 'MODEL' | 'BRAND' | 'PHOTOGRAPHER' | 'CAMPAIGN';

export interface DemoSwipe {
  id: string;
  swiperId: string;
  targetId: string;
  targetType: SwipeTargetType;
  direction: 'LIKE' | 'PASS';
  createdAt: string;
}

export interface DemoMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface DemoReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  campaignId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface DemoStructuredReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  campaignId: string;
  dimensions: Record<string, number | boolean>;
  overallRating: number;
  comment: string | null;
  reviewerResponse: string | null;
  responseDeadline: string;
  isPublic: boolean;
  flagCount: number;
  adminFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPost {
  id: string;
  authorId: string;
  campaignId: string;
  content: string;
  isPublic: boolean;
  responseDeadline: string;
  subjectResponse: string | null;
  adminFlagged: boolean;
  createdAt: string;
}

export interface DemoSaved {
  id: string;
  savedById: string;
  savedId: string;
  boardName: string;
  createdAt: string;
}

export interface DemoBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface DemoReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  details: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface DemoVerification {
  id: string;
  userId: string;
  idImageUrl: string;
  selfieUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface DemoTutorial {
  id: string;
  title: string;
  description: string;
  category: 'MODELING' | 'BEAUTY' | 'PHOTOGRAPHY' | 'BUSINESS' | 'INDUSTRY_GUIDES';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  authorId: string | null;
  published: boolean;
  createdAt: string;
}

export interface DemoSpotlight {
  id: string;
  userId: string;
  type: string;
  weekOf: string;
  reason: string;
  createdAt: string;
}

export interface DemoState {
  version: 1;
  seededAt: string;
  users: DemoUser[];
  modelProfiles: DemoModelProfile[];
  brandProfiles: DemoBrandProfile[];
  photographerProfiles: DemoPhotographerProfile[];
  campaigns: DemoCampaign[];
  applications: DemoApplication[];
  threads: DemoThread[];
  messages: DemoMessage[];
  swipes: DemoSwipe[];
  matches: DemoMatch[];
  reviews: DemoReview[];
  structuredReviews: DemoStructuredReview[];
  posts: DemoPost[];
  saved: DemoSaved[];
  blocks: DemoBlock[];
  reports: DemoReport[];
  verifications: DemoVerification[];
  tutorials: DemoTutorial[];
  spotlights: DemoSpotlight[];
}
