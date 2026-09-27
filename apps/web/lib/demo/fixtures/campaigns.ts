import type { CampaignStatus, ApplicationStatus } from '@kailani/types';
import type { DemoCampaign, DemoApplication } from '../types';
import type { Clock } from './clock';
import { U, brandProfileId } from './people';

export const C = {
  luminosaHoliday: 'c-luminosa-holiday',
  wavecoResort27: 'c-waveco-resort27',
  maisonAutumn: 'c-maison-autumn',
  apexSpring: 'c-apex-spring',
  solsticeBrand: 'c-solstice-brand',
  rivieraCapsule: 'c-riviera-capsule',
  urbanSS27: 'c-urban-ss27',
  apexSwim: 'c-apex-swim',
  novaGloss: 'c-nova-gloss',
  novaLips: 'c-nova-lips',
  luminosaSummer: 'c-luminosa-summer',
  wavecoResort26: 'c-waveco-resort26',
  urbanFall: 'c-urban-fall',
  maisonSpring: 'c-maison-spring',
} as const;

interface CampaignSeed {
  id: string;
  brandUserId: string;
  title: string;
  description: string;
  budget: string;
  location: string;
  tags: string[];
  status: CampaignStatus;
  /** Start date, in days from now (negative = past). */
  startIn: number;
  lengthDays: number;
  postedDaysAgo: number;
}

