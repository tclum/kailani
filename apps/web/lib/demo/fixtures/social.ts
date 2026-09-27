import type {
  DemoThread, DemoMessage, DemoSwipe, DemoMatch, DemoReview,
  DemoStructuredReview, DemoPost, DemoSpotlight,
} from '../types';
import type { Clock } from './clock';
import { U } from './people';
import { C } from './campaigns';

// ─── Messaging ────────────────────────────────────────────────────────────────

type Line = [from: string, body: string, minutesAgo: number];

interface ThreadSeed {
  id: string;
  other: string;
  createdDaysAgo: number;
  /** Minutes ago the persona last read the thread (null = never). */
  kaiaReadMinutesAgo: number | null;
  lines: Line[];
}

const THREADS: ThreadSeed[] = [
  {
    id: 't-solstice', other: U.solstice, createdDaysAgo: 7, kaiaReadMinutesAgo: 300,
    lines: [
      [U.solstice, 'Hi Kaia! We loved your application for the brand campaign. You are confirmed for all three days.', 60 * 26],
      [U.kaia, 'Mahalo! I am so excited. Should I plan to arrive the day before?', 60 * 25],
      [U.solstice, 'Yes please. We will book you into a hotel near the studio. Call time on day one is 8am.', 60 * 24],
      [U.kaia, 'Perfect. Anything I should bring from my own wardrobe?', 60 * 6],
      [U.solstice, 'Just neutral underlayers and comfortable shoes for the street locations. Wardrobe covers the rest!', 42],
    ],
  },
  {
    id: 't-maison', other: U.maison, createdDaysAgo: 9, kaiaReadMinutesAgo: 60 * 30,
    lines: [
      [U.maison, 'Bonjour Kaia, you are on our shortlist for the autumn editorial.', 60 * 50],
      [U.kaia, 'Merci! That is wonderful news. Let me know what you need from me.', 60 * 49],
      [U.maison, 'Could you send a recent digitals set: front, profile, and full length, no makeup?', 60 * 20],
      [U.maison, 'We will make a final decision by the end of the week.', 60 * 19],
    ],
  },
  {
    id: 't-waveco', other: U.waveco, createdDaysAgo: 100, kaiaReadMinutesAgo: 60 * 24 * 3,
    lines: [
      [U.waveco, 'The resort 2026 images just went live. You look incredible in the sunrise set!', 60 * 24 * 5],
      [U.kaia, 'I just saw them. Thank you for such a fun shoot. That water was perfect.', 60 * 24 * 5 - 30],
      [U.waveco, 'We are casting resort 2027 soon. Keep an eye on the campaign board.', 60 * 24 * 4],
      [U.kaia, 'Will do. I would love to work together again.', 60 * 24 * 4 - 20],
    ],
  },
  {
    id: 't-simone', other: U.simone, createdDaysAgo: 20, kaiaReadMinutesAgo: 60 * 24 * 2,
    lines: [
      [U.simone, 'Hi Kaia, I am planning a soft-light beauty test in Honolulu next month. Interested?', 60 * 24 * 6],
      [U.kaia, 'Yes! I have been wanting more beauty close-ups in my book.', 60 * 24 * 6 - 45],
      [U.simone, 'Lovely. I will send a mood board and a couple of date options.', 60 * 24 * 2 - 10],
    ],
  },
];

export function buildThreads(c: Clock): DemoThread[] {
  return THREADS.map((t) => ({
    id: t.id,
    createdAt: c.daysAgo(t.createdDaysAgo),
    members: [
      { userId: U.kaia, lastReadAt: t.kaiaReadMinutesAgo === null ? null : c.minutesAgo(t.kaiaReadMinutesAgo) },
      { userId: t.other, lastReadAt: c.minutesAgo(1) },
    ],
  }));
}

export function buildMessages(c: Clock): DemoMessage[] {
  const out: DemoMessage[] = [];
  for (const t of THREADS) {
    t.lines.forEach(([senderId, body, minutesAgo], i) => {
      out.push({ id: `m-${t.id.slice(2)}-${i + 1}`, threadId: t.id, senderId, body, createdAt: c.minutesAgo(minutesAgo) });
    });
  }
  return out;
}

/**
 * Scripted replies sent back when the persona messages a fixture user. Replies
 * cycle per thread. Users without an entry get GENERIC_REPLIES.
 */
export const SCRIPTED_REPLIES: Record<string, string[]> = {
  [U.solstice]: [
    'Great question. I will check with our producer and get back to you today.',
    'Noted! I have added that to your call sheet.',
    'Sounds good. See you in London!',
  ],
  [U.maison]: [
    'Merci, we have received it. The team will review this afternoon.',
    'Parfait. We will be in touch very soon.',
  ],
  [U.waveco]: [
    'Always great to hear from you! Resort 2027 casting is open now on the campaign board.',
    'Love that. We will keep you in mind for the next shoot.',
  ],
  [U.simone]: [
    'Wonderful. I am thinking golden hour on the east side of the island.',
    'I will send the mood board tonight.',
  ],
};

