import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo1234!';
const SALT_ROUNDS = 12;

// ── Image helpers ────────────────────────────────────────────────────────────

function portrait(gender: 'women' | 'men', n: number) {
  return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
}

function picsumPortfolio(seed: string, w = 800, h = 1000) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// ── Data ─────────────────────────────────────────────────────────────────────

interface ModelSeed {
  email: string;
  displayName: string;
  location: string;
  bio: string;
  heightCm: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoeSize: number;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  tags: string[];
  rates: { dayRate: number; halfDayRate: number; hourlyRate: number };
  profileImage: string;
  portfolioImages: string[];
}

interface BrandSeed {
  email: string;
  brandName: string;
  industry: string;
  bio: string;
  location: string;
  website: string;
  instagramUrl: string;
  logoUrl: string;
}

interface PhotographerSeed {
  email: string;
  displayName: string;
  location: string;
  bio: string;
  specialties: string[];
  rates: { dayRate: number; halfDayRate: number; hourlyRate: number };
  profileImage: string;
  portfolioImages: string[];
}

interface CampaignSeed {
  brandEmail: string;
  title: string;
  description: string;
  budget: string;
  location: string;
  tags: string[];
  startDate: Date;
  endDate: Date;
}

// ─── Models ──────────────────────────────────────────────────────────────────

