'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronLeft, ChevronRight, Users, Download, ShieldCheck, ShieldOff, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  verified: boolean;
  createdAt: string;
  modelProfile: { id: string; displayName: string; profileImage?: string | null } | null;
  brandProfile: { id: string; brandName: string; profileImage?: string | null } | null;
  photographerProfile: { id: string; displayName: string; profileImage?: string | null } | null;
}

interface PaginatedUsers {
  users: UserRow[];
  total: number;
  page: number;
  pages: number;
}

function profileLink(u: UserRow): string | null {
  if (u.modelProfile) return `/model/${u.modelProfile.id}`;
  if (u.brandProfile) return `/brand/${u.brandProfile.id}`;
  if (u.photographerProfile) return `/photographer/${u.photographerProfile.id}`;
  return null;
}

function displayName(u: UserRow): string {
  return u.modelProfile?.displayName ?? u.brandProfile?.brandName ?? u.photographerProfile?.displayName ?? u.email;
}

function profileImage(u: UserRow): string | null {
  return u.modelProfile?.profileImage ?? u.brandProfile?.profileImage ?? u.photographerProfile?.profileImage ?? null;
}

// ─── Warn modal ────────────────────────────────────────────────────────────────
function WarnModal({ user, onConfirm, onCancel }: {
  user: UserRow;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Send Warning</h2>
            <p className="text-sm text-muted-foreground">This will be emailed to {displayName(user)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Your profile contains content that violates our community guidelines..."
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Send Warning
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLES = ['ALL', 'MODEL', 'BRAND', 'PHOTOGRAPHER', 'ADMIN'];

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [role, setRole] = useState(searchParams.get('role') ?? 'ALL');
  const [approved, setApproved] = useState(searchParams.get('approved') ?? 'ALL');
  const [verified, setVerified] = useState(searchParams.get('verified') ?? 'ALL');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));
  const [warnUser, setWarnUser] = useState<UserRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role !== 'ALL') params.set('role', role);
    if (approved !== 'ALL') params.set('approved', approved);
    if (verified !== 'ALL') params.set('verified', verified);
    params.set('page', String(page));
    try {
      const result = await apiFetch<PaginatedUsers>(`/api/admin/users?${params}`);
      setData(result);
    } catch {}
    setLoading(false);
  }, [search, role, approved, verified, page]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    await apiFetch(`/api/admin/users/${id}/approve`, { method: 'PUT' });
    setData((prev) => prev ? { ...prev, users: prev.users.map((u) => u.id === id ? { ...u, approved: true } : u) } : prev);
  }

  async function unapprove(id: string) {
    await apiFetch(`/api/admin/users/${id}/unapprove`, { method: 'PUT' });
    setData((prev) => prev ? { ...prev, users: prev.users.map((u) => u.id === id ? { ...u, approved: false } : u) } : prev);
  }

  async function remove(id: string) {
    if (!confirm('Permanently delete this user and all their data?')) return;
    await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setData((prev) => prev ? { ...prev, users: prev.users.filter((u) => u.id !== id), total: prev.total - 1 } : prev);
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} user(s)?`)) return;
    await Promise.all([...selected].map((id) => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' })));
    setData((prev) => prev ? { ...prev, users: prev.users.filter((u) => !selected.has(u.id)), total: prev.total - selected.size } : prev);
    setSelected(new Set());
  }

  async function sendWarn(reason: string) {
    if (!warnUser) return;
    await apiFetch(`/api/admin/users/${warnUser.id}/warn`, { method: 'POST', body: { reason } });
    setWarnUser(null);
  }

  function exportCSV() {
    if (!data) return;
    const header = 'id,email,role,approved,verified,createdAt,name\n';
    const rows = data.users.map((u) =>
      [u.id, u.email, u.role, u.approved, u.verified, u.createdAt, displayName(u)].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kailani-users.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const users = data?.users ?? [];

  return (
    <>
      {warnUser && <WarnModal user={warnUser} onConfirm={sendWarn} onCancel={() => setWarnUser(null)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-sm text-muted-foreground">{data?.total ?? '—'} total</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button
                onClick={bulkDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold border border-red-200 transition-colors"
              >
                <Trash2 size={13} /> Delete {selected.size} selected
              </button>
            )}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 h-9 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
            />
          </div>

          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r}</option>)}
          </select>

          <select
            value={approved}
            onChange={(e) => { setApproved(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>

          <select
            value={verified}
            onChange={(e) => { setVerified(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            <option value="ALL">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && users.every((u) => selected.has(u.id))}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(users.map((u) => u.id)));
                        else setSelected(new Set());
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left font-semibold text-muted-foreground">User</th>
                  <th className="p-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Role</th>
                  <th className="p-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="p-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="p-3 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">No users found</td>
                  </tr>
                ) : users.map((u) => {
                  const img = profileImage(u);
                  const name = displayName(u);
                  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                  const link = profileLink(u);
                  return (
                    <tr key={u.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${selected.has(u.id) ? 'bg-pink-50/40' : ''}`}>
                      <td className="p-3">
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: img ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
                          >
                            {img ? (
                              <Image src={img} alt={name} width={36} height={36} className="object-cover w-full h-full" />
                            ) : initials}
                          </div>
                          <div className="min-w-0">
                            {link ? (
                              <Link href={link} className="font-medium hover:text-pink-600 transition-colors truncate block">{name}</Link>
                            ) : (
                              <p className="font-medium truncate">{name}</p>
                            )}
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs capitalize">{u.role.toLowerCase()}</Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {u.approved ? (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Approved</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
                          )}
                          {u.verified && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              <ShieldCheck size={9} /> Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!u.approved ? (
                            <button
                              onClick={() => approve(u.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold border border-green-200 transition-colors"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => unapprove(u.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 transition-colors flex items-center gap-1"
                            >
                              <ShieldOff size={10} /> Unapprove
                            </button>
                          )}
                          <button
                            onClick={() => setWarnUser(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition-colors"
                          >
                            Warn
                          </button>
                          <button
                            onClick={() => remove(u.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium px-2">{page} / {data.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" /></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