const SEEDS: CampaignSeed[] = [
  {
    id: C.novaGloss, brandUserId: U.novablush, status: 'OPEN',
    title: 'Nova Blush Glass Gloss Launch',
    description: 'Close-up beauty shoot for a new high-shine gloss range. Four faces, one studio day, lots of lip detail. Healthy skin and comfort with macro lenses a plus.',
    budget: '$1,200–$1,500/day', location: 'Los Angeles, CA', tags: ['beauty', 'commercial', 'editorial'],
    startIn: 16, lengthDays: 1, postedDaysAgo: 1,
  },
  {
    id: C.urbanSS27, brandUserId: U.urban, status: 'OPEN',
    title: 'Urban Thread SS27 Street Campaign',
    description: 'Street-style campaign for SS27. Fresh faces and real style, shot across the city. Ten models, gender diverse, ages 18–35. Two days, multiple looks per model.',
    budget: '$800–$1,200/day', location: 'New York, NY', tags: ['commercial', 'editorial', 'streetwear', 'catalogue'],
    startIn: 45, lengthDays: 2, postedDaysAgo: 2,
  },
  {
    id: C.rivieraCapsule, brandUserId: U.riviera, status: 'OPEN',
    title: 'Riviera Swim Capsule Collection',
    description: 'Swimwear campaign for a travel capsule. Shooting on a Miami beach and a sailboat. Two to three models with a composed, elegant presence.',
    budget: '$2,500–$3,000/day', location: 'Miami, FL', tags: ['swimwear', 'editorial', 'luxury', 'lifestyle'],
    startIn: 30, lengthDays: 3, postedDaysAgo: 3,
  },
  {
    id: C.wavecoResort27, brandUserId: U.waveco, status: 'OPEN',
    title: 'Wave & Co. Resort 2027 Shoot',
    description: 'Four to six models (mixed gender) for the resort 2027 swim campaign, on location on Oʻahu. Ocean confidence required; you will be in the water. Travel covered for non-local talent.',
    budget: '$1,500–$2,000/day + travel', location: 'Honolulu, HI', tags: ['swimwear', 'lifestyle', 'outdoor', 'fitness'],
    startIn: 35, lengthDays: 4, postedDaysAgo: 4,
  },
  {
    id: C.apexSwim, brandUserId: U.apex, status: 'OPEN',
    title: 'Apex Active Swim & Beach Range',
    description: 'Expanding into beach and swim. Three or four models comfortable in surf and open water. Genuine athletic build preferred. Two-day shoot.',
    budget: '$2,000/day + travel', location: 'Los Angeles, CA', tags: ['swimwear', 'fitness', 'lifestyle', 'outdoor'],
    startIn: 55, lengthDays: 2, postedDaysAgo: 5,
  },
  {
    id: C.luminosaHoliday, brandUserId: U.luminosa, status: 'OPEN',
    title: 'Luminosa Holiday Gifting Campaign',
    description: 'E-commerce and social content for holiday gift sets. Two models with natural, relatable energy. One studio day with same-day selects.',
    budget: '$1,500/day', location: 'New York, NY', tags: ['beauty', 'commercial', 'catalogue'],
    startIn: 20, lengthDays: 1, postedDaysAgo: 6,
  },
  {
    id: C.solsticeBrand, brandUserId: U.solstice, status: 'OPEN',
    title: 'Solstice Collective Brand Campaign',
    description: 'Annual brand campaign celebrating slow fashion and intentional dressing. Real people with character, ages 25–45. Studio and street locations.',
    budget: '£1,500–£2,000/day', location: 'London, UK', tags: ['editorial', 'commercial', 'sustainable', 'lifestyle'],
    startIn: 25, lengthDays: 3, postedDaysAgo: 9,
  },
  {
    id: C.maisonAutumn, brandUserId: U.maison, status: 'OPEN',
    title: 'Maison Clair Autumn Editorial',
    description: 'Editorial campaign for the autumn collection. One model with a strong editorial book and runway experience. Two days in Paris.',
    budget: '€3,500/day', location: 'Paris, France', tags: ['editorial', 'haute-couture', 'runway', 'high-fashion'],
    startIn: 18, lengthDays: 2, postedDaysAgo: 12,
  },
  {
    id: C.apexSpring, brandUserId: U.apex, status: 'OPEN',
    title: 'Apex Active Spring Performance Lookbook',
    description: 'High-energy lookbook for the new performance line. Two male and two female models with athletic backgrounds. Gym and outdoor locations.',
    budget: '$1,800/day', location: 'Los Angeles, CA', tags: ['fitness', 'activewear', 'sports', 'lifestyle'],
    startIn: 40, lengthDays: 2, postedDaysAgo: 14,
  },
  {
    id: C.novaLips, brandUserId: U.novablush, status: 'CLOSED',
    title: 'Nova Blush Bold Lips Collection',
    description: 'Creative beauty shoot for the bold lip range. Four diverse faces comfortable with experimental looks.',
    budget: '$1,200–$1,500/day', location: 'Los Angeles, CA', tags: ['beauty', 'editorial', 'commercial'],
    startIn: 5, lengthDays: 1, postedDaysAgo: 40,
  },
  {
    id: C.urbanFall, brandUserId: U.urban, status: 'COMPLETED',
    title: 'Urban Thread Fall Lookbook',
    description: 'Two-day lookbook for the fall drop, shot on rooftops and subway platforms.',
    budget: '$1,000/day', location: 'New York, NY', tags: ['streetwear', 'lookbook', 'commercial'],
    startIn: -12, lengthDays: 2, postedDaysAgo: 50,
  },
  {
    id: C.luminosaSummer, brandUserId: U.luminosa, status: 'COMPLETED',
    title: 'Luminosa Summer Glow Campaign',
    description: 'Summer skincare and foundation launch celebrating every complexion. Two days of studio shooting.',
    budget: '$2,000–$3,000/day', location: 'New York, NY', tags: ['beauty', 'editorial', 'commercial'],
    startIn: -45, lengthDays: 2, postedDaysAgo: 80,
  },
  {
    id: C.wavecoResort26, brandUserId: U.waveco, status: 'COMPLETED',
    title: 'Wave & Co. Resort 2026 Shoot',
    description: 'Resort 2026 swim campaign shot at sunrise on the North Shore.',
    budget: '$1,500/day', location: 'Honolulu, HI', tags: ['swimwear', 'lifestyle', 'outdoor'],
    startIn: -95, lengthDays: 3, postedDaysAgo: 130,
  },
  {
    id: C.maisonSpring, brandUserId: U.maison, status: 'COMPLETED',
    title: 'Maison Clair Spring Editorial',
    description: 'Spring editorial in a sunlit atelier.',
    budget: '€3,000/day', location: 'Paris, France', tags: ['editorial', 'haute-couture'],
    startIn: -150, lengthDays: 2, postedDaysAgo: 180,
  },
];