const MODELS: ModelSeed[] = [
  {
    email: 'sofia.reyes@demo.kailani',
    displayName: 'Sofia Reyes',
    location: 'New York, NY',
    bio: 'Editorial and commercial model with 6 years of experience. Represented by Elite NYC. Strong runway background from NYFW.',
    heightCm: 178, bustCm: 84, waistCm: 61, hipsCm: 89, shoeSize: 39,
    hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Olive',
    tags: ['editorial', 'commercial', 'runway', 'beauty'],
    rates: { dayRate: 2000, halfDayRate: 1200, hourlyRate: 300 },
    profileImage: portrait('women', 1),
    portfolioImages: [
      picsumPortfolio('sofia-edit1'), picsumPortfolio('sofia-runway'),
      picsumPortfolio('sofia-beauty'), picsumPortfolio('sofia-comm'),
    ],
  },
  {
    email: 'amara.osei@demo.kailani',
    displayName: 'Amara Osei',
    location: 'Los Angeles, CA',
    bio: 'High-fashion editorial model. I bring strength and elegance to every frame. Published in Vogue West Africa and Elle.',
    heightCm: 180, bustCm: 86, waistCm: 63, hipsCm: 91, shoeSize: 40,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Deep',
    tags: ['editorial', 'high-fashion', 'runway', 'commercial'],
    rates: { dayRate: 2500, halfDayRate: 1500, hourlyRate: 350 },
    profileImage: portrait('women', 2),
    portfolioImages: [
      picsumPortfolio('amara-fashion'), picsumPortfolio('amara-street'),
      picsumPortfolio('amara-studio'), picsumPortfolio('amara-outdoor'),
    ],
  },
  {
    email: 'chloe.martin@demo.kailani',
    displayName: 'Chloé Martin',
    location: 'Paris, France',
    bio: 'Parisian editorial model with a minimalist aesthetic. Worked with Chanel, Dior, and emerging French designers.',
    heightCm: 176, bustCm: 82, waistCm: 60, hipsCm: 87, shoeSize: 38,
    hairColor: 'Blonde', eyeColor: 'Blue', skinTone: 'Fair',
    tags: ['editorial', 'haute-couture', 'beauty', 'minimalist'],
    rates: { dayRate: 3000, halfDayRate: 1800, hourlyRate: 400 },
    profileImage: portrait('women', 3),
    portfolioImages: [
      picsumPortfolio('chloe-paris'), picsumPortfolio('chloe-couture'),
      picsumPortfolio('chloe-beauty'), picsumPortfolio('chloe-street'),
      picsumPortfolio('chloe-minimal'),
    ],
  },
  {
    email: 'yuki.tanaka@demo.kailani',
    displayName: 'Yuki Tanaka',
    location: 'Tokyo, Japan',
    bio: 'Tokyo-based model specializing in editorial and commercial work. Featured in Vogue Japan and Harper\'s Bazaar Japan.',
    heightCm: 170, bustCm: 80, waistCm: 58, hipsCm: 85, shoeSize: 37,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
    tags: ['editorial', 'commercial', 'beauty', 'lookbook'],
    rates: { dayRate: 1800, halfDayRate: 1100, hourlyRate: 250 },
    profileImage: portrait('women', 4),
    portfolioImages: [
      picsumPortfolio('yuki-editorial'), picsumPortfolio('yuki-beauty'),
      picsumPortfolio('yuki-fashion'), picsumPortfolio('yuki-street'),
    ],
  },
  {
    email: 'maya.johnson@demo.kailani',
    displayName: 'Maya Johnson',
    location: 'Miami, FL',
    bio: 'Swimwear and lifestyle model based in Miami. Sun, ocean, and authentic energy — that\'s my vibe. Open to travel.',
    heightCm: 172, bustCm: 88, waistCm: 65, hipsCm: 93, shoeSize: 38,
    hairColor: 'Brown', eyeColor: 'Hazel', skinTone: 'Tan',
    tags: ['swimwear', 'lifestyle', 'fitness', 'commercial'],
    rates: { dayRate: 1500, halfDayRate: 900, hourlyRate: 200 },
    profileImage: portrait('women', 5),
    portfolioImages: [
      picsumPortfolio('maya-swim1'), picsumPortfolio('maya-beach'),
      picsumPortfolio('maya-lifestyle'), picsumPortfolio('maya-fitness'),
    ],
  },
  {
    email: 'isabella.costa@demo.kailani',
    displayName: 'Isabella Costa',
    location: 'Miami, FL',
    bio: 'Brazilian-born commercial and swimwear model. Fluent in Portuguese, Spanish, and English. Available for international bookings.',
    heightCm: 174, bustCm: 90, waistCm: 66, hipsCm: 95, shoeSize: 39,
    hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Tan',
    tags: ['swimwear', 'commercial', 'lingerie', 'catalogue'],
    rates: { dayRate: 1800, halfDayRate: 1100, hourlyRate: 250 },
    profileImage: portrait('women', 6),
    portfolioImages: [
      picsumPortfolio('isabella-beach'), picsumPortfolio('isabella-editorial'),
      picsumPortfolio('isabella-studio'), picsumPortfolio('isabella-outdoor'),
      picsumPortfolio('isabella-swim'),
    ],
  },
  {
    email: 'naomi.harris@demo.kailani',
    displayName: 'Naomi Harris',
    location: 'London, UK',
    bio: 'London-based fit and editorial model. Strong print background. Worked with ASOS, Topshop, and multiple London Fashion Week shows.',
    heightCm: 175, bustCm: 83, waistCm: 62, hipsCm: 90, shoeSize: 39,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Brown',
    tags: ['editorial', 'fit-model', 'commercial', 'runway'],
    rates: { dayRate: 2200, halfDayRate: 1300, hourlyRate: 300 },
    profileImage: portrait('women', 7),
    portfolioImages: [
      picsumPortfolio('naomi-editorial'), picsumPortfolio('naomi-runway'),
      picsumPortfolio('naomi-print'), picsumPortfolio('naomi-studio'),
    ],
  },
  {
    email: 'lena.schmidt@demo.kailani',
    displayName: 'Lena Schmidt',
    location: 'New York, NY',
    bio: 'German-born NYC model with a strong editorial book. Clean, versatile look that translates across markets.',
    heightCm: 179, bustCm: 84, waistCm: 61, hipsCm: 88, shoeSize: 40,
    hairColor: 'Blonde', eyeColor: 'Gray', skinTone: 'Fair',
    tags: ['editorial', 'commercial', 'beauty', 'runway'],
    rates: { dayRate: 2800, halfDayRate: 1700, hourlyRate: 380 },
    profileImage: portrait('women', 8),
    portfolioImages: [
      picsumPortfolio('lena-editorial'), picsumPortfolio('lena-beauty'),
      picsumPortfolio('lena-fashion'), picsumPortfolio('lena-studio'),
    ],
  },
  {
    email: 'priya.sharma@demo.kailani',
    displayName: 'Priya Sharma',
    location: 'New York, NY',
    bio: 'Versatile commercial and editorial model. Strong beauty background. Featured in Allure and InStyle.',
    heightCm: 168, bustCm: 85, waistCm: 63, hipsCm: 90, shoeSize: 37,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Medium',
    tags: ['beauty', 'commercial', 'editorial', 'catalogue'],
    rates: { dayRate: 1600, halfDayRate: 1000, hourlyRate: 220 },
    profileImage: portrait('women', 9),
    portfolioImages: [
      picsumPortfolio('priya-beauty'), picsumPortfolio('priya-editorial'),
      picsumPortfolio('priya-commercial'),
    ],
  },
  {
    email: 'zara.white@demo.kailani',
    displayName: 'Zara White',
    location: 'Los Angeles, CA',
    bio: 'LA-based fitness and lifestyle model. Former division-1 athlete. Authentic energy for activewear and wellness brands.',
    heightCm: 171, bustCm: 87, waistCm: 65, hipsCm: 92, shoeSize: 38,
    hairColor: 'Blonde', eyeColor: 'Blue', skinTone: 'Light',
    tags: ['fitness', 'activewear', 'lifestyle', 'swimwear'],
    rates: { dayRate: 1400, halfDayRate: 850, hourlyRate: 190 },
    profileImage: portrait('women', 10),
    portfolioImages: [
      picsumPortfolio('zara-fitness'), picsumPortfolio('zara-outdoor'),
      picsumPortfolio('zara-lifestyle'), picsumPortfolio('zara-beach'),
    ],
  },
  {
    email: 'fatima.ali@demo.kailani',
    displayName: 'Fatima Ali',
    location: 'Paris, France',
    bio: 'Modest fashion and editorial model based in Paris. Experienced in working with international luxury brands.',
    heightCm: 173, bustCm: 83, waistCm: 62, hipsCm: 89, shoeSize: 38,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Medium',
    tags: ['modest-fashion', 'editorial', 'commercial', 'haute-couture'],
    rates: { dayRate: 2200, halfDayRate: 1300, hourlyRate: 300 },
    profileImage: portrait('women', 11),
    portfolioImages: [
      picsumPortfolio('fatima-editorial'), picsumPortfolio('fatima-fashion'),
      picsumPortfolio('fatima-studio'), picsumPortfolio('fatima-outdoor'),
    ],
  },
  {
    email: 'grace.kim@demo.kailani',
    displayName: 'Grace Kim',
    location: 'Los Angeles, CA',
    bio: 'Korean-American model and actor based in LA. Strong commercial look with cross-market appeal in both US and Asian markets.',
    heightCm: 167, bustCm: 81, waistCm: 59, hipsCm: 86, shoeSize: 37,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
    tags: ['commercial', 'beauty', 'editorial', 'catalogue'],
    rates: { dayRate: 1700, halfDayRate: 1050, hourlyRate: 240 },
    profileImage: portrait('women', 12),
    portfolioImages: [
      picsumPortfolio('grace-beauty'), picsumPortfolio('grace-editorial'),
      picsumPortfolio('grace-commercial'),
    ],
  },
  {
    email: 'elena.volkov@demo.kailani',
    displayName: 'Elena Volkov',
    location: 'New York, NY',
    bio: 'Russian-born high-fashion model. Signed with IMG Models NY. NYFW, Paris, and Milan seasons. Strong editorial book.',
    heightCm: 181, bustCm: 83, waistCm: 60, hipsCm: 87, shoeSize: 41,
    hairColor: 'Red', eyeColor: 'Green', skinTone: 'Fair',
    tags: ['high-fashion', 'editorial', 'runway', 'beauty'],
    rates: { dayRate: 3500, halfDayRate: 2000, hourlyRate: 450 },
    profileImage: portrait('women', 13),
    portfolioImages: [
      picsumPortfolio('elena-hf1'), picsumPortfolio('elena-runway'),
      picsumPortfolio('elena-editorial'), picsumPortfolio('elena-beauty'),
      picsumPortfolio('elena-studio'),
    ],
  },
  {
    email: 'aaliya.brooks@demo.kailani',
    displayName: 'Aaliya Brooks',
    location: 'New York, NY',
    bio: 'Plus-size model pushing boundaries in high fashion. Published in Vogue, Glamour, and Sports Illustrated Swimsuit.',
    heightCm: 175, bustCm: 107, waistCm: 84, hipsCm: 112, shoeSize: 40,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Brown',
    tags: ['plus-size', 'editorial', 'swimwear', 'commercial', 'runway'],
    rates: { dayRate: 2500, halfDayRate: 1500, hourlyRate: 350 },
    profileImage: portrait('women', 14),
    portfolioImages: [
      picsumPortfolio('aaliya-editorial'), picsumPortfolio('aaliya-swim'),
      picsumPortfolio('aaliya-fashion'), picsumPortfolio('aaliya-studio'),
    ],
  },
  {
    email: 'nina.petrov@demo.kailani',
    displayName: 'Nina Petrov',
    location: 'Los Angeles, CA',
    bio: 'Petite model with a big personality. Specializing in beauty and commercial work. 5\'3\" and owns every frame.',
    heightCm: 160, bustCm: 82, waistCm: 60, hipsCm: 87, shoeSize: 36,
    hairColor: 'Auburn', eyeColor: 'Hazel', skinTone: 'Light',
    tags: ['petite', 'beauty', 'commercial', 'catalogue'],
    rates: { dayRate: 1200, halfDayRate: 750, hourlyRate: 175 },
    profileImage: portrait('women', 15),
    portfolioImages: [
      picsumPortfolio('nina-beauty'), picsumPortfolio('nina-commercial'),
      picsumPortfolio('nina-lifestyle'),
    ],
  },
  {
    email: 'jade.williams@demo.kailani',
    displayName: 'Jade Williams',
    location: 'Honolulu, HI',
    bio: 'Hawaii-based model with an island lifestyle aesthetic. Perfect for swimwear, travel, and outdoor campaigns.',
    heightCm: 169, bustCm: 85, waistCm: 63, hipsCm: 91, shoeSize: 38,
    hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Tan',
    tags: ['swimwear', 'travel', 'lifestyle', 'outdoor', 'fitness'],
    rates: { dayRate: 1300, halfDayRate: 800, hourlyRate: 185 },
    profileImage: portrait('women', 16),
    portfolioImages: [
      picsumPortfolio('jade-swim'), picsumPortfolio('jade-beach'),
      picsumPortfolio('jade-lifestyle'), picsumPortfolio('jade-outdoor'),
    ],
  },
  {
    email: 'camille.dupont@demo.kailani',
    displayName: 'Camille Dupont',
    location: 'Paris, France',
    bio: 'Effortlessly chic Parisian model. Commercial and editorial specialist with 8 years in the industry.',
    heightCm: 177, bustCm: 83, waistCm: 61, hipsCm: 88, shoeSize: 39,
    hairColor: 'Brown', eyeColor: 'Green', skinTone: 'Fair',
    tags: ['editorial', 'commercial', 'beauty', 'catalogue'],
    rates: { dayRate: 2400, halfDayRate: 1450, hourlyRate: 330 },
    profileImage: portrait('women', 17),
    portfolioImages: [
      picsumPortfolio('camille-paris'), picsumPortfolio('camille-editorial'),
      picsumPortfolio('camille-beauty'), picsumPortfolio('camille-comm'),
    ],
  },
  {
    email: 'anya.patel@demo.kailani',
    displayName: 'Anya Patel',
    location: 'London, UK',
    bio: 'British-Indian model based in London. Worked with Burberry, Stella McCartney, and multiple London Fashion Week designers.',
    heightCm: 174, bustCm: 84, waistCm: 62, hipsCm: 89, shoeSize: 38,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Medium',
    tags: ['editorial', 'runway', 'commercial', 'beauty'],
    rates: { dayRate: 2300, halfDayRate: 1400, hourlyRate: 320 },
    profileImage: portrait('women', 18),
    portfolioImages: [
      picsumPortfolio('anya-runway'), picsumPortfolio('anya-editorial'),
      picsumPortfolio('anya-beauty'), picsumPortfolio('anya-studio'),
    ],
  },
  {
    email: 'sara.lindqvist@demo.kailani',
    displayName: 'Sara Lindqvist',
    location: 'New York, NY',
    bio: 'Swedish model based in NYC. Classic Scandinavian look with strong editorial and commercial experience.',
    heightCm: 180, bustCm: 84, waistCm: 61, hipsCm: 89, shoeSize: 40,
    hairColor: 'Blonde', eyeColor: 'Blue', skinTone: 'Fair',
    tags: ['editorial', 'commercial', 'beauty', 'high-fashion'],
    rates: { dayRate: 2700, halfDayRate: 1600, hourlyRate: 370 },
    profileImage: portrait('women', 19),
    portfolioImages: [
      picsumPortfolio('sara-editorial'), picsumPortfolio('sara-beauty'),
      picsumPortfolio('sara-fashion'), picsumPortfolio('sara-outdoor'),
    ],
  },
  {
    email: 'keiko.yamamoto@demo.kailani',
    displayName: 'Keiko Yamamoto',
    location: 'Tokyo, Japan',
    bio: 'Tokyo editorial model with a strong beauty and lookbook portfolio. Available for international shoots.',
    heightCm: 166, bustCm: 79, waistCm: 57, hipsCm: 84, shoeSize: 36,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
    tags: ['editorial', 'beauty', 'lookbook', 'commercial'],
    rates: { dayRate: 1600, halfDayRate: 1000, hourlyRate: 220 },
    profileImage: portrait('women', 20),
    portfolioImages: [
      picsumPortfolio('keiko-beauty'), picsumPortfolio('keiko-editorial'),
      picsumPortfolio('keiko-lookbook'),
    ],
  },
  {
    email: 'diana.cruz@demo.kailani',
    displayName: 'Diana Cruz',
    location: 'Miami, FL',
    bio: 'Miami-based Latina model with high energy and a love for the camera. Catalogue, swimwear, and lifestyle expert.',
    heightCm: 168, bustCm: 88, waistCm: 66, hipsCm: 94, shoeSize: 38,
    hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Tan',
    tags: ['catalogue', 'swimwear', 'lifestyle', 'commercial'],
    rates: { dayRate: 1400, halfDayRate: 860, hourlyRate: 195 },
    profileImage: portrait('women', 21),
    portfolioImages: [
      picsumPortfolio('diana-swimwear'), picsumPortfolio('diana-lifestyle'),
      picsumPortfolio('diana-editorial'), picsumPortfolio('diana-studio'),
    ],
  },
  {
    email: 'madison.lee@demo.kailani',
    displayName: 'Madison Lee',
    location: 'Los Angeles, CA',
    bio: 'LA-based commercial model with 4 years of experience in print and digital advertising.',
    heightCm: 170, bustCm: 86, waistCm: 64, hipsCm: 91, shoeSize: 38,
    hairColor: 'Blonde', eyeColor: 'Blue', skinTone: 'Light',
    tags: ['commercial', 'catalogue', 'lifestyle', 'beauty'],
    rates: { dayRate: 1500, halfDayRate: 900, hourlyRate: 200 },
    profileImage: portrait('women', 22),
    portfolioImages: [
      picsumPortfolio('madison-commercial'), picsumPortfolio('madison-beauty'),
      picsumPortfolio('madison-lifestyle'),
    ],
  },
  // Male models
  {
    email: 'marcus.taylor@demo.kailani',
    displayName: 'Marcus Taylor',
    location: 'New York, NY',
    bio: 'NYC-based male model with strong editorial and runway experience. Walked for major designers at NYFW and Milan.',
    heightCm: 188, waistCm: 81, shoeSize: 44,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Brown',
    tags: ['editorial', 'runway', 'menswear', 'commercial'],
    rates: { dayRate: 2200, halfDayRate: 1300, hourlyRate: 300 },
    profileImage: portrait('men', 1),
    portfolioImages: [
      picsumPortfolio('marcus-editorial'), picsumPortfolio('marcus-runway'),
      picsumPortfolio('marcus-menswear'), picsumPortfolio('marcus-studio'),
    ],
  },
  {
    email: 'liam.chen@demo.kailani',
    displayName: 'Liam Chen',
    location: 'Los Angeles, CA',
    bio: 'LA-based Asian-American male model. Commercial and lifestyle specialist. Strong social media presence.',
    heightCm: 183, waistCm: 79, shoeSize: 43,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
    tags: ['commercial', 'lifestyle', 'fitness', 'menswear'],
    rates: { dayRate: 1800, halfDayRate: 1100, hourlyRate: 250 },
    profileImage: portrait('men', 2),
    portfolioImages: [
      picsumPortfolio('liam-commercial'), picsumPortfolio('liam-fitness'),
      picsumPortfolio('liam-lifestyle'),
    ],
  },
  {
    email: 'kai.nakamura@demo.kailani',
    displayName: 'Kai Nakamura',
    location: 'Honolulu, HI',
    bio: 'Honolulu-based model. Outdoor, surf, and lifestyle specialist. The authentic Hawaii look brands love.',
    heightCm: 182, waistCm: 80, shoeSize: 43,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Tan',
    tags: ['lifestyle', 'swimwear', 'outdoor', 'fitness', 'surf'],
    rates: { dayRate: 1300, halfDayRate: 800, hourlyRate: 185 },
    profileImage: portrait('men', 3),
    portfolioImages: [
      picsumPortfolio('kai-outdoor'), picsumPortfolio('kai-swim'),
      picsumPortfolio('kai-lifestyle'), picsumPortfolio('kai-surf'),
    ],
  },
  {
    email: 'pierre.laurent@demo.kailani',
    displayName: 'Pierre Laurent',
    location: 'Paris, France',
    bio: 'Parisian male model with a classic European look. 10 years in the industry. Worked with Dior Homme and Hermès.',
    heightCm: 187, waistCm: 82, shoeSize: 44,
    hairColor: 'Brown', eyeColor: 'Blue', skinTone: 'Fair',
    tags: ['high-fashion', 'editorial', 'runway', 'menswear'],
    rates: { dayRate: 3000, halfDayRate: 1800, hourlyRate: 400 },
    profileImage: portrait('men', 4),
    portfolioImages: [
      picsumPortfolio('pierre-fashion'), picsumPortfolio('pierre-editorial'),
      picsumPortfolio('pierre-runway'), picsumPortfolio('pierre-studio'),
      picsumPortfolio('pierre-portrait'),
    ],
  },
  {
    email: 'james.okafor@demo.kailani',
    displayName: 'James Okafor',
    location: 'London, UK',
    bio: 'London-based male model. Strong editorial presence. Worked with GQ UK and Esquire. Available for international travel.',
    heightCm: 190, waistCm: 83, shoeSize: 45,
    hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Deep',
    tags: ['editorial', 'menswear', 'runway', 'commercial'],
    rates: { dayRate: 2400, halfDayRate: 1450, hourlyRate: 330 },
    profileImage: portrait('men', 5),
    portfolioImages: [
      picsumPortfolio('james-editorial'), picsumPortfolio('james-menswear'),
      picsumPortfolio('james-runway'), picsumPortfolio('james-studio'),
    ],
  },
  {
    email: 'alex.russo@demo.kailani',
    displayName: 'Alex Russo',
    location: 'Miami, FL',
    bio: 'Miami-based fitness and lifestyle model. 6-pack certified. Activewear, swimwear, and sports brands are my specialty.',
    heightCm: 185, waistCm: 78, shoeSize: 44,
    hairColor: 'Brown', eyeColor: 'Green', skinTone: 'Olive',
    tags: ['fitness', 'swimwear', 'activewear', 'lifestyle', 'sports'],
    rates: { dayRate: 1600, halfDayRate: 1000, hourlyRate: 220 },
    profileImage: portrait('men', 6),
    portfolioImages: [
      picsumPortfolio('alex-fitness'), picsumPortfolio('alex-swim'),
      picsumPortfolio('alex-sports'), picsumPortfolio('alex-outdoor'),
    ],
  },
  {
    email: 'noah.berg@demo.kailani',
    displayName: 'Noah Berg',
    location: 'New York, NY',
    bio: 'NYC commercial and catalogue model. 5 years working with major e-commerce brands. Consistent, professional, versatile.',
    heightCm: 184, waistCm: 81, shoeSize: 43,
    hairColor: 'Blonde', eyeColor: 'Gray', skinTone: 'Fair',
    tags: ['commercial', 'catalogue', 'menswear', 'lifestyle'],
    rates: { dayRate: 1700, halfDayRate: 1050, hourlyRate: 240 },
    profileImage: portrait('men', 7),
    portfolioImages: [
      picsumPortfolio('noah-catalogue'), picsumPortfolio('noah-commercial'),
      picsumPortfolio('noah-lifestyle'),
    ],
  },
  {
    email: 'rafael.santos@demo.kailani',
    displayName: 'Rafael Santos',
    location: 'Miami, FL',
    bio: 'Brazilian male model based in Miami. Specializing in luxury fashion and swimwear campaigns.',
    heightCm: 186, waistCm: 80, shoeSize: 44,
    hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Tan',
    tags: ['swimwear', 'menswear', 'editorial', 'luxury'],
    rates: { dayRate: 2000, halfDayRate: 1200, hourlyRate: 270 },
    profileImage: portrait('men', 8),
    portfolioImages: [
      picsumPortfolio('rafael-swim'), picsumPortfolio('rafael-fashion'),
      picsumPortfolio('rafael-editorial'), picsumPortfolio('rafael-beach'),
    ],
  },
];

