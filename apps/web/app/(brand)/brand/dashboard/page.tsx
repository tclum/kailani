'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Users, MessageSquare, Zap, Briefcase, ChevronRight,
  Heart, ShieldCheck, BookMarked, CheckCircle2, XCircle, Star,
  FileText, BookOpen, Newspaper,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PageTransition } from '@/components/shared/PageTransition';

interface BrandProfile {
  brandName: string;
  profileImage?: string | null;
  logoUrl?: string | null;
  location?: string | null;
}

interface AuthMe {
  verified: boolean;
}

interface Campaign {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
  _count?: { applications: number };
}

interface Applicant {
  id: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  campaignId: string;
  campaignTitle?: string;
  model: {
    id: string;
    userId: string;
    displayName: string;
    profileImage?: string | null;
    coverImage?: string | null;
    location?: string | null;
    tags: string[];
  };
}

interface Match {
  matchId: string;
  createdAt: string;
  otherUser: {
    id: string;
    role: string;
    modelProfile?: { displayName: string; profileImage?: string | null } | null;
    brandProfile?: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null;
    photographerProfile?: { displayName: string; profileImage?: string | null } | null;
  };
}

const APP_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED:    { label: 'Accepted',    color: 'bg-green-100 text-green-700' },
  REJECTED:    { label: 'Rejected',    color: 'bg-red-100 text-red-600' },
};

