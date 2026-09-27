import type { DemoTutorial } from '../types';
import type { Clock } from './clock';

const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80`;

// Ported from apps/api/prisma/seed.ts (tutorialSeeds).
const TUTORIALS: Array<Omit<DemoTutorial, 'id' | 'videoUrl' | 'authorId' | 'published' | 'createdAt'>> = [
  { title: 'Runway Walking Fundamentals', description: 'Master the classic runway walk: posture, stride, turns, and presence.', category: 'MODELING', difficulty: 'BEGINNER', duration: 18, thumbnailUrl: unsplash('photo-1469334031218-e382a71b716b') },
  { title: 'Posing for Editorial Campaigns', description: 'How to pose for editorial shoots. Covers body angles, facial expressions, and working with the camera.', category: 'MODELING', difficulty: 'INTERMEDIATE', duration: 24, thumbnailUrl: unsplash('photo-1515886657613-9f3515b0c78f') },
  { title: 'Camera-Ready Makeup: Base & Foundation', description: 'Build a flawless base that photographs well in every light, from natural to studio flash.', category: 'BEAUTY', difficulty: 'BEGINNER', duration: 22, thumbnailUrl: unsplash('photo-1487412720507-e7ab37603c6f') },
  { title: 'Editorial Eye Looks', description: 'Bold editorial eye makeup: cut creases, graphic liner, and avant-garde techniques.', category: 'BEAUTY', difficulty: 'ADVANCED', duration: 35, thumbnailUrl: unsplash('photo-1522337360788-8b13dee7a37e') },
  { title: 'Studio Lighting for Fashion Photography', description: 'Set up and control studio lights: Rembrandt, butterfly, loop, and split lighting patterns explained.', category: 'PHOTOGRAPHY', difficulty: 'INTERMEDIATE', duration: 40, thumbnailUrl: unsplash('photo-1542038784456-1ea8e935640e') },
  { title: 'Directing Models on Set', description: 'Communicate clearly with models to get the shots you need: verbal cues, body language, and building trust quickly.', category: 'PHOTOGRAPHY', difficulty: 'INTERMEDIATE', duration: 28, thumbnailUrl: unsplash('photo-1554080353-a576cf803bda') },
  { title: 'Modeling Rates: What to Charge', description: 'Day rates, usage fees, exclusivity clauses, and how to price your work at different experience levels.', category: 'BUSINESS', difficulty: 'BEGINNER', duration: 15, thumbnailUrl: unsplash('photo-1554224155-8d04cb21cd6c') },
  { title: 'Negotiating Your First Agency Contract', description: 'What to look for in an agency contract: commission splits, exclusivity terms, expense recoupment, and exit clauses.', category: 'BUSINESS', difficulty: 'INTERMEDIATE', duration: 30, thumbnailUrl: unsplash('photo-1507679799987-c73779587ccf') },
  { title: 'Building Your First Portfolio', description: 'Build a strong, versatile portfolio from scratch: tests, TFP shoots, and what brands want to see.', category: 'INDUSTRY_GUIDES', difficulty: 'BEGINNER', duration: 20, thumbnailUrl: unsplash('photo-1509631179647-0177331693ae') },
  { title: 'Understanding Usage Rights', description: 'Usage rights explained simply: print vs digital, duration, exclusivity, territory, and how they affect your fee.', category: 'INDUSTRY_GUIDES', difficulty: 'INTERMEDIATE', duration: 25, thumbnailUrl: unsplash('photo-1450101499163-c8848c66ca85') },
  { title: 'Writing the Perfect Campaign Brief', description: 'For brands: write a brief that attracts the right talent and runs smoothly on set.', category: 'BUSINESS', difficulty: 'BEGINNER', duration: 18, thumbnailUrl: unsplash('photo-1434626881859-194d67b2b86f') },
  { title: 'Skincare for Models: Camera-Ready Skin', description: 'Daily routines and pre-shoot prep for healthy, photogenic skin.', category: 'BEAUTY', difficulty: 'BEGINNER', duration: 16, thumbnailUrl: unsplash('photo-1596755389378-c31d21fd1273') },
];

export function buildTutorials(c: Clock): DemoTutorial[] {
  return TUTORIALS.map((t, i) => ({
    ...t,
    id: `tut-${i + 1}`,
    videoUrl: null,
    authorId: null,
    published: true,
    createdAt: c.daysAgo(60 - i),
  }));
}

export type DemoNewsCategory = 'fashion' | 'beauty' | 'business' | 'photography';

export interface DemoNewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
  category: DemoNewsCategory;
}

/** Fictional articles for /news in demo mode. Sources are invented publications. */
export function buildNewsArticles(now: number): DemoNewsArticle[] {
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  return [
    { category: 'fashion', title: 'Resort Season Moves to the Water', description: 'Swim labels are casting for ocean confidence first and runway polish second.', url: '#', urlToImage: unsplash('photo-1558769132-cb1aea458c5e'), publishedAt: ago(3), source: { name: 'The Kailani Dispatch' } },
    { category: 'business', title: 'What Casting Teams Look for in a First Portfolio', description: 'Clean digitals, a range of three looks, and one image that shows how you move.', url: '#', urlToImage: unsplash('photo-1515886657613-9f3515b0c78f'), publishedAt: ago(9), source: { name: 'Model Desk Weekly' } },
    { category: 'beauty', title: 'Shade Ranges Are Finally Being Shot on Real Skin', description: 'Beauty brands are casting wider and retouching less, and campaigns look better for it.', url: '#', urlToImage: unsplash('photo-1487412720507-e7ab37603c6f'), publishedAt: ago(20), source: { name: 'Glow Report' } },
    { category: 'business', title: 'Usage Rights, Explained in Plain Language', description: 'Print, digital, territory, and term: a simple checklist before you sign.', url: '#', urlToImage: unsplash('photo-1450101499163-c8848c66ca85'), publishedAt: ago(30), source: { name: 'Model Desk Weekly' } },
    { category: 'photography', title: 'Natural Light Is Back on Big-Budget Sets', description: 'Why more photographers are scheduling around golden hour instead of hauling strobes.', url: '#', urlToImage: unsplash('photo-1542038784456-1ea8e935640e'), publishedAt: ago(44), source: { name: 'Frame & Field' } },
    { category: 'fashion', title: 'Street Casting Goes Mainstream', description: 'Streetwear labels are booking real people with real style for flagship campaigns.', url: '#', urlToImage: unsplash('photo-1509631179647-0177331693ae'), publishedAt: ago(60), source: { name: 'The Kailani Dispatch' } },
    { category: 'photography', title: 'Directing Movement Without Saying “Move”', description: 'Five cues photographers use to get natural motion on set.', url: '#', urlToImage: unsplash('photo-1554080353-a576cf803bda'), publishedAt: ago(80), source: { name: 'Frame & Field' } },
    { category: 'beauty', title: 'The Pre-Shoot Skincare Routine That Travels', description: 'A three-step routine that survives red-eye flights and early call times.', url: '#', urlToImage: unsplash('photo-1596755389378-c31d21fd1273'), publishedAt: ago(100), source: { name: 'Glow Report' } },
  ];
}