// ─── Brands ──────────────────────────────────────────────────────────────────

const BRANDS: BrandSeed[] = [
  {
    email: 'casting@luminosa.demo',
    brandName: 'Luminosa Studio',
    industry: 'Beauty',
    bio: 'Luminosa is a prestige beauty brand celebrating diverse skin tones and natural radiance. We work with authentic faces that reflect our global community.',
    location: 'New York, NY',
    website: 'https://luminosa.example',
    instagramUrl: 'https://instagram.com/luminosastudio',
    logoUrl: `https://picsum.photos/seed/luminosa-logo/400/400`,
  },
  {
    email: 'bookings@waveco.demo',
    brandName: 'Wave & Co.',
    industry: 'Lifestyle',
    bio: 'Swimwear and surf lifestyle brand born in Hawaii. We celebrate the ocean, the sun, and the free-spirited people who live by them.',
    location: 'Honolulu, HI',
    website: 'https://waveandco.example',
    instagramUrl: 'https://instagram.com/waveandco',
    logoUrl: `https://picsum.photos/seed/waveco-logo/400/400`,
  },
  {
    email: 'talent@maison-clair.demo',
    brandName: 'Maison Clair',
    industry: 'Fashion',
    bio: 'Paris-based luxury fashion house known for clean lines, exceptional craftsmanship, and timeless French elegance.',
    location: 'Paris, France',
    website: 'https://maisonclair.example',
    instagramUrl: 'https://instagram.com/maisonclair',
    logoUrl: `https://picsum.photos/seed/maison-logo/400/400`,
  },
  {
    email: 'casting@apexactive.demo',
    brandName: 'Apex Active',
    industry: 'Sports',
    bio: 'Performance activewear for serious athletes and weekend warriors alike. We need models who move, sweat, and inspire.',
    location: 'Los Angeles, CA',
    website: 'https://apexactive.example',
    instagramUrl: 'https://instagram.com/apexactive',
    logoUrl: `https://picsum.photos/seed/apex-logo/400/400`,
  },
  {
    email: 'models@solstice.demo',
    brandName: 'Solstice Collective',
    industry: 'Apparel',
    bio: 'Sustainable fashion collective creating timeless wardrobe essentials. We champion slow fashion and the people who wear it with intention.',
    location: 'London, UK',
    website: 'https://solsticecollective.example',
    instagramUrl: 'https://instagram.com/solsticecollective',
    logoUrl: `https://picsum.photos/seed/solstice-logo/400/400`,
  },
  {
    email: 'talent@neonblush.demo',
    brandName: 'Neon Blush',
    industry: 'Beauty',
    bio: 'Bold, expressive beauty for gen Z and millennials. We make makeup that makes a statement. Looking for creative, expressive faces.',
    location: 'Los Angeles, CA',
    website: 'https://neonblush.example',
    instagramUrl: 'https://instagram.com/neonblush',
    logoUrl: `https://picsum.photos/seed/neonblush-logo/400/400`,
  },
  {
    email: 'bookings@rivieraswim.demo',
    brandName: 'Riviera Swim',
    industry: 'Fashion',
    bio: 'Luxury swimwear inspired by the French Riviera. Sophisticated cuts, premium fabrics, and effortless glamour for the discerning traveller.',
    location: 'Miami, FL',
    website: 'https://rivieraswim.example',
    instagramUrl: 'https://instagram.com/rivieraswim',
    logoUrl: `https://picsum.photos/seed/riviera-logo/400/400`,
  },
  {
    email: 'casting@urbanthread.demo',
    brandName: 'Urban Thread',
    industry: 'Apparel',
    bio: 'Contemporary streetwear brand rooted in city culture. We cast real people with real stories — not just faces.',
    location: 'New York, NY',
    website: 'https://urbanthread.example',
    instagramUrl: 'https://instagram.com/urbanthread',
    logoUrl: `https://picsum.photos/seed/urbanthread-logo/400/400`,
  },
];

