'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Flag, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

interface ReportUser {
  id: string;
  email: string;
  role: string;
  modelProfile: { displayName: string; profileImage?: string | null } | null;
  brandProfile: { brandName: string; profileImage?: string | null } | null;
  photographerProfile: { displayName: string; profileImage?: string | null } | null;
}

interface Report {
  id: string;
  reason: string;
  details?: string | null;
  resolved: boolean;
  createdAt: string;
  reporter: ReportUser;
  reported: ReportUser;
}

type Tab = 'unresolved' | 'resolved';

function getUserName(user: ReportUser) {
  return user.modelProfile?.displayName ?? user.brandProfile?.brandName ?? user.photographerProfile?.displayName ?? user.email;
}

function getUserImage(user: ReportUser): string | null {
  return user.modelProfile?.profileImage ?? user.brandProfile?.profileImage ?? user.photographerProfile?.profileImage ?? null;
}

function UserChip({ user, label }: { user: ReportUser; label: string }) {
  const name = getUserName(user);
  const img = getUserImage(user);
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: img ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
        >
          {img ? (
            <Image src={img} alt={name} width={32} height={32} className="object-cover w-full h-full" />
          ) : initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onResolve }: { report: Report; onResolve?: (id: string) => void }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Users row */}
        <div className="grid grid-cols-2 gap-4">
          <UserChip user={report.reporter} label="Reported by" />
          <UserChip user={report.reported} label="Reported user" />
        </div>

        {/* Reason + details */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <Flag size={10} />
              {report.reason}
            </span>
            <Badge variant="outline" className="text-xs capitalize">
              {report.reported.role.toLowerCase()}
            </Badge>
          </div>
          {report.details && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              &ldquo;{report.details}&rdquo;
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
          {onResolve && (
            <button
              onClick={() => onResolve(report.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold border border-green-200 transition-colors"
            >
              <CheckCircle2 size={12} />
              Resolve
            </button>
          )}
          {report.resolved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 size={12} /> Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [resolvedReports, setResolvedReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<Tab>('unresolved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ reports: Report[] }>('/api/admin/reports?resolved=false'),
      apiFetch<{ reports: Report[] }>('/api/admin/reports?resolved=true'),
    ])
      .then(([unresolved, resolved]) => {
        setReports(unresolved.reports);
        setResolvedReports(resolved.reports);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function resolve(id: string) {
    try {
      await apiFetch(`/api/admin/reports/${id}/resolve`, { method: 'PUT' });
      const report = reports.find((r) => r.id === id);
      if (report) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setResolvedReports((prev) => [{ ...report, resolved: true }, ...prev]);
      }
    } catch {}
  }

  const displayList = tab === 'unresolved' ? reports : resolvedReports;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}
        >
          <AlertTriangle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports Queue</h1>
          <p className="text-sm text-muted-foreground">Review and resolve user reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {(['unresolved', 'resolved'] as Tab[]).map((t) => {
          const count = t === 'unresolved' ? reports.length : resolvedReports.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'unresolved' ? <Flag size={13} /> : <CheckCircle2 size={13} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  t === 'unresolved' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-4 border-red-300 border-t-red-600 animate-spin" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
          <User size={32} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">No {tab} reports</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayList.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={tab === 'unresolved' ? resolve : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