function getMatchName(u: Match['otherUser']) {
  return u.modelProfile?.displayName ?? u.brandProfile?.brandName ?? u.photographerProfile?.displayName ?? 'Unknown';
}
function getMatchImage(u: Match['otherUser']): string | null {
  return u.modelProfile?.profileImage ?? u.brandProfile?.profileImage ?? u.brandProfile?.logoUrl ?? u.photographerProfile?.profileImage ?? null;
}
function getMatchHref(u: Match['otherUser']) {
  if (u.modelProfile) return `/model/${u.id}`;
  if (u.brandProfile) return `/brand/${u.id}`;
  return `/photographer/${u.id}`;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, sub }: { href: string; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <Link href={href} className="group rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,rgba(236,72,153,0.1),rgba(190,24,93,0.06))', border: '1px solid rgba(236,72,153,0.15)' }}>
        <span className="text-pink-500">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold group-hover:text-pink-500 transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      <ChevronRight size={15} className="text-muted-foreground group-hover:text-pink-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function BrandDashboard() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [unread, setUnread] = useState(0);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<BrandProfile>('/api/brands/me').catch(() => null),
      apiFetch<AuthMe>('/api/auth/me').catch(() => null),
      apiFetch<{ campaigns: Campaign[] }>('/api/brands/me/campaigns').catch(() => ({ campaigns: [] })),
      apiFetch<{ matches: Match[] }>('/api/swipe/matches').catch(() => ({ matches: [] })),
      apiFetch<{ count: number }>('/api/threads/unread-count').catch(() => ({ count: 0 })),
    ]).then(async ([prof, authMe, campData, matchData, unreadData]) => {
      setProfile(prof);
      setMe(authMe);
      setMatches(matchData?.matches ?? []);
      setUnread(unreadData?.count ?? 0);

      const allCampaigns = campData?.campaigns ?? [];
      setCampaigns(allCampaigns);

      // Fetch applications for up to 3 open campaigns to build recent-applicants list
      const openCampaigns = allCampaigns
        .filter((c) => c.status === 'OPEN')
        .sort((a, b) => (b._count?.applications ?? 0) - (a._count?.applications ?? 0))
        .slice(0, 3);

      if (openCampaigns.length > 0) {
        const appResults = await Promise.all(
          openCampaigns.map((c) =>
            apiFetch<any[]>(`/api/campaigns/${c.id}/applications`)
              .then((apps) => (Array.isArray(apps) ? apps.map((a) => ({ ...a, campaignId: c.id, campaignTitle: c.title })) : []))
              .catch(() => [] as Applicant[])
          )
        );
        const merged = appResults.flat().sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setApplicants(merged.slice(0, 5));
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleStatus(appId: string, status: string) {
    if (updatingApp) return;
    setUpdatingApp(appId);
    try {
      await apiFetch(`/api/campaigns/applications/${appId}/status`, { method: 'PUT', body: { status } });
      setApplicants((prev) => prev.map((a) => a.id === appId ? { ...a, status: status as any } : a));
    } finally {
      setUpdatingApp(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  const openCampaigns = campaigns.filter((c) => c.status === 'OPEN');
  const draftCampaigns = campaigns.filter((c) => c.status === 'DRAFT');
  const totalApplications = campaigns.reduce((sum, c) => sum + (c._count?.applications ?? 0), 0);
  const modelsHired = applicants.filter((a) => a.status === 'ACCEPTED').length;

  const brandInitial = profile?.brandName?.[0]?.toUpperCase() ?? 'B';
  const brandLogo = profile?.logoUrl ?? profile?.profileImage ?? null;

  return (
    <PageTransition>
    <div className="max-w-5xl space-y-8">

      {/* Welcome header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
          {brandLogo ? (
            <Image src={brandLogo} alt={profile?.brandName ?? 'Brand'} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              {brandInitial}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Welcome back</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{profile?.brandName ?? 'Brand'}</h1>
            {me?.verified && <ShieldCheck size={18} className="text-pink-500" />}
          </div>
          {profile?.location && <p className="text-sm text-muted-foreground mt-0.5">{profile.location}</p>}
        </div>
      </div>

      {/* Draft reminder */}
      {draftCampaigns.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <FileText size={18} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              You have {draftCampaigns.length} draft campaign{draftCampaigns.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Publish them to start receiving applications from models.</p>
          </div>
          <Link href="/brand/campaigns"
            className="flex-shrink-0 h-8 px-4 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            Review Drafts
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Briefcase size={20} />} label="Active campaigns" value={openCampaigns.length} color="linear-gradient(135deg,#ec4899,#be185d)" />
        <StatCard icon={<Users size={20} />} label="Total applications" value={totalApplications} color="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard icon={<Heart size={20} />} label="Matches" value={matches.length} color="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
        <StatCard icon={<MessageSquare size={20} />} label="Unread messages" value={unread} color="linear-gradient(135deg,#06b6d4,#0e7490)" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction href="/brand/campaigns/new" icon={<Plus size={18} />} label="Create Campaign" sub="Post a new casting call" />
          <QuickAction href="/brand/discover" icon={<Zap size={18} />} label="Discover Models" sub="Browse and swipe on talent" />
          <QuickAction href="/brand/campaigns" icon={<Briefcase size={18} />} label="My Campaigns" sub={`${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`} />
          <QuickAction href="/brand/inbox" icon={<MessageSquare size={18} />} label="Inbox" sub={unread > 0 ? `${unread} unread message${unread !== 1 ? 's' : ''}` : 'No unread messages'} />
          <QuickAction href="/brand/saved" icon={<BookMarked size={18} />} label="Saved Models" sub="View your saved boards" />
          <QuickAction href="/tutorials" icon={<BookOpen size={18} />} label="Tutorials" sub="Campaign planning and industry guides" />
          <QuickAction href="/news" icon={<Newspaper size={18} />} label="Industry News" sub="Trends, casting calls, and opportunities" />
          <QuickAction href="/community" icon={<Users size={18} />} label="Community" sub="Connect with verified members" />
        </div>
      </div>

      {/* Active campaigns */}
      {openCampaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Active Campaigns</h2>
            <Link href="/brand/campaigns" className="text-xs text-pink-500 hover:text-pink-600 transition-colors">View all</Link>
          </div>
          <div className="space-y-2">
            {openCampaigns.slice(0, 4).map((c) => {
              const count = c._count?.applications ?? 0;
              return (
                <div key={c.id} className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Users size={11} /> {count} applicant{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href={`/brand/campaigns/${c.id}`}
                    className="flex-shrink-0 h-8 px-3 rounded-xl text-xs font-medium border border-border hover:bg-muted transition-colors flex items-center gap-1">
                    <Users size={12} /> View Applicants
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent applicants */}
      {applicants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Applicants</h2>
          </div>
          <div className="space-y-2">
            {applicants.map((app) => {
              const img = app.model.profileImage ?? app.model.coverImage ?? null;
              const ini = app.model.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              const cfg = APP_STATUS[app.status] ?? APP_STATUS.PENDING;
              const busy = updatingApp === app.id;
              return (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <Link href={`/model/${app.model.userId}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {img ? (
                        <Image src={img} alt={app.model.displayName} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>{ini}</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/model/${app.model.userId}`}
                      className="text-sm font-semibold hover:text-pink-500 transition-colors truncate block">
                      {app.model.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.campaignTitle ?? 'Campaign'}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  {app.status === 'PENDING' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStatus(app.id, 'SHORTLISTED')}
                        disabled={busy}
                        className="h-7 w-7 rounded-lg flex items-center justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                        title="Shortlist"
                      >
                        <Star size={13} />
                      </button>
                      <button
                        onClick={() => handleStatus(app.id, 'ACCEPTED')}
                        disabled={busy}
                        className="h-7 w-7 rounded-lg flex items-center justify-center bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                        title="Accept"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                      <button
                        onClick={() => handleStatus(app.id, 'REJECTED')}
                        disabled={busy}
                        className="h-7 w-7 rounded-lg flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent matches */}
      {matches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Matches</h2>
            <span className="text-xs text-muted-foreground">{matches.length} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {matches.slice(0, 3).map((m) => {
              const name = getMatchName(m.otherUser);
              const img = getMatchImage(m.otherUser);
              const href = getMatchHref(m.otherUser);
              const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={m.matchId} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
                  <Link href={href} className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden">
                      {img ? (
                        <Image src={img} alt={name} width={44} height={44} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>{ini}</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={href} className="text-sm font-semibold hover:text-pink-500 transition-colors truncate block">{name}</Link>
                    <p className="text-xs text-muted-foreground capitalize">{m.otherUser.role.toLowerCase()}</p>
                  </div>
                  <Link href="/brand/inbox"
                    className="flex-shrink-0 h-8 px-3 rounded-xl text-xs font-medium border border-border hover:bg-muted transition-colors flex items-center gap-1">
                    <MessageSquare size={12} /> Message
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && matches.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-3xl mx-auto">📣</div>
          <h3 className="font-semibold">Ready to find your talent?</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Create your first campaign to start receiving applications from models.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/brand/campaigns/new"
              className="h-9 px-4 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              Create Campaign
            </Link>
            <Link href="/brand/discover"
              className="h-9 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
              Discover Models
            </Link>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