// ─── Photographers ───────────────────────────────────────────────────────────

const PHOTOGRAPHERS: PhotographerSeed[] = [
  {
    email: 'studio@alexandros.demo',
    displayName: 'Alexandros Papadopoulos',
    location: 'New York, NY',
    bio: 'NYC-based fashion and editorial photographer. Published in Vogue, W Magazine, and Harper\'s Bazaar. I build a visual story, not just images.',
    specialties: ['editorial', 'high-fashion', 'beauty', 'portrait'],
    rates: { dayRate: 4000, halfDayRate: 2500, hourlyRate: 500 },
    profileImage: portrait('men', 10),
    portfolioImages: [
      picsumPortfolio('alex-fashion-ph'), picsumPortfolio('alex-beauty-ph'),
      picsumPortfolio('alex-editorial-ph'), picsumPortfolio('alex-studio-ph'),
      picsumPortfolio('alex-portrait-ph'),
    ],
  },
  {
    email: 'hello@maikostudio.demo',
    displayName: 'Maiko Fujiwara',
    location: 'Tokyo, Japan',
    bio: 'Tokyo studio and location photographer. Specializing in editorial and commercial work across Japanese and international markets.',
    specialties: ['editorial', 'commercial', 'lookbook', 'portrait'],
    rates: { dayRate: 3000, halfDayRate: 1900, hourlyRate: 420 },
    profileImage: portrait('women', 25),
    portfolioImages: [
      picsumPortfolio('maiko-editorial'), picsumPortfolio('maiko-lookbook'),
      picsumPortfolio('maiko-portrait'), picsumPortfolio('maiko-studio'),
    ],
  },
  {
    email: 'book@cams-by-deleon.demo',
    displayName: 'Carlos De León',
    location: 'Miami, FL',
    bio: 'Miami and South Beach photographer. Master of natural light. Swimwear, lifestyle, and luxury travel campaigns are my playground.',
    specialties: ['swimwear', 'lifestyle', 'travel', 'outdoor'],
    rates: { dayRate: 3200, halfDayRate: 2000, hourlyRate: 450 },
    profileImage: portrait('men', 9),
    portfolioImages: [
      picsumPortfolio('carlos-swim-ph'), picsumPortfolio('carlos-beach-ph'),
      picsumPortfolio('carlos-travel-ph'), picsumPortfolio('carlos-lifestyle-ph'),
      picsumPortfolio('carlos-outdoor-ph'),
    ],
  },
  {
    email: 'hello@simonestudio.demo',
    displayName: 'Simone Beaumont',
    location: 'Paris, France',
    bio: 'Parisian photographer with a soft, cinematic style. I specialise in beauty, portrait, and editorial — making every subject feel like art.',
    specialties: ['beauty', 'portrait', 'editorial', 'cinematic'],
    rates: { dayRate: 3800, halfDayRate: 2300, hourlyRate: 480 },
    profileImage: portrait('women', 26),
    portfolioImages: [
      picsumPortfolio('simone-beauty-ph'), picsumPortfolio('simone-portrait-ph'),
      picsumPortfolio('simone-cinematic'), picsumPortfolio('simone-editorial-ph'),
    ],
  },
  {
    email: 'book@tommcreative.demo',
    displayName: 'Tom Ashworth',
    location: 'London, UK',
    bio: 'London commercial and catalogue photographer. High volume, fast-paced, always consistent. I keep shoots running on time and on budget.',
    specialties: ['commercial', 'catalogue', 'e-commerce', 'product'],
    rates: { dayRate: 2800, halfDayRate: 1700, hourlyRate: 380 },
    profileImage: portrait('men', 15),
    portfolioImages: [
      picsumPortfolio('tom-commercial-ph'), picsumPortfolio('tom-catalogue-ph'),
      picsumPortfolio('tom-ecomm-ph'), picsumPortfolio('tom-product-ph'),
    ],
  },
];

