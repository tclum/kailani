'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Tag, Calendar, DollarSign, X, ChevronRight, Building2,
  Send, CheckCircle2, Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand } from '@kailani/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMON_TAGS = ['Editorial', 'Commercial', 'Runway', 'Beauty', 'Fitness', 'Lifestyle', 'Swimwear', 'Lookbook'];

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BrandLogo({ brand }: { brand: CampaignWithBrand['brand'] }) {
  const img = brand.profileImage ?? brand.logoUrl;
  if (img) return <Image src={img} alt={brand.brandName} width={28} height={28} className="rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
      {brand.brandName[0]}
    </div>
  );
}

// ─── Apply drawer ─────────────────────────────────────────────────────────────

function ApplyDrawer({
  campaign,
  onClose,
  onApplied,
}: {
  campaign: CampaignWithBrand;
  onClose: () => void;
  onApplied: (id: string) => void;
}) {
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/campaigns/${campaign.id}/apply`, {
        method: 'POST',
        body: { coverNote: coverNote || undefined },
      });
      setDone(true);
      onApplied(campaign.id);
    } catch (err: any) {
      setError(err?.error ?? 'Application failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo brand={campaign.brand} />
              <div>
                <h2 className="font-bold text-lg leading-tight">{campaign.title}</h2>
                <p className="text-sm text-muted-foreground">{campaign.brand.brandName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Campaign details */}
          <div className="rounded-2xl bg-muted/40 p-4 space-y-3 text-sm">
            <p className="text-foreground leading-relaxed">{campaign.description}</p>
            <div className="flex flex-wrap gap-3 text-muted-foreground pt-1">
              {campaign.location && <span className="flex items-center gap-1"><MapPin size={12} /> {campaign.location}</span>}
              {campaign.budget && <span className="flex items-center gap-1"><DollarSign size={12} /> {campaign.budget}</span>}
              {campaign.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> {fmt(campaign.startDate)}</span>}
              {campaign.endDate && <span>→ {fmt(campaign.endDate)}</span>}
            </div>
            {campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {campaign.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{t}</span>
                ))}
              </div>
            )}
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <p className="font-semibold text-green-700">Application sent!</p>
              <p className="text-sm text-muted-foreground text-center">The brand will review your profile and get back to you.</p>
              <button onClick={onClose} className="mt-1 text-sm text-pink-500 font-medium hover:underline">Browse more campaigns</button>
            </div>
          ) : (
            <>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover note <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Tell the brand why you're a great fit for this campaign…"
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={handleApply}
                disabled={submitting}
                className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 16px rgba(236,72,153,0.3)' }}
              >
                {submitting ? 'Sending…' : <><Send size={16} /> Submit Application</>}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Campaign card ─────────────────────────────────────────────────────────────

function CampaignDiscoveryCard({
  campaign,
  applied,
  onApply,
}: {
  campaign: CampaignWithBrand;
  applied: boolean;
  onApply: (c: CampaignWithBrand) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Brand bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/50">
        <BrandLogo brand={campaign.brand} />
        <span className="text-sm font-medium">{campaign.brand.brandName}</span>
        {campaign.brand.location && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
            <MapPin size={11} /> {campaign.brand.location}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-snug">{campaign.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold whitespace-nowrap flex-shrink-0">Open</span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{campaign.description}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {campaign.location && <span className="flex items-center gap-0.5"><MapPin size={11} /> {campaign.location}</span>}
          {campaign.budget && <span className="flex items-center gap-0.5"><DollarSign size={11} /> {campaign.budget}</span>}
          {campaign.startDate && <span className="flex items-center gap-0.5"><Calendar size={11} /> {fmt(campaign.startDate)}</span>}
        </div>

        {campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.tags.slice(0, 5).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          {campaign._count?.applications != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users size={11} /> {campaign._count.applications} applicant{campaign._count.applications !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => onApply(campaign)}
            disabled={applied}
            className={`ml-auto h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
              applied
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'text-white hover:opacity-90'
            }`}
            style={applied ? {} : { background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {applied ? <><CheckCircle2 size={14} /> Applied</> : <><ChevronRight size={14} /> Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModelCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<CampaignWithBrand | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: 'OPEN', limit: '50' });
    if (location) params.set('location', location);
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    apiFetch<any>(`/api/campaigns?${params}`)
      .then((r) => { setCampaigns(r.campaigns ?? []); setTotal(r.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  const filtered = campaigns.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.brand.brandName.toLowerCase().includes(q);
  });

  return (
    <>
      <AnimatePresence>
        {activeCampaign && (
          <ApplyDrawer
            campaign={activeCampaign}
            onClose={() => setActiveCampaign(null)}
            onApplied={(id) => {
              setAppliedIds((prev) => new Set([...prev, id]));
              setTimeout(() => setActiveCampaign(null), 1500);
            }}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaign Opportunities</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{total} open campaigns</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search + location row */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns, brands…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>
            <div className="relative sm:w-48">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>
          </div>

          {/* Tag pills */}
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`h-8 px-3 rounded-full text-xs font-medium transition-all border ${
                  selectedTags.includes(tag)
                    ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-border bg-background text-muted-foreground hover:border-pink-200'
                }`}
              >
                {selectedTags.includes(tag) && <X size={10} className="inline mr-0.5" />}
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button onClick={() => setSelectedTags([])} className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-center">
            <Building2 size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">No campaigns match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CampaignDiscoveryCard
                key={c.id}
                campaign={c}
                applied={appliedIds.has(c.id)}
                onApply={setActiveCampaign}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
