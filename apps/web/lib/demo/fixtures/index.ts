import type { DemoState } from '../types';
import { clock } from './clock';
import { buildUsers, buildModelProfiles, buildBrandProfiles, buildPhotographerProfiles } from './people';
import { buildCampaigns, buildApplications } from './campaigns';
import {
  buildThreads, buildMessages, buildSwipes, buildMatches, buildReviews,
  buildStructuredReviews, buildPosts, buildSpotlights,
} from './social';
import { buildTutorials } from './content';

/** Build a fresh demo state with timestamps relative to `now`. */
export function buildFixtures(now: number = Date.now()): DemoState {
  const c = clock(now);
  return {
    version: 1,
    seededAt: c.now,
    users: buildUsers(c),
    modelProfiles: buildModelProfiles(c),
    brandProfiles: buildBrandProfiles(c),
    photographerProfiles: buildPhotographerProfiles(c),
    campaigns: buildCampaigns(c),
    applications: buildApplications(c),
    threads: buildThreads(c),
    messages: buildMessages(c),
    swipes: buildSwipes(c),
    matches: buildMatches(c),
    reviews: buildReviews(c),
    structuredReviews: buildStructuredReviews(c),
    posts: buildPosts(c),
    saved: [],
    blocks: [],
    reports: [],
    verifications: [],
    tutorials: buildTutorials(c),
    spotlights: buildSpotlights(c),
  };
}
