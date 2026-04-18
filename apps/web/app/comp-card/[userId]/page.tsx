'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { ModelProfile } from '@kailani/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Inline theme + font (matches private comp card defaults) ────────────────

const THEME = {
  bg: '#fff',
  panelBg: '#fdf2f8',
  accent: '#ec4899',
  text: '#1a1a1a',
  sub: '#9ca3af',
  strip: '#fce7f3',
  border: '#fce7f3',
};
const FONT = {
  name: '"Cormorant Garamond", Georgia, serif',
  nameSize: 30,
  subSize: 9,
  labelSize: 7,
};

// ─── Page 1 ──────────────────────────────────────────────────────────────────

function CompCardPage1({ profile, heroSrc }: { profile: any; heroSrc: string }) {
  const strip = (profile.portfolioImages as string[]).filter((u) => u !== heroSrc).slice(0, 4);
  const nameParts = (profile.displayName as string).split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div style={{
      width: 900, height: 600, display: 'flex', flexDirection: 'column',
      background: THEME.bg, overflow: 'hidden', position: 'relative',
      fontFamily: FONT.name,
    }}>
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

        {/* Right panel */}
        <div style={{ flex: 1, background: THEME.panelBg, display: 'flex', flexDirection: 'column', padding: '22px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <span style={{ fontSize: 9, letterSpacing: 4, color: THEME.accent, textTransform: 'uppercase' }}>KAILANI</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 300, fontSize: FONT.nameSize, lineHeight: 1.05, color: THEME.text }}>{firstName}</div>
            <div style={{ fontWeight: 600, fontSize: FONT.nameSize, lineHeight: 1.05, color: THEME.text }}>{lastName}</div>
            {profile.location && (
              <div style={{ fontSize: FONT.subSize, letterSpacing: 2.5, color: THEME.sub, marginTop: 7, textTransform: 'uppercase' }}>{profile.location}</div>
            )}
          </div>

          <div style={{ height: 1, background: THEME.border, marginBottom: 12 }} />

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

          {(profile.tags as string[]).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {(profile.tags as string[]).slice(0, 6).map((t: string) => (
                <span key={t} style={{ fontSize: 7, letterSpacing: 1.5, padding: '2px 7px', border: `1px solid ${THEME.accent}`, color: THEME.accent, borderRadius: 3, textTransform: 'uppercase' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Playing age + union status row */}
          {(profile.playingAgeMin || profile.unionStatus) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {profile.playingAgeMin && profile.playingAgeMax && (
                <span style={{
                  fontSize: FONT.labelSize, letterSpacing: 1.5, padding: '2px 8px',
                  border: `1px solid ${THEME.border}`, color: THEME.sub,
                  borderRadius: 3, textTransform: 'uppercase',
                }}>Age {profile.playingAgeMin}–{profile.playingAgeMax}</span>
              )}
              {profile.unionStatus && (
                <span style={{
                  fontSize: FONT.labelSize, letterSpacing: 1.5, padding: '2px 8px',
                  border: `1px solid ${THEME.accent}`, color: THEME.accent,
                  borderRadius: 3, textTransform: 'uppercase',
                }}>{profile.unionStatus}</span>
              )}
            </div>
          )}
          {/* Top skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {(profile.skills as string[]).slice(0, 3).map((s: string, i: number) => (
                <span key={i} style={{
                  fontSize: 6.5, letterSpacing: 1, padding: '2px 6px',
                  background: `${THEME.accent}22`, color: THEME.accent,
                  borderRadius: 3, textTransform: 'uppercase',
                }}>{s}</span>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {profile.instagramUrl && (
            <div style={{ fontSize: FONT.subSize, color: THEME.accent, marginBottom: 6, letterSpacing: 1 }}>{instagramHandle(profile.instagramUrl)}</div>
          )}
          {profile.rates?.dayRate && (
            <div style={{ fontSize: FONT.labelSize, color: THEME.sub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Day Rate: <span style={{ color: THEME.text }}>${profile.rates.dayRate}</span>
            </div>
          )}
        </div>
      </div>

      {strip.length > 0 && (
        <div style={{ height: 118, display: 'flex', gap: 2, background: THEME.strip, flexShrink: 0 }}>
          {strip.map((url, i) => (
            <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DimRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: FONT.labelSize, letterSpacing: 2, color: THEME.sub, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: FONT.subSize + 1, color: THEME.text, fontWeight: 500, marginTop: 1 }}>{value}</span>
    </div>
  );
}

// ─── Page 2 ──────────────────────────────────────────────────────────────────

function CreditRow({ credit }: { credit: any }) {
  const secondary = credit.production || credit.client || '';
  const location = credit.location || '';
  const date = credit.date || '';
  const meta = [secondary, location && date ? `${location} · ${date}` : location || date].filter(Boolean).join(' — ');
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: FONT.subSize, fontWeight: 600, color: THEME.text }}>{credit.title}</div>
      {credit.role && <div style={{ fontSize: FONT.labelSize + 0.5, fontStyle: 'italic', color: THEME.sub }}>{credit.role}</div>}
      {meta && <div style={{ fontSize: FONT.labelSize, color: THEME.sub, marginTop: 1 }}>{meta}</div>}
    </div>
  );
}

function CompCardPage2({ profile }: { profile: any }) {
  const allCredits = [
    { label: 'TELEVISION', items: profile.televisionCredits ?? [] },
    { label: 'FILM', items: profile.filmCredits ?? [] },
    { label: 'MODELING', items: profile.modelingCredits ?? [] },
    { label: 'COMMERCIAL', items: profile.commercialCredits ?? [] },
  ].filter((c) => c.items.length > 0);

  const leftCredits = allCredits.slice(0, 2);
  const rightCredits = allCredits.slice(2, 4);
  const hasSkills = (profile.skills?.length ?? 0) > 0;
  const hasLanguages = (profile.languages?.length ?? 0) > 0;

  const nameParts = (profile.displayName as string).split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  function renderCreditBlock(label: string, items: any[]) {
    return (
      <div style={{ marginBottom: 14 }} key={label}>
        <div style={{
          fontSize: FONT.labelSize, letterSpacing: 2.5, color: THEME.accent,
          textTransform: 'uppercase', fontWeight: 600, marginBottom: 6,
          paddingBottom: 3, borderBottom: `1px solid ${THEME.border}`,
        }}>{label}</div>
        {items.slice(0, 3).map((credit, i) => (
          <CreditRow key={i} credit={credit} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: 900, height: 600, display: 'flex', flexDirection: 'column',
      background: THEME.bg, overflow: 'hidden', position: 'relative',
      fontFamily: FONT.name,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 28px 10px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 300, color: THEME.text }}>{firstName}</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: THEME.text }}>{lastName}</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: 4, color: THEME.accent, fontWeight: 400, textTransform: 'uppercase' }}>KAILANI</span>
      </div>
      <div style={{ height: 1, background: THEME.border, margin: '0 28px', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '14px 28px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, flexShrink: 0 }}>
          <div>{leftCredits.map((c) => renderCreditBlock(c.label, c.items))}</div>
          <div>{rightCredits.map((c) => renderCreditBlock(c.label, c.items))}</div>
        </div>

        {(hasSkills || hasLanguages) && (
          <>
            <div style={{ height: 1, background: THEME.border, margin: '8px 0 12px', flexShrink: 0 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, flexShrink: 0 }}>
              {hasSkills ? (
                <div>
                  <div style={{ fontSize: FONT.labelSize, letterSpacing: 2.5, color: THEME.accent, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(profile.skills as string[]).slice(0, 8).map((s: string, i: number) => (
                      <span key={i} style={{ fontSize: 7, letterSpacing: 1, padding: '2px 7px', background: `${THEME.accent}22`, color: THEME.accent, borderRadius: 3, textTransform: 'uppercase' }}>{s}</span>
                    ))}
                  </div>
                </div>
              ) : <div />}
              {hasLanguages ? (
                <div>
                  <div style={{ fontSize: FONT.labelSize, letterSpacing: 2.5, color: THEME.accent, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Languages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(profile.languages as string[]).map((l: string, i: number) => (
                      <span key={i} style={{ fontSize: 7, letterSpacing: 1, padding: '2px 7px', border: `1px solid ${THEME.border}`, color: THEME.sub, borderRadius: 3, textTransform: 'uppercase' }}>{l}</span>
                    ))}
                  </div>
                </div>
              ) : <div />}
            </div>
          </>
        )}
      </div>

      <div style={{
        height: 30, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
        background: THEME.strip, flexShrink: 0,
      }}>
        <span style={{ fontSize: 7.5, letterSpacing: 1.5, color: THEME.sub, textTransform: 'uppercase' }}>
          {[profile.representation, profile.website].filter(Boolean).join(' · ')}
        </span>
        <span style={{ fontSize: 7.5, letterSpacing: 1.5, color: THEME.sub, textTransform: 'uppercase' }}>
          {profile.location || ''}
        </span>
        <span style={{ fontSize: 8, letterSpacing: 3, color: THEME.accent, textTransform: 'uppercase' }}>KAILANI</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PublicCompCardPage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ModelProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardPage, setCardPage] = useState<1 | 2>(1);

  const cardRef = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<ModelProfile>(`/api/models/${userId}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [userId]);

  async function downloadPDF() {
    if (!profile) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [6, 4] });

      if (cardRef.current) {
        const c1 = await html2canvas(cardRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
        pdf.addImage(c1.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 6, 4);
      }

      const data = profile as any;
      const hasPage2Content = (data.televisionCredits?.length ?? 0) + (data.filmCredits?.length ?? 0) +
        (data.modelingCredits?.length ?? 0) + (data.commercialCredits?.length ?? 0) +
        (data.skills?.length ?? 0) > 0;

      if (card2Ref.current && hasPage2Content) {
        pdf.addPage();
        const c2 = await html2canvas(card2Ref.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
        pdf.addImage(c2.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 6, 4);
      }

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

  const data = profile as any;
  const allImages = [
    ...(profile.profileImage ? [profile.profileImage] : []),
    ...profile.portfolioImages,
  ];
  const heroSrc = allImages[0] ?? '';

  const hasPage2Content = (data.televisionCredits?.length ?? 0) + (data.filmCredits?.length ?? 0) +
    (data.modelingCredits?.length ?? 0) + (data.commercialCredits?.length ?? 0) +
    (data.skills?.length ?? 0) > 0;

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

      {/* Page toggle */}
      {hasPage2Content && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCardPage(1)}
            className={`h-8 px-4 rounded-lg text-xs font-medium transition-colors ${cardPage === 1 ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'}`}
          >
            Page 1 — Measurements
          </button>
          <button
            onClick={() => setCardPage(2)}
            className={`h-8 px-4 rounded-lg text-xs font-medium transition-colors ${cardPage === 2 ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'}`}
          >
            Page 2 — Credits & Skills
          </button>
        </div>
      )}

      {/* Hidden render container for PDF export */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={cardRef} style={{ width: 900, height: 600 }}>
          <CompCardPage1 profile={data} heroSrc={heroSrc} />
        </div>
        <div ref={card2Ref} style={{ width: 900, height: 600 }}>
          <CompCardPage2 profile={data} />
        </div>
      </div>

      {/* Visible card */}
      <div className="flex justify-center">
        <div style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.18)', borderRadius: 6, overflow: 'hidden' }}>
          {cardPage === 1
            ? <CompCardPage1 profile={data} heroSrc={heroSrc} />
            : <CompCardPage2 profile={data} />
          }
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Powered by <Link href="/" className="text-pink-500 hover:underline">Kailani</Link> · Professional model marketplace
      </p>
    </div>
  );
}
