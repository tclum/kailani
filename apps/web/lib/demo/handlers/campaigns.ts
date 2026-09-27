import type { ApplicationStatus, CampaignStatus } from '@kailani/types';
import type { DemoCampaign, DemoState } from '../types';
import { fail, findUser, iso, requireRole, t, type Ctx, type HandlerMap } from './util';
import { newId } from '../store';

// Mirrors apps/api/src/routes/campaigns.ts and services/campaign.service.ts

function brandOf(state: DemoState, c: DemoCampaign) {
  return state.brandProfiles.find((b) => b.id === c.brandId);
}

const applicationCount = (state: DemoState, campaignId: string) =>
  state.applications.filter((a) => a.campaignId === campaignId).length;

/** listCampaigns include: brand summary (+ _count when withCounts) */
function listRow(state: DemoState, c: DemoCampaign) {
  const b = brandOf(state, c);
  return {
    ...c,
    brand: {
      id: b?.id ?? c.brandId,
      brandName: b?.brandName ?? '',
      logoUrl: b?.logoUrl ?? null,
      profileImage: b?.profileImage ?? null,
      location: b?.location ?? null,
    },
    _count: { applications: applicationCount(state, c.id) },
  };
}

/** getCampaign include: full brand select + _count */
function detailRow(state: DemoState, c: DemoCampaign) {
  const b = brandOf(state, c);
  return {
    ...c,
    brand: {
      id: b?.id ?? c.brandId,
      brandName: b?.brandName ?? '',
      logoUrl: b?.logoUrl ?? null,
      profileImage: b?.profileImage ?? null,
      location: b?.location ?? null,
      website: b?.website ?? null,
      instagramUrl: b?.instagramUrl ?? null,
      userId: b?.userId ?? '',
    },
    _count: { applications: applicationCount(state, c.id) },
  };
}

function getCampaign(state: DemoState, id: string): DemoCampaign {
  const c = state.campaigns.find((x) => x.id === id);
  if (!c) fail(404, 'Campaign not found');
  return c;
}

function myBrandId(ctx: Ctx): string {
  const userId = requireRole(ctx, 'BRAND');
  const brand = ctx.state.brandProfiles.find((b) => b.userId === userId);
  if (!brand) fail(400, 'Complete your brand profile first', 'NO_BRAND_PROFILE');
  return brand.id;
}

function myModelId(ctx: Ctx): string | null {
  const userId = requireRole(ctx, 'MODEL');
  return ctx.state.modelProfiles.find((m) => m.userId === userId)?.id ?? null;
}

