'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, DollarSign, MapPin, Users, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/shared/Skeleton';
import type { CampaignWithBrand, CampaignStatus } from '@kailani/types';

const STATUS_GROUPS: { status: CampaignStatus; label: string; color: string }[] = [
  { status: 'OPEN',      label: 'Open',      color: 'text-green-700 bg-green-100' },
  { status: 'DRAFT',     label: 'Draft',     color: 'text-amber-700 bg-amber-100' },
  { status: 'CLOSED',    label: 'Closed',    color: 'text-muted-foreground bg-muted' },
  { status: 'COMPLETED', label: 'Completed', color: 'text-blue-700 bg-blue-100' },
];

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CampaignRow({ c }: { c: CampaignWithBrand }) {
  const applicants = c._count?.applications ?? 0;
  const editable = c.status === 'DRAFT' || c.status === 'OPEN';
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-card hover:shadow-md transition-shadow group">
      <Link href={`/brand/campaigns/${c.id}`} className="flex-1 min-w-0 flex items-center gap-4 p-4 cursor-pointer">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-pink-500 transition-colors line-clamp-1 mb-1">{c.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
            {c.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {c.location}</span>}
            {c.budget && <span className="flex items-center gap-0.5"><DollarSign size={10} /> {c.budget}</span>}
            {c.startDate && <span className="flex items-center gap-0.5"><Calendar size={10} /> {fmt(c.startDate)}{c.endDate ? ` → ${fmt(c.endDate)}` : ''}</span>}
          </div>
          {c.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {c.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold">{applicants}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
              <Users size={10} /> applicant{applicants !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-pink-500 transition-colors" />
        </div>
      </Link>
      {editable && (
        <Link
          href={`/brand/campaigns/${c.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="mr-3 flex-shrink-0 h-8 px-3 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors flex items-center"
        >
          Edit
        </Link>
      )}
    </div>
  );
}

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>('/api/brands/me/campaigns')
      .then((r) => setCampaigns(r.campaigns ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{campaigns.length} total</p>
        </div>
        <Link
          href="/brand/campaigns/new"
          className="h-10 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
        >
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Create your first campaign to start receiving applications from models.</p>
          </div>
          <Link
            href="/brand/campaigns/new"
            className="h-9 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        STATUS_GROUPS.map(({ status, label, color }) => {
          const group = campaigns.filter((c) => c.status === status);
          if (group.length === 0) return null;
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                <span className="text-xs text-muted-foreground">{group.length} campaign{group.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {group.map((c) => <CampaignRow key={c.id} c={c} />)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
