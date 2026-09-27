import type { DemoVerification } from '../types';
import { newId } from '../store';
import { fail, iso, requireAuth, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/blocks.ts, reports.ts, and verification.ts

const REPORT_REASONS = ['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other'];

const verificationView = (v: DemoVerification) => ({
  id: v.id,
  status: v.status,
  idImageUrl: v.idImageUrl,
  selfieUrl: v.selfieUrl,
  adminNote: v.adminNote,
  submittedAt: v.submittedAt,
  reviewedAt: v.reviewedAt,
});

export const safetyHandlers: HandlerMap = {
  'safety.listBlocks': (ctx) => {
    const userId = requireAuth(ctx);
    return { blockedIds: ctx.state.blocks.filter((b) => b.blockerId === userId).map((b) => b.blockedId) };
  },

  'safety.block': (ctx) => {
    const userId = requireAuth(ctx);
    const blockedId = ctx.body?.blockedId;
    if (typeof blockedId !== 'string' || !blockedId) fail(400, 'blockedId required');
    if (blockedId === userId) fail(400, 'Cannot block yourself');
    if (ctx.state.blocks.some((b) => b.blockerId === userId && b.blockedId === blockedId)) fail(409, 'Already blocked');
    const block = { id: newId('bl'), blockerId: userId, blockedId, createdAt: iso(ctx.now) };
    ctx.state.blocks.push(block);
    return block;
  },

  'safety.unblock': (ctx) => {
    const userId = requireAuth(ctx);
    ctx.state.blocks = ctx.state.blocks.filter((b) => !(b.blockerId === userId && b.blockedId === ctx.params.blockedId));
    return undefined;
  },

  'safety.report': (ctx) => {
    const userId = requireAuth(ctx);
    const { reportedId, reason, details } = ctx.body ?? {};
    if (typeof reportedId !== 'string' || !reportedId || !REPORT_REASONS.includes(reason)) fail(400, 'Invalid report data');
    if (reportedId === userId) fail(400, 'Cannot report yourself');
    const report = { id: newId('rp'), reporterId: userId, reportedId, reason, details: details ?? null, resolved: false, createdAt: iso(ctx.now) };
    ctx.state.reports.push(report);
    return report;
  },

  'safety.verificationMe': (ctx) => {
    const userId = requireAuth(ctx);
    const v = ctx.state.verifications.find((x) => x.userId === userId);
    return v ? verificationView(v) : null;
  },

  'safety.verificationSubmit': (ctx) => {
    const userId = requireAuth(ctx);
    const file = ctx.body instanceof FormData ? ctx.body.get('idImage') : null;
    if (!(file instanceof Blob)) fail(400, 'ID image is required');
    const idImageUrl = URL.createObjectURL(file);
    const now = iso(ctx.now);
    let v = ctx.state.verifications.find((x) => x.userId === userId);
    if (v) {
      Object.assign(v, { idImageUrl, selfieUrl: null, status: 'PENDING', adminNote: null, submittedAt: now, reviewedAt: null });
    } else {
      v = { id: newId('vr'), userId, idImageUrl, selfieUrl: null, status: 'PENDING', adminNote: null, submittedAt: now, reviewedAt: null };
      ctx.state.verifications.push(v);
    }
    // The real route returns the full row (upsert result).
    return { ...v, reviewedBy: null };
  },
};