const CAMPAIGN_FIELDS = ['title', 'description', 'budget', 'location', 'startDate', 'endDate', 'tags', 'status'] as const;
const STATUSES: CampaignStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'];
const APP_STATUSES: ApplicationStatus[] = ['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];

function applyCampaignFields(target: DemoCampaign, body: Record<string, unknown>) {
  for (const k of CAMPAIGN_FIELDS) {
    const v = body[k];
    if (v === undefined) continue;
    if (k === 'status' && !STATUSES.includes(v as CampaignStatus)) fail(400, 'Invalid status');
    if ((k === 'startDate' || k === 'endDate') && v) {
      (target as unknown as Record<string, unknown>)[k] = new Date(v as string).toISOString();
    } else {
      (target as unknown as Record<string, unknown>)[k] = v;
    }
  }
}

export const campaignHandlers: HandlerMap = {
  'campaigns.list': ({ state, query }) => {
    const status = query.get('status');
    const tags = query.get('tags')?.split(',');
    const location = query.get('location');
    const page = query.get('page') ? Number(query.get('page')) : 1;
    const limit = query.get('limit') ? Number(query.get('limit')) : 20;
    const filtered = state.campaigns
      .filter((c) => !status || c.status === status)
      .filter((c) => !tags || tags.length === 0 || c.tags.some((tag) => tags.includes(tag)))
      .filter((c) => !location || (c.location ?? '').toLowerCase().includes(location.toLowerCase()))
      .sort((a, b) => t(b.createdAt) - t(a.createdAt));
    const campaigns = filtered.slice((page - 1) * limit, page * limit).map((c) => listRow(state, c));
    return { campaigns, total: filtered.length, page, limit };
  },

  'campaigns.myApplications': (ctx) => {
    const modelId = myModelId(ctx);
    if (!modelId) return [];
    const { state } = ctx;
    return state.applications
      .filter((a) => a.modelId === modelId)
      .sort((a, b) => t(b.createdAt) - t(a.createdAt))
      .map((a) => {
        const c = getCampaign(state, a.campaignId);
        const b = brandOf(state, c);
        return {
          ...a,
          campaign: {
            ...c,
            brand: {
              id: b?.id ?? c.brandId,
              brandName: b?.brandName ?? '',
              logoUrl: b?.logoUrl ?? null,
              profileImage: b?.profileImage ?? null,
              userId: b?.userId ?? '',
            },
          },
        };
      });
  },

  'campaigns.myApplication': (ctx) => {
    const modelId = myModelId(ctx);
    if (!modelId) return null;
    const a = ctx.state.applications.find((x) => x.campaignId === ctx.params.id && x.modelId === modelId);
    return a ? { id: a.id, status: a.status, createdAt: a.createdAt } : null;
  },

  'campaigns.get': ({ state, params }) => detailRow(state, getCampaign(state, params.id)),

  'campaigns.apply': (ctx) => {
    const modelId = myModelId(ctx);
    if (!modelId) fail(400, 'Complete your model profile first', 'NO_MODEL_PROFILE');
    const { state, params, body, now } = ctx;
    // The real route relies on the FK constraint; an unknown campaign fails as a 500.
    if (!state.campaigns.some((c) => c.id === params.id)) fail(500, 'Application failed');
    if (state.applications.some((a) => a.campaignId === params.id && a.modelId === modelId)) {
      fail(409, 'Already applied to this campaign');
    }
    const application = {
      id: newId('app'),
      campaignId: params.id,
      modelId,
      coverNote: typeof body?.coverNote === 'string' ? body.coverNote : null,
      status: 'PENDING' as const,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    state.applications.push(application);
    return application;
  },

  // ── Brand-only (reachable once the Brand persona ships) ──

  'campaigns.create': (ctx) => {
    const brandId = myBrandId(ctx);
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    if (!body.title) fail(400, 'Title is required');
    if (!body.description) fail(400, 'Description is required');
    const campaign: DemoCampaign = {
      id: newId('c'),
      brandId,
      title: '',
      description: '',
      tags: [],
      status: 'DRAFT',
      flagged: false,
      createdAt: iso(ctx.now),
      updatedAt: iso(ctx.now),
    };
    applyCampaignFields(campaign, body);
    ctx.state.campaigns.push(campaign);
    return campaign;
  },

  'campaigns.update': (ctx) => {
    const campaign = getCampaign(ctx.state, ctx.params.id);
    const userId = requireRole(ctx, 'BRAND');
    const brand = ctx.state.brandProfiles.find((b) => b.userId === userId);
    if (!brand || campaign.brandId !== brand.id) fail(403, 'Forbidden');
    applyCampaignFields(campaign, (ctx.body ?? {}) as Record<string, unknown>);
    campaign.updatedAt = iso(ctx.now);
    return detailRow(ctx.state, campaign);
  },

  'campaigns.listApplications': (ctx) => {
    const userId = requireRole(ctx, 'BRAND');
    const { state, params } = ctx;
    const brand = state.brandProfiles.find((b) => b.userId === userId);
    const campaign = state.campaigns.find((c) => c.id === params.id);
    if (!campaign || !brand || campaign.brandId !== brand.id) fail(403, 'Forbidden');
    return state.applications
      .filter((a) => a.campaignId === params.id)
      .sort((a, b) => t(b.createdAt) - t(a.createdAt))
      .map((a) => {
        const m = state.modelProfiles.find((p) => p.id === a.modelId);
        return {
          ...a,
          model: m && {
            id: m.id,
            userId: m.userId,
            displayName: m.displayName,
            profileImage: m.profileImage ?? null,
            coverImage: m.coverImage ?? null,
            portfolioImages: m.portfolioImages,
            location: m.location ?? null,
            tags: m.tags,
            heightCm: m.heightCm ?? null,
            bustCm: m.bustCm ?? null,
            waistCm: m.waistCm ?? null,
            hipsCm: m.hipsCm ?? null,
            bio: m.bio ?? null,
            user: { id: m.userId },
          },
        };
      });
  },

  'campaigns.updateApplicationStatus': (ctx) => {
    requireRole(ctx, 'BRAND');
    const status = ctx.body?.status as ApplicationStatus;
    if (!APP_STATUSES.includes(status)) fail(400, 'Invalid status');
    const a = ctx.state.applications.find((x) => x.id === ctx.params.applicationId);
    if (!a) fail(500, 'Failed to update status');
    a.status = status;
    a.updatedAt = iso(ctx.now);
    const c = getCampaign(ctx.state, a.campaignId);
    const b = brandOf(ctx.state, c);
    const m = ctx.state.modelProfiles.find((p) => p.id === a.modelId);
    return {
      ...a,
      campaign: { ...c, brand: { brandName: b?.brandName ?? '', userId: b?.userId ?? '' } },
      model: m && { ...m, user: { email: findUser(ctx.state, m.userId)?.email ?? '' } },
    };
  },
};
