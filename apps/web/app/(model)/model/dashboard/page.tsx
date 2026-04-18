'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera, ImageIcon, MessageSquare, Zap, User, ChevronRight,
  Heart, Briefcase, ShieldCheck, AlertCircle, CheckCircle2, Star, CreditCard, BookOpen, Calculator, Newspaper, Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ModelProfile {
  displayName: string;
  profileImage?: string | null;
  coverImage?: string | null;
  portfolioImages: string[];
  bio?: string | null;
  location?: string | null;
  heightCm?: number | null;
  bustCm?: number | null;
  rates?: { dayRate?: number } | null;
  tags: string[];
}

interface AuthMe {
  verified: boolean;
  approved: boolean;
}

interface Application {
  id: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    brand: { brandName: string; logoUrl?: string | null; profileImage?: string | null };
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

function completionPct(p: ModelProfile): number {
  const fields = [
    !!p.profileImage,
    !!p.bio,
    !!(p.heightCm || p.bustCm),
    !!(p.rates?.dayRate),
    p.tags.length > 0,
    p.portfolioImages.length > 0,
  ];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

export default function ModelDashboard() {
  const [profile, setProfile] = useState<ModelProfile | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<ModelProfile>('/api/models/me').catch(() => null),
      apiFetch<AuthMe>('/api/auth/me').catch(() => null),
      apiFetch<Application[]>('/api/campaigns/my-applications').catch(() => []),
      apiFetch<{ matches: Match[] }>('/api/swipe/matches').catch(() => ({ matches: [] })),
      apiFetch<{ count: number }>('/api/threads/unread-count').catch(() => ({ count: 0 })),
    ]).then(([prof, authMe, apps, matchData, unreadData]) => {
      setProfile(prof);
      setMe(authMe);
      setApplications(Array.isArray(apps) ? apps : []);
      setMatches(matchData?.matches ?? []);
      setUnread(unreadData?.count ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  const initials = profile?.displayName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const pct = profile ? completionPct(profile) : 0;

  return (
    <div className="max-w-5xl space-y-8">

      {/* Verification banner */}
      {me && !me.verified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Your account isn't verified yet</p>
            <p className="text-xs text-amber-600 mt-0.5">Verified models get a badge and higher visibility with brands.</p>
          </div>
          <Link href="/model/verify"
            className="flex-shrink-0 h-8 px-4 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            Get Verified
          </Link>
        </div>
      )}

      {/* Welcome header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
          {profile?.profileImage ? (
            <Image src={profile.profileImage} alt={profile.displayName} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              {initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Welcome back</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{profile?.displayName ?? 'Model'}</h1>
            {me?.verified && (
              <ShieldCheck size={18} className="text-pink-500" />
            )}
          </div>
          {profile?.location && <p className="text-sm text-muted-foreground mt-0.5">{profile.location}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<ImageIcon size={20} />} label="Portfolio images" value={profile?.portfolioImages.length ?? 0} color="linear-gradient(135deg,#ec4899,#be185d)" />
        <StatCard icon={<Briefcase size={20} />} label="Applications" value={applications.length} color="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard icon={<Heart size={20} />} label="Matches" value={matches.length} color="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
        <StatCard icon={<MessageSquare size={20} />} label="Unread messages" value={unread} color="linear-gradient(135deg,#06b6d4,#0e7490)" />
      </div>

      {/* Profile completion */}
      {pct < 80 && (
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Complete your profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">Brands are more likely to hire models with complete profiles.</p>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#ec4899' }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f472b6,#ec4899)' }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
            {[
              { label: 'Profile photo', done: !!profile?.profileImage },
              { label: 'Bio', done: !!profile?.bio },
              { label: 'Measurements', done: !!(profile?.heightCm || profile?.bustCm) },
              { label: 'Rates', done: !!profile?.rates?.dayRate },
              { label: 'Tags', done: (profile?.tags.length ?? 0) > 0 },
              { label: 'Portfolio', done: (profile?.portfolioImages.length ?? 0) > 0 },
            ].map(({ label, done }) => (
              <span key={label} className={`flex items-center gap-1 px-2 py-1 rounded-full ${done ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                <CheckCircle2 size={11} className={done ? 'text-green-500' : 'text-muted-foreground/40'} />
                {label}
              </span>
            ))}
          </div>
          <Link href="/model/profile"
            className="inline-flex h-9 px-4 rounded-xl text-sm font-medium text-white items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}>
            Complete Profile
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction href="/model/profile" icon={<User size={18} />} label="Edit Profile" sub="Update your bio, measurements, and rates" />
          <QuickAction href="/model/portfolio" icon={<Camera size={18} />} label="Manage Portfolio" sub="Upload and reorder your portfolio" />
          <QuickAction href="/model/comp-card" icon={<CreditCard size={18} />} label="Generate Comp Card" sub="Download a print-ready PDF for agencies" />
          <QuickAction href="/model/discover" icon={<Zap size={18} />} label="Discover Campaigns" sub="Find campaigns to apply to" />
          <QuickAction href="/model/inbox" icon={<MessageSquare size={18} />} label="Inbox" sub={unread > 0 ? `${unread} unread message${unread !== 1 ? 's' : ''}` : 'No unread messages'} />
          <QuickAction href="/tutorials" icon={<BookOpen size={18} />} label="Tutorials" sub="Posing, beauty, and industry guides" />
          <QuickAction href="/tools/rate-calculator" icon={<Calculator size={18} />} label="Rate Calculator" sub="Estimate your fair market rate" />
          <QuickAction href="/news" icon={<Newspaper size={18} />} label="Industry News" sub="Trends, casting calls, and opportunities" />
          <QuickAction href="/community" icon={<Users size={18} />} label="Community" sub="Connect with verified members" />
        </div>
      </div>

      {/* Recent applications */}
      {applications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Applications</h2>
            <Link href="/model/jobs" className="text-xs text-pink-500 hover:text-pink-600 transition-colors">View all</Link>
          </div>
          <div className="space-y-2">
            {applications.slice(0, 3).map((app) => {
              const cfg = APP_STATUS[app.status] ?? APP_STATUS.PENDING;
              const brandImg = app.campaign.brand.logoUrl ?? app.campaign.brand.profileImage ?? null;
              const brandIni = app.campaign.brand.brandName[0]?.toUpperCase() ?? 'B';
              return (
                <Link key={app.id} href={`/campaigns/${app.campaign.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    {brandImg ? (
                      <Image src={brandImg} alt={app.campaign.brand.brandName} width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>{brandIni}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.campaign.title}</p>
                    <p className="text-xs text-muted-foreground">{app.campaign.brand.brandName}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                </Link>
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
                  <Link href={`/model/inbox`}
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
      {applications.length === 0 && matches.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-3xl mx-auto">✨</div>
          <h3 className="font-semibold">Ready to get discovered?</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Complete your profile and start applying to campaigns to connect with brands.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/model/discover"
              className="h-9 px-4 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              Discover Campaigns
            </Link>
            <Link href="/model/profile"
              className="h-9 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
              Edit Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
