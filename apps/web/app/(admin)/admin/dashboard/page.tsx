'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Briefcase, ShieldCheck, AlertTriangle, MessageSquare,
  Heart, TrendingUp, Clock, UserCheck, Activity, Star,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { PageTransition } from '@/components/shared/PageTransition';

interface Stats {
  totalUsers: number;
  models: number;
  brands: number;
  photographers: number;
  campaigns: number;
  applications: number;
  matches: number;
  messages: number;
  pendingApprovals: number;
  openCampaigns: number;
  pendingVerifications: number;
  openReports: number;
  signupsPerDay: { date: string; count: number }[];
}

interface ActivityItem {
  type: string;
  label: string;
  sub: string;
  time: string;
  id: string;
}

const TYPE_COLORS: Record<string, string> = {
  signup: 'bg-blue-100 text-blue-700',
  campaign: 'bg-purple-100 text-purple-700',
  verification: 'bg-amber-100 text-amber-700',
  report: 'bg-red-100 text-red-700',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border bg-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value === null || value === undefined ? '—' : value}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Stats>('/api/admin/stats'),
      apiFetch<{ activity: ActivityItem[] }>('/api/admin/activity'),
    ])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a.activity);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Format chart labels — show every 5th day
  const chartData = stats?.signupsPerDay?.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })) ?? [];

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 18px rgba(236,72,153,0.35)' }}
        >
          <Activity size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and operations</p>
        </div>
      </div>

      {/* Alert banners */}
      {stats && (stats.pendingVerifications > 0 || stats.openReports > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingVerifications > 0 && (
            <Link href="/admin/approvals" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors">
              <Clock size={15} />
              {stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? 's' : ''} awaiting review
            </Link>
          )}
          {stats.openReports > 0 && (
            <Link href="/admin/reports" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium hover:bg-red-100 transition-colors">
              <AlertTriangle size={15} />
              {stats.openReports} unresolved report{stats.openReports > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}

      {/* Primary stats */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={stats?.totalUsers ?? '—'} icon={Users} color="bg-blue-100 text-blue-700" href="/admin/users" />
          <StatCard label="Campaigns" value={stats?.campaigns ?? '—'} icon={Briefcase} color="bg-purple-100 text-purple-700" href="/admin/campaigns" />
          <StatCard label="Matches" value={stats?.matches ?? '—'} icon={Heart} color="bg-pink-100 text-pink-700" />
          <StatCard label="Messages" value={stats?.messages ?? '—'} icon={MessageSquare} color="bg-indigo-100 text-indigo-700" />
        </div>
      </div>

      {/* Role breakdown */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Role</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Models" value={stats?.models ?? '—'} icon={UserCheck} color="bg-pink-100 text-pink-700" />
          <StatCard label="Brands" value={stats?.brands ?? '—'} icon={Briefcase} color="bg-violet-100 text-violet-700" />
          <StatCard label="Photographers" value={stats?.photographers ?? '—'} icon={TrendingUp} color="bg-teal-100 text-teal-700" />
        </div>
      </div>

      {/* Ops stats */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Operations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? '—'} icon={Clock} color="bg-amber-100 text-amber-700" href="/admin/users?approved=false" />
          <StatCard label="Open Campaigns" value={stats?.openCampaigns ?? '—'} icon={Briefcase} color="bg-green-100 text-green-700" href="/admin/campaigns?status=OPEN" />
          <StatCard label="Pending Verifications" value={stats?.pendingVerifications ?? '—'} icon={ShieldCheck} color="bg-amber-100 text-amber-700" href="/admin/approvals" />
          <StatCard label="Open Reports" value={stats?.openReports ?? '—'} icon={AlertTriangle} color="bg-red-100 text-red-700" href="/admin/reports" />
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-pink-500" />
            <h2 className="font-semibold text-sm">User Signups — Last 30 Days</h2>
          </div>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval={4}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ec4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-pink-500" />
            <h2 className="font-semibold text-sm">Recent Activity</h2>
          </div>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${TYPE_COLORS[a.type] ?? 'bg-gray-100 text-gray-700'}`}>
                    {a.type.slice(0, 4)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.sub}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{timeAgo(a.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users" className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Users size={15} /> Manage Users
          </Link>
          <Link href="/admin/approvals" className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <ShieldCheck size={15} /> Verification Queue
          </Link>
          <Link href="/admin/reports" className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <AlertTriangle size={15} /> Reports Queue
          </Link>
          <Link href="/admin/campaigns" className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Briefcase size={15} /> Campaign Oversight
          </Link>
          <Link href="/admin/spotlights" className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Star size={15} /> Weekly Spotlights
          </Link>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