// ─── Campaigns ───────────────────────────────────────────────────────────────

const CAMPAIGNS: CampaignSeed[] = [
  {
    brandEmail: 'casting@luminosa.demo',
    title: 'Luminosa Summer Glow Campaign',
    description: 'Seeking 3 models for our summer skincare and foundation launch. We need diverse skin tones — this campaign celebrates every complexion. Two days of studio shooting in NYC. Strong beauty experience preferred.',
    budget: '$2,000–$3,000/day',
    location: 'New York, NY',
    tags: ['beauty', 'editorial', 'commercial'],
    startDate: new Date('2026-07-10'),
    endDate: new Date('2026-07-11'),
  },
  {
    brandEmail: 'casting@luminosa.demo',
    title: 'Holiday Gifting Digital Campaign',
    description: 'E-commerce and social content shoot for our holiday gift sets. Looking for 2 models with natural, relatable energy. One-day studio shoot with same-day turnaround. NYC preferred.',
    budget: '$1,500/day',
    location: 'New York, NY',
    tags: ['beauty', 'commercial', 'catalogue'],
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-15'),
  },
  {
    brandEmail: 'bookings@waveco.demo',
    title: 'Wave & Co. Resort Collection Shoot',
    description: 'Looking for 4–6 models (mixed gender) for our resort 2027 swimwear campaign. Shooting on location in Honolulu. Ocean confidence required — you will be in the water. Travel and accommodation covered for non-local talent.',
    budget: '$1,500–$2,000/day + travel',
    location: 'Honolulu, HI',
    tags: ['swimwear', 'lifestyle', 'outdoor', 'fitness'],
    startDate: new Date('2026-08-05'),
    endDate: new Date('2026-08-08'),
  },
  {
    brandEmail: 'talent@maison-clair.demo',
    title: 'Maison Clair AW26 Editorial',
    description: 'Exclusive editorial campaign for our Autumn/Winter 2026 collection. Seeking one female model with a strong editorial book and runway experience. Shooting in Paris over two days. Agency representation preferred but not required.',
    budget: '€3,500/day',
    location: 'Paris, France',
    tags: ['editorial', 'haute-couture', 'runway', 'high-fashion'],
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-02'),
  },
  {
    brandEmail: 'casting@apexactive.demo',
    title: 'Apex Active Spring Performance Lookbook',
    description: 'Energetic lookbook shoot for our new performance line. Need 2 male and 2 female models with genuine athletic backgrounds. Gym and outdoor locations in LA. High energy and ability to demonstrate movement essential.',
    budget: '$1,800/day',
    location: 'Los Angeles, CA',
    tags: ['fitness', 'activewear', 'sports', 'lifestyle'],
    startDate: new Date('2026-06-20'),
    endDate: new Date('2026-06-21'),
  },
  {
    brandEmail: 'models@solstice.demo',
    title: 'Solstice Collective Brand Campaign',
    description: 'Annual brand campaign celebrating slow fashion and intentional dressing. We want real people with character — not conventional model looks. Mix of ages 25–45. Studio and street locations in London.',
    budget: '£1,500–£2,000/day',
    location: 'London, UK',
    tags: ['editorial', 'commercial', 'sustainable', 'lifestyle'],
    startDate: new Date('2026-07-28'),
    endDate: new Date('2026-07-30'),
  },
  {
    brandEmail: 'talent@neonblush.demo',
    title: 'Neon Blush Bold Lips Collection',
    description: 'Creative, expressive beauty shoot for our new bold lip range. Looking for 4 diverse faces with strong makeup experience. Must be comfortable with bold, experimental looks. LA studio. Bring your energy.',
    budget: '$1,200–$1,500/day',
    location: 'Los Angeles, CA',
    tags: ['beauty', 'editorial', 'commercial'],
    startDate: new Date('2026-06-12'),
    endDate: new Date('2026-06-12'),
  },
  {
    brandEmail: 'bookings@rivieraswim.demo',
    title: 'Riviera Swim Capsule Collection',
    description: 'Luxury swimwear campaign for our capsule collection. Shooting in Miami and the Keys. Need 2–3 female models with a sophisticated, elegant presence. Experience with luxury fashion brands preferred.',
    budget: '$2,500–$3,000/day',
    location: 'Miami, FL',
    tags: ['swimwear', 'editorial', 'luxury', 'lifestyle'],
    startDate: new Date('2026-07-14'),
    endDate: new Date('2026-07-16'),
  },
  {
    brandEmail: 'casting@urbanthread.demo',
    title: 'Urban Thread SS27 Street Campaign',
    description: 'Street-style campaign for SS27. We want fresh faces and real style — not traditional model looks. Shooting across NYC. 10 models needed, gender diverse, ages 18–35. Two days, multiple looks per model.',
    budget: '$800–$1,200/day',
    location: 'New York, NY',
    tags: ['commercial', 'editorial', 'streetwear', 'catalogue'],
    startDate: new Date('2026-08-18'),
    endDate: new Date('2026-08-19'),
  },
  {
    brandEmail: 'casting@apexactive.demo',
    title: 'Apex Active Swim & Beach Range',
    description: 'Expanding into beach and swim. Need 3–4 models comfortable in surf and water environments. Shooting in LA and Miami. Genuine athletic build preferred. Two-day shoot.',
    budget: '$2,000/day + travel',
    location: 'Los Angeles, CA',
    tags: ['swimwear', 'fitness', 'lifestyle', 'outdoor'],
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-09-11'),
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding Kailani database…');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  console.log('🔑  Password hashed');

  // ── Models ──────────────────────────────────────────────────────────────
  console.log(`\n📸  Seeding ${MODELS.length} models…`);
  for (const m of MODELS) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { approved: true, emailVerified: true },
      create: { email: m.email, passwordHash, role: 'MODEL', approved: true, emailVerified: true },
    });

    await prisma.modelProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: m.displayName,
        bio: m.bio,
        location: m.location,
        heightCm: m.heightCm,
        bustCm: m.bustCm ?? null,
        waistCm: m.waistCm ?? null,
        hipsCm: m.hipsCm ?? null,
        shoeSize: m.shoeSize,
        hairColor: m.hairColor,
        eyeColor: m.eyeColor,
        skinTone: m.skinTone,
        tags: m.tags,
        rates: m.rates,
        profileImage: m.profileImage,
        coverImage: m.portfolioImages[0],
        portfolioImages: m.portfolioImages,
      },
      create: {
        userId: user.id,
        displayName: m.displayName,
        bio: m.bio,
        location: m.location,
        heightCm: m.heightCm,
        bustCm: m.bustCm ?? null,
        waistCm: m.waistCm ?? null,
        hipsCm: m.hipsCm ?? null,
        shoeSize: m.shoeSize,
        hairColor: m.hairColor,
        eyeColor: m.eyeColor,
        skinTone: m.skinTone,
        tags: m.tags,
        rates: m.rates,
        profileImage: m.profileImage,
        coverImage: m.portfolioImages[0],
        portfolioImages: m.portfolioImages,
      },
    });

    process.stdout.write('.');
  }
  console.log(' ✓');

  // ── Brands ───────────────────────────────────────────────────────────────
  console.log(`\n🏢  Seeding ${BRANDS.length} brands…`);
  const brandUserIds: Record<string, string> = {};

  for (const b of BRANDS) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: { approved: true, emailVerified: true },
      create: { email: b.email, passwordHash, role: 'BRAND', approved: true, emailVerified: true },
    });
    brandUserIds[b.email] = user.id;

    await prisma.brandProfile.upsert({
      where: { userId: user.id },
      update: {
        brandName: b.brandName,
        industry: b.industry,
        bio: b.bio,
        location: b.location,
        website: b.website,
        instagramUrl: b.instagramUrl,
        logoUrl: b.logoUrl,
      },
      create: {
        userId: user.id,
        brandName: b.brandName,
        industry: b.industry,
        bio: b.bio,
        location: b.location,
        website: b.website,
        instagramUrl: b.instagramUrl,
        logoUrl: b.logoUrl,
      },
    });

    process.stdout.write('.');
  }
  console.log(' ✓');

  // ── Photographers ────────────────────────────────────────────────────────
  console.log(`\n📷  Seeding ${PHOTOGRAPHERS.length} photographers…`);
  for (const p of PHOTOGRAPHERS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { approved: true, emailVerified: true },
      create: { email: p.email, passwordHash, role: 'PHOTOGRAPHER', approved: true, emailVerified: true },
    });

    await prisma.photographerProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: p.displayName,
        bio: p.bio,
        location: p.location,
        specialties: p.specialties,
        rates: p.rates,
        profileImage: p.profileImage,
        coverImage: p.portfolioImages[0],
        portfolioImages: p.portfolioImages,
      },
      create: {
        userId: user.id,
        displayName: p.displayName,
        bio: p.bio,
        location: p.location,
        specialties: p.specialties,
        rates: p.rates,
        profileImage: p.profileImage,
        coverImage: p.portfolioImages[0],
        portfolioImages: p.portfolioImages,
      },
    });

    process.stdout.write('.');
  }
  console.log(' ✓');

  // ── Campaigns ────────────────────────────────────────────────────────────
  console.log(`\n📣  Seeding ${CAMPAIGNS.length} campaigns…`);
  for (const c of CAMPAIGNS) {
    const brandUser = await prisma.user.findUnique({ where: { email: c.brandEmail } });
    if (!brandUser) { console.warn(`  ⚠ brand ${c.brandEmail} not found, skipping`); continue; }

    const brand = await prisma.brandProfile.findUnique({ where: { userId: brandUser.id } });
    if (!brand) { console.warn(`  ⚠ brand profile missing for ${c.brandEmail}, skipping`); continue; }

    const existing = await prisma.campaign.findFirst({
      where: { brandId: brand.id, title: c.title },
    });

    if (!existing) {
      await prisma.campaign.create({
        data: {
          brandId: brand.id,
          title: c.title,
          description: c.description,
          budget: c.budget,
          location: c.location,
          tags: c.tags,
          status: 'OPEN',
          startDate: c.startDate,
          endDate: c.endDate,
        },
      });
    }

    process.stdout.write('.');
  }
  console.log(' ✓');

  // ── Summary ──────────────────────────────────────────────────────────────
  const [users, models, brands, photographers, campaigns] = await Promise.all([
    prisma.user.count(),
    prisma.modelProfile.count(),
    prisma.brandProfile.count(),
    prisma.photographerProfile.count(),
    prisma.campaign.count(),
  ]);

  console.log('\n✅  Seed complete!');
  console.log(`   Users: ${users} | Models: ${models} | Brands: ${brands} | Photographers: ${photographers} | Campaigns: ${campaigns}`);
  console.log(`   Demo password for all accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