export const GENERIC_REPLIES = [
  'Thanks for reaching out! Let me take a look and get back to you shortly.',
  'Sounds great. Talk soon!',
  'Appreciate the message. Our team will follow up.',
];

// ─── Swipes and matches ───────────────────────────────────────────────────────

export function buildSwipes(c: Clock): DemoSwipe[] {
  // Brands that already liked the persona: liking one of their open campaigns
  // in Discover produces a match, as in apps/api swipe.service.
  const brandLikes = [U.riviera, U.urban, U.apex, U.waveco, U.maison];
  return brandLikes.map((brandUserId, i) => ({
    id: `sw-${i + 1}`,
    swiperId: brandUserId,
    targetId: U.kaia,
    targetType: 'MODEL',
    direction: 'LIKE',
    createdAt: c.daysAgo(3 + i),
  }));
}

export function buildMatches(c: Clock): DemoMatch[] {
  const pair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);
  return [
    { other: U.waveco, daysAgo: 100 },
    { other: U.maison, daysAgo: 9 },
  ].map(({ other, daysAgo }, i) => {
    const [user1Id, user2Id] = pair(U.kaia, other);
    return { id: `match-${i + 1}`, user1Id, user2Id, createdAt: c.daysAgo(daysAgo) };
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function buildReviews(c: Clock): DemoReview[] {
  return [
    { id: 'rv-1', reviewerId: U.luminosa, revieweeId: U.kaia, campaignId: C.luminosaSummer, rating: 5, comment: 'Kaia was a joy on set. Flawless skin prep and endless patience with close-ups.', createdAt: c.daysAgo(40) },
    { id: 'rv-2', reviewerId: U.waveco, revieweeId: U.kaia, campaignId: C.wavecoResort26, rating: 5, comment: 'Fearless in the water and always on time for sunrise calls.', createdAt: c.daysAgo(88) },
    { id: 'rv-3', reviewerId: U.kaia, revieweeId: U.waveco, campaignId: C.wavecoResort26, rating: 5, comment: 'Clear brief, great team, paid on time.', createdAt: c.daysAgo(87) },
    { id: 'rv-4', reviewerId: U.maison, revieweeId: U.chloe, campaignId: C.maisonSpring, rating: 5, comment: 'A true professional.', createdAt: c.daysAgo(140) },
  ];
}

type Dims = Record<string, number | boolean>;

function overall(d: Dims): number {
  const nums = Object.entries(d).filter(([k, v]) => typeof v === 'number' && k !== 'wouldWorkAgain').map(([, v]) => v as number);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function buildStructuredReviews(c: Clock): DemoStructuredReview[] {
  const rows: Array<{
    id: string; reviewer: string; reviewee: string; campaign: string; dims: Dims;
    comment: string; response?: string; createdHoursAgo: number; isPublic?: boolean;
  }> = [
    {
      id: 'sr-1', reviewer: U.luminosa, reviewee: U.kaia, campaign: C.luminosaSummer,
      dims: { communication: 5, punctuality: 5, professionalism: 5, creativity: 4, wouldWorkAgain: true },
      comment: 'Kaia arrived prepared, took direction instantly, and kept the energy high for two long studio days.',
      createdHoursAgo: 24 * 40,
    },
    {
      id: 'sr-2', reviewer: U.waveco, reviewee: U.kaia, campaign: C.wavecoResort26,
      dims: { communication: 5, punctuality: 4, professionalism: 5, creativity: 5, wouldWorkAgain: true },
      comment: 'Comfortable in open water and full of ideas for movement shots. The sunrise set was her idea.',
      response: 'Mahalo, team! Best call sheet I have ever had.',
      createdHoursAgo: 24 * 88,
    },
    {
      // Still inside the 48-hour response window: shows as "pending" on the persona's own profile.
      id: 'sr-3', reviewer: U.urban, reviewee: U.kaia, campaign: C.urbanFall,
      dims: { communication: 4, punctuality: 5, professionalism: 5, creativity: 4, wouldWorkAgain: true },
      comment: 'Easy to work with on a fast, chaotic street shoot. Would book again for the spring drop.',
      createdHoursAgo: 18, isPublic: false,
    },
    {
      id: 'sr-4', reviewer: U.kaia, reviewee: U.waveco, campaign: C.wavecoResort26,
      dims: { communication: 5, paymentPromptness: 5, briefClarity: 5, respectOnSet: 5, wouldWorkAgain: true },
      comment: 'Detailed brief, safety kayak in the water, and payment landed within a week.',
      createdHoursAgo: 24 * 87,
    },
    {
      id: 'sr-5', reviewer: U.amara, reviewee: U.luminosa, campaign: C.luminosaSummer,
      dims: { communication: 5, paymentPromptness: 4, briefClarity: 5, respectOnSet: 5, wouldWorkAgain: true },
      comment: 'Inclusive team with a shade range that actually worked for my skin.',
      createdHoursAgo: 24 * 41,
    },
    {
      id: 'sr-6', reviewer: U.maison, reviewee: U.chloe, campaign: C.maisonSpring,
      dims: { communication: 5, punctuality: 5, professionalism: 5, creativity: 5, wouldWorkAgain: true },
      comment: 'Effortless in couture and generous with the team.',
      createdHoursAgo: 24 * 140,
    },
    {
      id: 'sr-7', reviewer: U.liam, reviewee: U.urban, campaign: C.urbanFall,
      dims: { communication: 4, paymentPromptness: 4, briefClarity: 3, respectOnSet: 5, wouldWorkAgain: true },
      comment: 'Fun crew. The brief changed a lot on the day, but they paid for the extra hours.',
      createdHoursAgo: 24 * 9,
    },
  ];
  return rows.map((r) => {
    const createdAt = c.hoursAgo(r.createdHoursAgo);
    const deadline = c.hoursFromNow(48 - r.createdHoursAgo);
    return {
      id: r.id,
      reviewerId: r.reviewer,
      revieweeId: r.reviewee,
      campaignId: r.campaign,
      dimensions: r.dims,
      overallRating: overall(r.dims),
      comment: r.comment,
      reviewerResponse: r.response ?? null,
      responseDeadline: deadline,
      isPublic: r.isPublic ?? true,
      flagCount: 0,
      adminFlagged: false,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

// ─── Community ────────────────────────────────────────────────────────────────

export function buildPosts(c: Clock): DemoPost[] {
  const rows: Array<{ id: string; author: string; campaign: string; content: string; daysAgo: number; response?: string }> = [
    {
      id: 'wt-1', author: U.kaia, campaign: C.wavecoResort26, daysAgo: 85,
      content: 'Sunrise swim shoot on the North Shore with Wave & Co. They had a safety kayak in the water the whole time and fed the crew like family. This is how ocean shoots should run.',
      response: 'We could not have done it without you, Kaia!',
    },
    {
      id: 'wt-2', author: U.amara, campaign: C.luminosaSummer, daysAgo: 38,
      content: 'Luminosa brought a makeup artist who actually knew how to work with deep skin tones. Small thing, huge difference.',
    },
    {
      id: 'wt-3', author: U.luminosa, campaign: C.luminosaSummer, daysAgo: 37,
      content: 'Our summer glow cast was a dream. Every one of them showed up prepared and kind. Thank you, Kaia, Amara, and Priya.',
    },
    {
      id: 'wt-4', author: U.liam, campaign: C.urbanFall, daysAgo: 8,
      content: 'Fall lookbook with Urban Thread: two days of rooftops and subway platforms. Long days, but the team kept it fun and paid overtime without being asked.',
    },
    {
      id: 'wt-5', author: U.maison, campaign: C.maisonSpring, daysAgo: 130,
      content: 'Our spring editorial in the atelier, with Chloé and Naomi. Quiet, focused, beautiful work.',
      response: 'Merci for having me. The light in that atelier was unreal.',
    },
  ];
  return rows.map((r) => ({
    id: r.id,
    authorId: r.author,
    campaignId: r.campaign,
    content: r.content,
    isPublic: true,
    responseDeadline: c.daysAgo(r.daysAgo - 2),
    subjectResponse: r.response ?? null,
    adminFlagged: false,
    createdAt: c.daysAgo(r.daysAgo),
  }));
}

// ─── Spotlights ───────────────────────────────────────────────────────────────

export function buildSpotlights(c: Clock): DemoSpotlight[] {
  return [
    { id: 'sp-1', userId: U.amara, type: 'model', reason: 'Three five-star reviews this month and a standout beauty campaign.' },
    { id: 'sp-2', userId: U.kai, type: 'rising_star', reason: 'Fearless in the water and the most-liked new profile this week.' },
    { id: 'sp-3', userId: U.simone, type: 'photographer', reason: 'Soft, cinematic portrait work that models keep asking for.' },
    { id: 'sp-4', userId: U.waveco, type: 'brand', reason: 'Safety-first ocean shoots and payment within a week, every time.' },
  ].map((s, i) => ({ ...s, weekOf: c.daysAgo(1), createdAt: c.minutesAgo(90 - i) }));
}
