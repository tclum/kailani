'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Image as ImageIcon, Users, MessageSquare, Zap, User, ChevronRight, Heart, BookOpen, Calculator } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PhotographerProfile {
  displayName: string;
  profileImage?: string | null;
  portfolioImages: string[];
  location?: string | null;
}

interface Match {
  matchId: string;
  createdAt: string;
  otherUser: {
    id: string;
    role: string;
    modelProfile?: { displayName: string; profileImage?: string | null; location?: string | null } | null;
    brandProfile?: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null;
    photographerProfile?: { displayName: string; profileImage?: string | null } | null;
  };
}

interface Thread {
  id: string;
  unreadCount: number;
  lastMessage?: { body: string; createdAt: string; senderId: string } | null;
  participants: { userId: string; user: { id: string; modelProfile?: { displayName: string; profileImage?: string | null } | null; brandProfile?: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null; photographerProfile?: { displayName: string; profileImage?: string | null } | null } }[];
}

function getName(u: Match['otherUser']) {
  return u.modelProfile?.displayName ?? u.brandProfile?.brandName ?? u.photographerProfile?.displayName ?? 'Unknown';
}
function getImage(u: Match['otherUser']): string | null {
  return u.modelProfile?.profileImage ?? u.brandProfile?.profileImage ?? u.brandProfile?.logoUrl ?? u.photographerProfile?.profileImage ?? null;
}
function getProfileHref(u: Match['otherUser']) {
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
    <Link href={href} className="group rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
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

export default function PhotographerDashboard() {
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<PhotographerProfile>('/api/photographers/me').catch(() => null),
      apiFetch<{ matches: Match[] }>('/api/swipe/matches').catch(() => ({ matches: [] })),
      apiFetch<Thread[]>('/api/threads').catch(() => []),
      apiFetch<{ count: number }>('/api/threads/unread-count').catch(() => ({ count: 0 })),
    ]).then(([prof, matchData, threadData, unreadData]) => {
      setProfile(prof);
      setMatches(matchData?.matches ?? []);
      setThreads(Array.isArray(threadData) ? threadData : []);
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

  return (
    <div className="max-w-5xl space-y-8">

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
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.displayName ?? 'Photographer'}
          </h1>
          {profile?.location && <p className="text-sm text-muted-foreground mt-0.5">{profile.location}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<ImageIcon size={20} />}
          label="Portfolio images"
          value={profile?.portfolioImages.length ?? 0}
          color="linear-gradient(135deg,#ec4899,#be185d)"
        />
        <StatCard
          icon={<Heart size={20} />}
          label="Total matches"
          value={matches.length}
          color="linear-gradient(135deg,#8b5cf6,#6d28d9)"
        />
        <StatCard
          icon={<MessageSquare size={20} />}
          label="Unread messages"
          value={unread}
          color="linear-gradient(135deg,#06b6d4,#0e7490)"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction href="/photographer/profile" icon={<User size={18} />} label="Edit Profile" sub="Update your bio, rates, and specialties" />
          <QuickAction href="/photographer/portfolio" icon={<Camera size={18} />} label="Manage Portfolio" sub="Upload, reorder, and curate your work" />
          <QuickAction href="/photographer/discover" icon={<Zap size={18} />} label="Discover" sub="Find models and brands to collaborate with" />
          <QuickAction href="/photographer/inbox" icon={<MessageSquare size={18} />} label="Inbox" sub={unread > 0 ? `${unread} unread message${unread !== 1 ? 's' : ''}` : 'No unread messages'} />
          <QuickAction href="/tutorials" icon={<BookOpen size={18} />} label="Tutorials" sub="Lighting, directing, and business guides" />
          <QuickAction href="/tools/rate-calculator" icon={<Calculator size={18} />} label="Rate Calculator" sub="Estimate your fair market rate" />
        </div>
      </div>

      {/* Recent matches */}
      {matches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Matches</h2>
            <span className="text-xs text-muted-foreground">{matches.length} total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {matches.slice(0, 8).map((m) => {
              const name = getName(m.otherUser);
              const img = getImage(m.otherUser);
              const href = getProfileHref(m.otherUser);
              const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <Link key={m.matchId} href={href} className="group rounded-2xl border bg-card p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {img ? (
                      <Image src={img} alt={name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
                        {ini}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs font-semibold truncate group-hover:text-pink-500 transition-colors">{name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{m.otherUser.role.toLowerCase()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent messages */}
      {threads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Messages</h2>
            <Link href="/photographer/inbox" className="text-xs text-pink-500 hover:text-pink-600 transition-colors">View all</Link>
          </div>
          <div className="space-y-2">
            {threads.slice(0, 5).map((t) => {
              const other = t.participants?.find((p: any) => p.user);
              const otherUser = other?.user;
              const name = otherUser?.modelProfile?.displayName ?? otherUser?.brandProfile?.brandName ?? otherUser?.photographerProfile?.displayName ?? 'Unknown';
              const img = otherUser?.modelProfile?.profileImage ?? otherUser?.brandProfile?.profileImage ?? otherUser?.brandProfile?.logoUrl ?? otherUser?.photographerProfile?.profileImage ?? null;
              const ini = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <Link key={t.id} href={`/photographer/inbox?thread=${t.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    {img ? (
                      <Image src={img} alt={name} width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
                        {ini}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {t.unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    {t.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">{t.lastMessage.body}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && threads.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-3xl mx-auto">📷</div>
          <h3 className="font-semibold">You're all set up</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start by completing your profile and portfolio, then discover models and brands to collaborate with.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/photographer/profile"
              className="h-9 px-4 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              Complete Profile
            </Link>
            <Link href="/photographer/discover"
              className="h-9 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
              Discover
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