export function buildCampaigns(c: Clock): DemoCampaign[] {
  return SEEDS.map((s) => ({
    id: s.id,
    brandId: brandProfileId(s.brandUserId),
    title: s.title,
    description: s.description,
    budget: s.budget,
    location: s.location,
    startDate: c.dateFromNow(s.startIn),
    endDate: c.dateFromNow(s.startIn + s.lengthDays - 1),
    tags: s.tags,
    status: s.status,
    flagged: false,
    createdAt: c.daysAgo(s.postedDaysAgo),
    updatedAt: c.daysAgo(Math.max(0, s.postedDaysAgo - 1)),
  }));
}

/** Brand user id that owns a fixture campaign. */
export function campaignBrandUserId(campaignId: string): string | undefined {
  return SEEDS.find((s) => s.id === campaignId)?.brandUserId;
}

const mp = (userId: string) => `mp-${userId.slice(2)}`;

export function buildApplications(c: Clock): DemoApplication[] {
  const rows: Array<[string, string, ApplicationStatus, number, string | null]> = [
    // The persona's applications, one per status.
    [C.solsticeBrand, U.kaia, 'ACCEPTED', 8, 'I love the slow-fashion angle. Happy to travel to London for the shoot.'],
    [C.maisonAutumn, U.kaia, 'SHORTLISTED', 10, 'Editorial is where I want to grow. My runway reel is on my profile.'],
    [C.apexSpring, U.kaia, 'PENDING', 3, 'I surf and do yoga daily and can demonstrate movement on set.'],
    [C.novaLips, U.kaia, 'REJECTED', 35, null],
    [C.urbanFall, U.kaia, 'ACCEPTED', 45, 'Would love to shoot the fall drop.'],
    [C.luminosaSummer, U.kaia, 'ACCEPTED', 75, 'Beauty close-ups are my favorite work.'],
    [C.wavecoResort26, U.kaia, 'ACCEPTED', 125, 'Local to Oʻahu and comfortable in the water.'],
    // Everyone else.
    [C.luminosaSummer, U.amara, 'ACCEPTED', 76, null],
    [C.luminosaSummer, U.priya, 'ACCEPTED', 74, null],
    [C.wavecoResort26, U.kai, 'ACCEPTED', 126, null],
    [C.wavecoResort26, U.maya, 'ACCEPTED', 124, null],
    [C.urbanFall, U.liam, 'ACCEPTED', 46, null],
    [C.maisonSpring, U.chloe, 'ACCEPTED', 170, null],
    [C.maisonSpring, U.naomi, 'ACCEPTED', 168, null],
    [C.maisonAutumn, U.chloe, 'SHORTLISTED', 11, null],
    [C.maisonAutumn, U.sofia, 'PENDING', 9, null],
    [C.solsticeBrand, U.naomi, 'ACCEPTED', 8, null],
    [C.apexSpring, U.marcus, 'SHORTLISTED', 12, null],
    [C.urbanSS27, U.liam, 'PENDING', 1, null],
    [C.rivieraCapsule, U.maya, 'PENDING', 2, null],
    [C.rivieraCapsule, U.rafael, 'PENDING', 2, null],
    [C.wavecoResort27, U.kai, 'PENDING', 3, null],
    [C.novaGloss, U.priya, 'PENDING', 1, null],
    [C.luminosaHoliday, U.yuki, 'PENDING', 4, null],
  ];
  return rows.map(([campaignId, userId, status, daysAgo, coverNote], i) => ({
    id: `app-${i + 1}`,
    campaignId,
    modelId: mp(userId),
    coverNote,
    status,
    createdAt: c.daysAgo(daysAgo),
    updatedAt: c.daysAgo(Math.max(0, daysAgo - 2)),
  }));
}
