'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { ModelProfile } from '@kailani/types';

// ─── Helpers (duplicated for standalone page, no shared dep) ─────────────────

function cmToFtIn(cm: number): string {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"`;
}

function instagramHandle(url?: string | null): string {
  if (!url) return '';
  return '@' + url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '');
}

export default function PublicCompCardPage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ModelProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiFetch<ModelProfile>(`/api/models/${userId}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [userId]);

  async function downloadPDF() {
    const el = document.getElementById('comp-card-public');
    if (!el || !profile) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [6, 4] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 6, 4);
      pdf.save(`${profile.displayName.replace(/\s+/g, '-').toLowerCase()}-comp-card.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  if (notFound) return (
    <div className="flex flex-col items-center py-24 gap-4">
      <p className="text-muted-foreground">Model not found.</p>
      <Link href="/" className="text-sm text-pink-500 hover:underline">Back to Kailani</Link>
    </div>
  );
  if (!profile) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
    </div>
  );

  const allImages = [
    ...(profile.profileImage ? [profile.profileImage] : []),
    ...profile.portfolioImages,
  ];
  const heroSrc = allImages[0] ?? '';
  const strip = allImages.slice(1, 5);
  const nameParts = profile.displayName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Kailani</Link>
          <h1 className="text-xl font-semibold mt-1">{profile.displayName}</h1>
          {profile.location && <p className="text-sm text-muted-foreground">{profile.location}</p>}
        </div>
        <button
          onClick={downloadPDF}
          disabled={generating}
          className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
        >
          {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Download size={14} /> Download PDF</>}
        </button>
      </div>

      {/* Card */}
      <div className="flex justify-center">
        <div style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.18)', borderRadius: 6, overflow: 'hidden' }}>
          <div
            id="comp-card-public"
            style={{ width: 900, height: 600, display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {/* Main row */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Hero */}
              <div style={{ width: 540, flexShrink: 0, overflow: 'hidden' }}>
                {heroSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroSrc} alt={profile.displayName} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fce7f3,#f5d0e6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 80, color: '#ec4899', opacity: 0.3 }}>✦</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, background: '#fdf2f8', display: 'flex', flexDirection: 'column', padding: '22px 24px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <span style={{ fontSize: 9, letterSpacing: 4, color: '#ec4899', textTransform: 'uppercase' }}>KAILANI</span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 300, fontSize: 30, lineHeight: 1.05, color: '#1a1a1a' }}>{firstName}</div>
                  <div style={{ fontWeight: 600, fontSize: 30, lineHeight: 1.05, color: '#1a1a1a' }}>{lastName}</div>
                  {profile.location && (
                    <div style={{ fontSize: 9, letterSpacing: 2.5, color: '#9ca3af', marginTop: 7, textTransform: 'uppercase' }}>{profile.location}</div>
                  )}
                </div>

                <div style={{ height: 1, background: '#fce7f3', marginBottom: 12 }} />

                {/* Measurements */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px', marginBottom: 10 }}>
                  {profile.heightCm && <DimRow label="HEIGHT" value={`${cmToFtIn(profile.heightCm)} / ${profile.heightCm}cm`} />}
                  {profile.bustCm && <DimRow label="BUST" value={`${profile.bustCm}cm`} />}
                  {profile.waistCm && <DimRow label="WAIST" value={`${profile.waistCm}cm`} />}
                  {profile.hipsCm && <DimRow label="HIPS" value={`${profile.hipsCm}cm`} />}
                  {profile.shoeSize && <DimRow label="SHOE" value={`${profile.shoeSize}`} />}
                </div>

                {(profile.hairColor || profile.eyeColor) && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    {profile.hairColor && <DimRow label="HAIR" value={profile.hairColor} />}
                    {profile.eyeColor && <DimRow label="EYES" value={profile.eyeColor} />}
                  </div>
                )}

                {profile.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {profile.tags.slice(0, 6).map((t) => (
                      <span key={t} style={{ fontSize: 7, letterSpacing: 1.5, padding: '2px 7px', border: '1px solid #ec4899', color: '#ec4899', borderRadius: 3, textTransform: 'uppercase' }}>{t}</span>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1 }} />

                {profile.instagramUrl && (
                  <div style={{ fontSize: 9, color: '#ec4899', marginBottom: 6, letterSpacing: 1 }}>{instagramHandle(profile.instagramUrl)}</div>
                )}
                {profile.rates?.dayRate && (
                  <div style={{ fontSize: 7, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Day Rate: <span style={{ color: '#1a1a1a' }}>${profile.rates.dayRate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom strip */}
            {strip.length > 0 && (
              <div style={{ height: 118, display: 'flex', gap: 2, background: '#fce7f3', flexShrink: 0 }}>
                {strip.map((url, i) => (
                  <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Powered by <Link href="/" className="text-pink-500 hover:underline">Kailani</Link> · Professional model marketplace
      </p>
    </div>
  );
}

function DimRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 7, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 10, color: '#1a1a1a', fontWeight: 500, marginTop: 1 }}>{value}</span>
    </div>
  );
}
