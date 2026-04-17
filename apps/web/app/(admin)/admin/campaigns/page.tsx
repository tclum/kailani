'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, Search, Flag, X, ChevronLeft, ChevronRight, Users, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

interface CampaignBrand {
  id: string;
  brandName: string;
  profileImage?: string | null;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  budget?: string | null;
  location?: string | null;
  status: string;
  flagged: boolean;
  tags: string[];
  createdAt: string;
  brand: CampaignBrand;
  _count: { applications: number };
}

interface PaginatedCampaigns {
  campaigns: Campaign[];
  total: number;
  page: number;
  pages: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const STATUSES = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'];

export default function AdminCampaignsPage() {
  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'ALL') params.set('status', status);
    if (flaggedOnly) params.set('flagged', 'true');
    params.set('page', String(page));
    try {
      const result = await apiFetch<PaginatedCampaigns>(`/api/admin/campaigns?${params}`);
      setData(result);
    } catch {}
    setLoading(false);
  }, [search, status, flaggedOnly, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleFlag(id: string, flagged: boolean) {
    await apiFetch(`/api/admin/campaigns/${id}/flag`, { method: 'PUT', body: { flagged: !flagged } });
    setData((prev) => prev ? {
      ...prev,
      campaigns: prev.campaigns.map((c) => c.id === id ? { ...c, flagged: !flagged } : c),
    } : prev);
  }

  async function closeCampaign(id: string) {
    if (!confirm('Force close this campaign?')) return;
    await apiFetch(`/api/admin/campaigns/${id}/close`, { method: 'PUT' });
    setData((prev) => prev ? {
      ...prev,
      campaigns: prev.campaigns.map((c) => c.id === id ? { ...c, status: 'CLOSED' } : c),
    } : prev);
  }

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
          >
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaign Oversight</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? '—'} total campaigns</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 h-9 rounded-xl border border-border bg-background text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
        </select>

        <button
          onClick={() => { setFlaggedOnly((f) => !f); setPage(1); }}
          className={`h-9 flex items-center gap-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
            flaggedOnly
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'border-border hover:bg-muted'
          }`}
        >
          <Flag size={13} /> Flagged only
        </button>
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
          <Briefcase size={36} className="text-muted-foreground/30" />
          <p className="text-muted-foreground">No campaigns found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const img = c.brand.profileImage;
            const initials = c.brand.brandName.slice(0, 2).toUpperCase();
            return (
              <div
                key={c.id}
                className={`rounded-2xl border bg-card p-5 ${c.flagged ? 'border-red-200 bg-red-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Brand avatar */}
                  <div
                    className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: img ? undefined : 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}
                  >
                    {img ? (
                      <Image src={img} alt={c.brand.brandName} width={44} height={44} className="object-cover w-full h-full" />
                    ) : initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base truncate">{c.title}</h3>
                          {c.flagged && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">
                              <Flag size={9} /> Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.brand.brandName} · {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {c.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={11} /> {c.location}
                        </span>
                      )}
                      {c.budget && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign size={11} /> {c.budget}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} /> {c._count.applications} applicants
                      </span>
                    </div>

                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">{t}</Badge>
                        ))}
                        {c.tags.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{c.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleFlag(c.id, c.flagged)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        c.flagged
                          ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {c.flagged ? <><X size={10} /> Unflag</> : <><Flag size={10} /> Flag</>}
                    </button>
                    {c.status !== 'CLOSED' && (
                      <button
                        onClick={() => closeCampaign(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                    )}
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors text-center"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
  );
}
