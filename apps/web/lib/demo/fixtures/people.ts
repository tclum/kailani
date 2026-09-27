import type { Role } from '@kailani/types';
import type { DemoUser, DemoModelProfile, DemoBrandProfile, DemoPhotographerProfile } from '../types';
import type { Clock } from './clock';

// Fictional people and brands only. Names and a few bios are adapted from
// apps/api/prisma/seed.ts with every real brand, agency, and publication removed.

const portrait = (g: 'women' | 'men', n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const photo = (seed: string, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const U = {
  // Models
  kaia: 'u-kaia', // the demo persona
  sofia: 'u-sofia',
  amara: 'u-amara',
  chloe: 'u-chloe',
  yuki: 'u-yuki',
  maya: 'u-maya',
  naomi: 'u-naomi',
  priya: 'u-priya',
  marcus: 'u-marcus',
  liam: 'u-liam',
  kai: 'u-kai',
  rafael: 'u-rafael',
  // Brands
  luminosa: 'u-luminosa',
  waveco: 'u-waveco',
  maison: 'u-maison',
  apex: 'u-apex',
  solstice: 'u-solstice',
  novablush: 'u-novablush',
  riviera: 'u-riviera',
  urban: 'u-urban',
  // Photographers
  alexandros: 'u-alexandros',
  maiko: 'u-maiko',
  carlos: 'u-carlos',
  simone: 'u-simone',
} as const;

/** Brand profile id for a brand user id (campaigns reference brand profile ids). */
export const brandProfileId = (userId: string) => `bp-${userId.slice(2)}`;

function user(c: Clock, id: string, email: string, role: Role, daysOld: number, verified = true): DemoUser {
  return {
    id,
    email,
    role,
    approved: true,
    emailVerified: true,
    verified,
    communityFlagged: false,
    createdAt: c.daysAgo(daysOld),
    updatedAt: c.daysAgo(Math.min(daysOld, 3)),
  };
}

export function buildUsers(c: Clock): DemoUser[] {
  return [
    // The persona is approved but not yet ID-verified, so the verification flow is live.
    user(c, U.kaia, 'kaia.mercer@demo.kailani', 'MODEL', 140, false),
    user(c, U.sofia, 'sofia.reyes@demo.kailani', 'MODEL', 300),
    user(c, U.amara, 'amara.osei@demo.kailani', 'MODEL', 280),
    user(c, U.chloe, 'chloe.martin@demo.kailani', 'MODEL', 260),
    user(c, U.yuki, 'yuki.tanaka@demo.kailani', 'MODEL', 240, false),
    user(c, U.maya, 'maya.johnson@demo.kailani', 'MODEL', 220),
    user(c, U.naomi, 'naomi.harris@demo.kailani', 'MODEL', 200),
    user(c, U.priya, 'priya.sharma@demo.kailani', 'MODEL', 180, false),
    user(c, U.marcus, 'marcus.taylor@demo.kailani', 'MODEL', 170),
    user(c, U.liam, 'liam.chen@demo.kailani', 'MODEL', 160, false),
    user(c, U.kai, 'kai.nakamura@demo.kailani', 'MODEL', 120),
    user(c, U.rafael, 'rafael.santos@demo.kailani', 'MODEL', 90),
    user(c, U.luminosa, 'casting@luminosa.demo', 'BRAND', 320),
    user(c, U.waveco, 'bookings@waveco.demo', 'BRAND', 310),
    user(c, U.maison, 'talent@maison-clair.demo', 'BRAND', 300),
    user(c, U.apex, 'casting@apexactive.demo', 'BRAND', 290),
    user(c, U.solstice, 'models@solstice.demo', 'BRAND', 250),
    user(c, U.novablush, 'talent@novablush.demo', 'BRAND', 230, false),
    user(c, U.riviera, 'bookings@rivieraswim.demo', 'BRAND', 210),
    user(c, U.urban, 'casting@urbanthread.demo', 'BRAND', 190),
    user(c, U.alexandros, 'studio@alexandros.demo', 'PHOTOGRAPHER', 330),
    user(c, U.maiko, 'hello@maikostudio.demo', 'PHOTOGRAPHER', 270),
    user(c, U.carlos, 'book@cams-by-deleon.demo', 'PHOTOGRAPHER', 250),
    user(c, U.simone, 'hello@simonestudio.demo', 'PHOTOGRAPHER', 200),
  ];
}

type ModelSeed = Omit<DemoModelProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function model(c: Clock, userId: string, daysOld: number, seed: ModelSeed): DemoModelProfile {
  return {
    id: `mp-${userId.slice(2)}`,
    userId,
    ...seed,
    createdAt: c.daysAgo(daysOld),
    updatedAt: c.daysAgo(Math.min(daysOld, 2)),
  };
}

export function buildModelProfiles(c: Clock): DemoModelProfile[] {
  return [
    model(c, U.kaia, 140, {
      displayName: 'Kaia Mercer',
      bio: 'Honolulu-based commercial and swimwear model. Six years in front of the camera, from resort campaigns on the North Shore to beauty close-ups in the studio. Comfortable in the ocean, calm on busy sets, and quick with direction.',
      location: 'Honolulu, HI',
      instagramUrl: 'https://instagram.example/kaiamercer',
      heightCm: 175, bustCm: 84, waistCm: 63, hipsCm: 90, shoeSize: 39,
      hairColor: 'Dark Brown', eyeColor: 'Brown', skinTone: 'Tan',
      weightKg: 58, build: 'Athletic', gender: 'Female', playingAgeMin: 22, playingAgeMax: 30,
      rates: { dayRate: 1800, halfDayRate: 1100, hourlyRate: 250 },
      availability: [],
      tags: ['swimwear', 'commercial', 'lifestyle', 'beauty', 'fitness'],
      // Unsplash sends CORS headers; the comp card draws its hero with crossOrigin="anonymous",
      // which randomuser.me portraits fail.
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      coverImage: photo('kaia-cover', 1200, 800),
      portfolioImages: [
        photo('kaia-shore'), photo('kaia-studio'), photo('kaia-beauty'),
        photo('kaia-resort'), photo('kaia-street'), photo('kaia-editorial'),
      ],
      modelingCredits: [
        { title: 'Resort 2026 Swim Campaign', role: 'Lead model', client: 'Wave & Co.', photographer: 'Carlos De León', location: 'Honolulu, HI', date: '2026' },
        { title: 'Summer Glow Launch', role: 'Beauty model', client: 'Luminosa Studio', location: 'New York, NY', date: '2026' },
        { title: 'Fall Lookbook', role: 'Model', client: 'Urban Thread', location: 'New York, NY', date: '2025' },
      ],
      commercialCredits: [
        { title: 'Reef-safe sun care spot', role: 'Featured swimmer', client: 'Wave & Co.', location: 'Maui, HI', date: '2025' },
      ],
      televisionCredits: [],
      filmCredits: [],
      skills: ['Swimming', 'Surfing', 'Hula', 'Yoga', 'Runway'],
      languages: ['English', 'Hawaiian (conversational)', 'Japanese (basic)'],
      education: [{ institution: 'Kapena Performing Arts Academy', degree: 'Certificate, Movement & Stage', year: '2019' }],
      unionStatus: 'Non-union',
      representation: 'Independent',
      website: 'https://kaiamercer.example',
    }),
    model(c, U.sofia, 300, {
      displayName: 'Sofia Reyes',
      bio: 'Editorial and commercial model with six years of experience and a strong runway background. Loves a clear brief and a fast-moving set.',
      location: 'New York, NY',
      heightCm: 178, bustCm: 84, waistCm: 61, hipsCm: 89, shoeSize: 39,
      hairColor: 'Brown', eyeColor: 'Brown', skinTone: 'Olive',
      rates: { dayRate: 2000, halfDayRate: 1200, hourlyRate: 300 },
      tags: ['editorial', 'commercial', 'runway', 'beauty'],
      profileImage: portrait('women', 1),
      portfolioImages: [photo('sofia-edit1'), photo('sofia-runway'), photo('sofia-beauty'), photo('sofia-comm')],
      skills: ['Runway', 'Dance'], languages: ['English', 'Spanish'],
    }),
    model(c, U.amara, 280, {
      displayName: 'Amara Osei',
      bio: 'High-fashion editorial model bringing strength and elegance to every frame. Published across international editorial titles.',
      location: 'Los Angeles, CA',
      heightCm: 180, bustCm: 86, waistCm: 63, hipsCm: 91, shoeSize: 40,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Deep',
      rates: { dayRate: 2500, halfDayRate: 1500, hourlyRate: 350 },
      tags: ['editorial', 'high-fashion', 'runway', 'commercial'],
      profileImage: portrait('women', 2),
      portfolioImages: [photo('amara-fashion'), photo('amara-street'), photo('amara-studio'), photo('amara-outdoor')],
      languages: ['English', 'Twi', 'French'],
    }),
    model(c, U.chloe, 260, {
      displayName: 'Chloé Martin',
      bio: 'Parisian editorial model with a minimalist aesthetic. Works with emerging designers on couture and beauty stories.',
      location: 'Paris, France',
      heightCm: 176, bustCm: 82, waistCm: 60, hipsCm: 87, shoeSize: 38,
      hairColor: 'Blonde', eyeColor: 'Blue', skinTone: 'Fair',
      rates: { dayRate: 3000, halfDayRate: 1800, hourlyRate: 400 },
      tags: ['editorial', 'haute-couture', 'beauty', 'minimalist'],
      profileImage: portrait('women', 3),
      portfolioImages: [photo('chloe-paris'), photo('chloe-couture'), photo('chloe-beauty'), photo('chloe-street'), photo('chloe-minimal')],
      languages: ['French', 'English'],
    }),
    model(c, U.yuki, 240, {
      displayName: 'Yuki Tanaka',
      bio: 'Tokyo-based model specializing in editorial and commercial work, with a calm presence and a strong beauty book.',
      location: 'Tokyo, Japan',
      heightCm: 170, bustCm: 80, waistCm: 58, hipsCm: 85, shoeSize: 37,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
      rates: { dayRate: 1800, halfDayRate: 1100, hourlyRate: 250 },
      tags: ['editorial', 'commercial', 'beauty', 'lookbook'],
      profileImage: portrait('women', 4),
      portfolioImages: [photo('yuki-editorial'), photo('yuki-beauty'), photo('yuki-fashion'), photo('yuki-street')],
      languages: ['Japanese', 'English'],
    }),
    model(c, U.maya, 220, {
      displayName: 'Maya Johnson',
      bio: 'Swimwear and lifestyle model based in Miami. Sun, ocean, and authentic energy. Open to travel.',
      location: 'Miami, FL',
      heightCm: 172, bustCm: 88, waistCm: 65, hipsCm: 93, shoeSize: 38,
      hairColor: 'Brown', eyeColor: 'Hazel', skinTone: 'Tan',
      rates: { dayRate: 1500, halfDayRate: 900, hourlyRate: 200 },
      tags: ['swimwear', 'lifestyle', 'fitness', 'commercial'],
      profileImage: portrait('women', 5),
      portfolioImages: [photo('maya-swim1'), photo('maya-beach'), photo('maya-lifestyle'), photo('maya-fitness')],
    }),
    model(c, U.naomi, 200, {
      displayName: 'Naomi Harris',
      bio: 'London-based fit and editorial model with a strong print background and several fashion-week seasons behind her.',
      location: 'London, UK',
      heightCm: 175, bustCm: 83, waistCm: 62, hipsCm: 90, shoeSize: 39,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Brown',
      rates: { dayRate: 2200, halfDayRate: 1300, hourlyRate: 300 },
      tags: ['editorial', 'fit-model', 'commercial', 'runway'],
      profileImage: portrait('women', 7),
      portfolioImages: [photo('naomi-print'), photo('naomi-fit'), photo('naomi-runway'), photo('naomi-studio')],
    }),
    model(c, U.priya, 180, {
      displayName: 'Priya Sharma',
      bio: 'Beauty and bridal model with a love for bold color. Experienced with long hair-and-makeup days.',
      location: 'Los Angeles, CA',
      heightCm: 168, bustCm: 82, waistCm: 61, hipsCm: 88, shoeSize: 37,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Medium',
      rates: { dayRate: 1400, halfDayRate: 850, hourlyRate: 180 },
      tags: ['beauty', 'bridal', 'commercial'],
      profileImage: portrait('women', 9),
      portfolioImages: [photo('priya-beauty'), photo('priya-bridal'), photo('priya-color')],
    }),
    model(c, U.marcus, 170, {
      displayName: 'Marcus Taylor',
      bio: 'Fitness and commercial model. Former collegiate sprinter who brings real movement to activewear shoots.',
      location: 'Los Angeles, CA',
      heightCm: 188, shoeSize: 45,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Deep',
      rates: { dayRate: 1600, halfDayRate: 950, hourlyRate: 220 },
      tags: ['fitness', 'activewear', 'commercial', 'lifestyle'],
      profileImage: portrait('men', 1),
      portfolioImages: [photo('marcus-track'), photo('marcus-gym'), photo('marcus-street')],
    }),
    model(c, U.liam, 160, {
      displayName: 'Liam Chen',
      bio: 'Streetwear and lookbook model with a background in skate culture. Relaxed, natural, and easy to direct.',
      location: 'New York, NY',
      heightCm: 183, shoeSize: 43,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Light',
      rates: { dayRate: 1200, halfDayRate: 750, hourlyRate: 160 },
      tags: ['streetwear', 'lookbook', 'commercial'],
      profileImage: portrait('men', 2),
      portfolioImages: [photo('liam-street'), photo('liam-skate'), photo('liam-lookbook')],
    }),
    model(c, U.kai, 120, {
      displayName: 'Kai Nakamura',
      bio: 'Oʻahu surfer and lifestyle model. Most comfortable in the water; happy to paddle out for the shot.',
      location: 'Honolulu, HI',
      heightCm: 181, shoeSize: 44,
      hairColor: 'Black', eyeColor: 'Brown', skinTone: 'Tan',
      rates: { dayRate: 1300, halfDayRate: 800, hourlyRate: 175 },
      tags: ['swimwear', 'lifestyle', 'outdoor', 'fitness'],
      profileImage: portrait('men', 3),
      portfolioImages: [photo('kai-surf'), photo('kai-reef'), photo('kai-sunset'), photo('kai-board')],
    }),
    model(c, U.rafael, 90, {
      displayName: 'Rafael Santos',
      bio: 'Editorial and menswear model splitting time between Miami and São Paulo.',
      location: 'Miami, FL',
      heightCm: 186, shoeSize: 44,
      hairColor: 'Brown', eyeColor: 'Green', skinTone: 'Olive',
      rates: { dayRate: 1700, halfDayRate: 1000, hourlyRate: 230 },
      tags: ['editorial', 'menswear', 'swimwear'],
      profileImage: portrait('men', 5),
      portfolioImages: [photo('rafael-menswear'), photo('rafael-beach'), photo('rafael-studio')],
      languages: ['Portuguese', 'English', 'Spanish'],
    }),
  ];
}

type BrandSeed = Omit<DemoBrandProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function brand(c: Clock, userId: string, daysOld: number, seed: BrandSeed): DemoBrandProfile {
  return { id: brandProfileId(userId), userId, ...seed, createdAt: c.daysAgo(daysOld), updatedAt: c.daysAgo(5) };
}

export function buildBrandProfiles(c: Clock): DemoBrandProfile[] {
  return [
    brand(c, U.luminosa, 320, {
      brandName: 'Luminosa Studio', industry: 'Beauty', location: 'New York, NY',
      bio: 'A beauty brand celebrating diverse skin tones and natural radiance. We cast authentic faces that reflect our community.',
      website: 'https://luminosa.example', logoUrl: photo('luminosa-logo', 400, 400),
    }),
    brand(c, U.waveco, 310, {
      brandName: 'Wave & Co.', industry: 'Lifestyle', location: 'Honolulu, HI',
      bio: 'Swimwear and surf lifestyle label born in Hawaiʻi. We celebrate the ocean, the sun, and the people who live by them.',
      website: 'https://waveandco.example', logoUrl: photo('waveco-logo', 400, 400),
    }),
    brand(c, U.maison, 300, {
      brandName: 'Maison Clair', industry: 'Fashion', location: 'Paris, France',
      bio: 'Paris fashion house known for clean lines, careful craftsmanship, and quiet elegance.',
      website: 'https://maisonclair.example', logoUrl: photo('maison-logo', 400, 400),
    }),
    brand(c, U.apex, 290, {
      brandName: 'Apex Active', industry: 'Sports', location: 'Los Angeles, CA',
      bio: 'Performance activewear for serious athletes and weekend warriors. We cast people who move.',
      website: 'https://apexactive.example', logoUrl: photo('apex-logo', 400, 400),
    }),
    brand(c, U.solstice, 250, {
      brandName: 'Solstice Collective', industry: 'Apparel', location: 'London, UK',
      bio: 'Sustainable collective making timeless wardrobe essentials. Slow fashion, worn with intention.',
      website: 'https://solsticecollective.example', logoUrl: photo('solstice-logo', 400, 400),
    }),
    brand(c, U.novablush, 230, {
      brandName: 'Nova Blush', industry: 'Beauty', location: 'Los Angeles, CA',
      bio: 'Bold, expressive makeup. Looking for creative faces who like a statement look.',
      website: 'https://novablush.example', logoUrl: photo('novablush-logo', 400, 400),
    }),
    brand(c, U.riviera, 210, {
      brandName: 'Riviera Swim', industry: 'Fashion', location: 'Miami, FL',
      bio: 'Swimwear with sophisticated cuts and premium fabrics, made for travel.',
      website: 'https://rivieraswim.example', logoUrl: photo('riviera-logo', 400, 400),
    }),
    brand(c, U.urban, 190, {
      brandName: 'Urban Thread', industry: 'Apparel', location: 'New York, NY',
      bio: 'Contemporary streetwear rooted in city culture. We cast real people with real stories.',
      website: 'https://urbanthread.example', logoUrl: photo('urbanthread-logo', 400, 400),
    }),
  ];
}

type PhotographerSeed = Omit<DemoPhotographerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function photographer(c: Clock, userId: string, daysOld: number, seed: PhotographerSeed): DemoPhotographerProfile {
  return { id: `pp-${userId.slice(2)}`, userId, ...seed, createdAt: c.daysAgo(daysOld), updatedAt: c.daysAgo(4) };
}

export function buildPhotographerProfiles(c: Clock): DemoPhotographerProfile[] {
  return [
    photographer(c, U.alexandros, 330, {
      displayName: 'Alexandros Papadopoulos', location: 'New York, NY',
      bio: 'Fashion and editorial photographer. I build a visual story, not just images.',
      specialties: ['editorial', 'high-fashion', 'beauty', 'portrait'],
      rates: { dayRate: 4000, halfDayRate: 2500, hourlyRate: 500 },
      profileImage: portrait('men', 10),
      portfolioImages: [photo('alex-fashion-ph'), photo('alex-beauty-ph'), photo('alex-editorial-ph'), photo('alex-studio-ph')],
    }),
    photographer(c, U.maiko, 270, {
      displayName: 'Maiko Fujiwara', location: 'Tokyo, Japan',
      bio: 'Studio and location photographer working across editorial and commercial projects.',
      specialties: ['editorial', 'commercial', 'lookbook', 'portrait'],
      rates: { dayRate: 3000, halfDayRate: 1900, hourlyRate: 420 },
      profileImage: portrait('women', 25),
      portfolioImages: [photo('maiko-editorial'), photo('maiko-lookbook'), photo('maiko-portrait'), photo('maiko-studio')],
    }),
    photographer(c, U.carlos, 250, {
      displayName: 'Carlos De León', location: 'Miami, FL',
      bio: 'Natural-light photographer. Swimwear, lifestyle, and travel campaigns are my playground.',
      specialties: ['swimwear', 'lifestyle', 'travel', 'outdoor'],
      rates: { dayRate: 3200, halfDayRate: 2000, hourlyRate: 450 },
      profileImage: portrait('men', 9),
      portfolioImages: [photo('carlos-swim-ph'), photo('carlos-beach-ph'), photo('carlos-travel-ph'), photo('carlos-lifestyle-ph')],
    }),
    photographer(c, U.simone, 200, {
      displayName: 'Simone Beaumont', location: 'Paris, France',
      bio: 'Soft, cinematic beauty and portrait work that makes every subject feel like art.',
      specialties: ['beauty', 'portrait', 'editorial', 'cinematic'],
      rates: { dayRate: 3800, halfDayRate: 2300, hourlyRate: 480 },
      profileImage: portrait('women', 26),
      portfolioImages: [photo('simone-beauty-ph'), photo('simone-portrait-ph'), photo('simone-cinematic'), photo('simone-editorial-ph')],
    }),
  ];
}
