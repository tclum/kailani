'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, DollarSign, Calendar, Building2, Globe, Instagram, ArrowLeft,
  Send, CheckCircle2, X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/shared/Navbar';
import type { CampaignWithBrand } from '@kailani/types';

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function ApplyModal({ campaign, onClose, onApplied }: {
  campaign: CampaignWithBrand;
  onClose: () => void;
  onApplied: () => void;
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
      onApplied();
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
        className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Apply to {campaign.title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-green-700">Application sent!</p>
            <button onClick={onClose} className="text-sm text-pink-500 font-medium hover:underline">Close</button>
          </div>
        ) : (
          <>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover note <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Why are you a great fit for this campaign?"
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
      </motion.div>
    </motion.div>
  );
}

export default function PublicCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<CampaignWithBrand>(`/api/campaigns/${id}`)
      .then(setCampaign)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 flex items-center justify-center">
        <p className="text-muted-foreground">Campaign not found.</p>
      </main>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </main>
    </div>
  );

  const brandImg = campaign.brand.profileImage ?? campaign.brand.logoUrl;
  const isModel = me?.role === 'MODEL';

  return (
    <>
      <AnimatePresence>
        {applying && (
          <ApplyModal
            campaign={campaign}
            onClose={() => setApplying(false)}
            onApplied={() => { setApplied(true); setApplying(false); }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 max-w-3xl">
          <Link href="/model/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to campaigns
          </Link>

          <div className="space-y-6">
            {/* Brand info */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: brandImg ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                {brandImg
                  ? <Image src={brandImg} alt={campaign.brand.brandName} width={48} height={48} className="object-cover w-full h-full" />
                  : campaign.brand.brandName[0]}
              </div>
              <div>
                <Link href={`/brand/${campaign.brand.id}`} className="font-semibold hover:text-pink-500 transition-colors">{campaign.brand.brandName}</Link>
                {campaign.brand.location && <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin size={11} /> {campaign.brand.location}</p>}
              </div>
            </div>

            {/* Campaign title + status */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                campaign.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                campaign.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                'bg-muted text-muted-foreground'
              }`}>{campaign.status}</span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {campaign.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {campaign.location}</span>}
              {campaign.budget && <span className="flex items-center gap-1.5"><DollarSign size={14} /> {campaign.budget}</span>}
              {campaign.startDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> {fmt(campaign.startDate)}{campaign.endDate ? ` – ${fmt(campaign.endDate)}` : ''}
                </span>
              )}
            </div>

            {/* Tags */}
            {campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {campaign.tags.map((t) => (
                  <span key={t} className="text-sm px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-medium">{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold mb-3">About this campaign</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{campaign.description}</p>
            </div>

            {/* Brand links */}
            {(campaign.brand.website || campaign.brand.instagramUrl) && (
              <div className="flex gap-3">
                {campaign.brand.website && (
                  <a href={campaign.brand.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe size={14} /> Website
                  </a>
                )}
                {campaign.brand.instagramUrl && (
                  <a href={campaign.brand.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram size={14} /> Instagram
                  </a>
                )}
              </div>
            )}

            {/* CTA */}
            {isModel && campaign.status === 'OPEN' && (
              <button
                onClick={() => !applied && setApplying(true)}
                disabled={applied}
                className="w-full h-14 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
                style={applied ? { background: '#22c55e' } : { background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 6px 24px rgba(236,72,153,0.35)' }}
              >
                {applied ? <><CheckCircle2 size={18} /> Applied!</> : <><Send size={18} /> Apply to this Campaign</>}
              </button>
            )}

            {!isModel && me && (
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="w-full h-14 rounded-2xl text-base font-semibold border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                Share Campaign
              </button>
            )}

            {!me && (
              <Link
                href="/signup"
                className="w-full h-14 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 6px 24px rgba(236,72,153,0.35)' }}
              >
                Sign up to Apply
              </Link>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
