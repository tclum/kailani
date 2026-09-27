import type { HandlerMap } from './util';
import { authHandlers } from './auth';
import { modelHandlers } from './models';
import { profileHandlers } from './profiles';
import { campaignHandlers } from './campaigns';
import { threadHandlers } from './threads';
import { swipeHandlers } from './swipe';
import { savedHandlers } from './saved';
import { reviewHandlers } from './reviews';
import { communityHandlers } from './community';
import { contentHandlers } from './content';
import { safetyHandlers } from './safety';

// Handler names referenced by ROUTES in ../routes.mjs.
export const HANDLERS: HandlerMap = {
  ...authHandlers,
  ...modelHandlers,
  ...profileHandlers,
  ...campaignHandlers,
  ...threadHandlers,
  ...swipeHandlers,
  ...savedHandlers,
  ...reviewHandlers,
  ...communityHandlers,
  ...contentHandlers,
  ...safetyHandlers,
};
