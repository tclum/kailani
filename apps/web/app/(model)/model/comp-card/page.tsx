'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Download, Link2, Check, Palette, ToggleLeft, Type,
  ImageIcon, AlertCircle, Loader2, ChevronRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompCardData {
  userId: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  instagramUrl?: string | null;
  heightCm?: number | null;
  bustCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  shoeSize?: number | null;
  hairColor?: string | null;
  eyeColor?: string | null;
  skinTone?: string | null;
  tags: string[];
  portfolioImages: string[];
  profileImage?: string | null;
  coverImage?: string | null;
  rates?: { dayRate?: number; halfDayRate?: number; hourlyRate?: number } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const THEMES = {
  pink:  { bg: '#fff',     panelBg: '#fdf2f8', accent: '#ec4899', text: '#1a1a1a', sub: '#9ca3af', strip: '#fce7f3', border: '#fce7f3' },
  black: { bg: '#0a0a0a',  panelBg: '#0a0a0a', accent: '#f9fafb', text: '#f9fafb', sub: '#6b7280', strip: '#111',    border: '#222' },
  gold:  { bg: '#13100a',  panelBg: '#13100a', accent: '#d4a853', text: '#f5e6c8', sub: '#8a7550', strip: '#1e180c', border: '#2a1f0d' },
  white: { bg: '#f8f8f6',  panelBg: '#f0efec', accent: '#374151', text: '#1a1a1a', sub: '#9ca3af', strip: '#e8e7e3', border: '#e5e5e5' },
};

const FONTS = {
  classic:   { name: '"Cormorant Garamond", Georgia, serif',      nameSize: 30, subSize: 9,  labelSize: 7 },
  modern:    { name: '"Inter", "Helvetica Neue", sans-serif',      nameSize: 26, subSize: 8,  labelSize: 6.5 },
  editorial: { name: '"Playfair Display", "Georgia", serif',       nameSize: 28, subSize: 8.5, labelSize: 7 },
};

type ThemeKey = keyof typeof THEMES;
type FontKey = keyof typeof FONTS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function calcCompleteness(p: CompCardData): { pct: number; missing: string[] } {
  const checks: { label: string; done: boolean }[] = [
    { label: 'Profile photo or portfolio image', done: !!(p.profileImage || p.portfolioImages.length > 0) },
    { label: 'Display name', done: !!p.displayName },
    { label: 'Location', done: !!p.location },
    { label: 'Height measurement', done: !!p.heightCm },
    { label: 'At least 2 measurements', done: [p.bustCm, p.waistCm, p.hipsCm].filter(Boolean).length >= 2 },
    { label: 'Tags / look types', done: p.tags.length > 0 },
    { label: 'Portfolio images (3+)', done: p.portfolioImages.length >= 3 },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}

// ─── Card renderer (used for both preview and PDF export) ─────────────────────

interface CardProps {
  data: CompCardData;
  heroSrc: string;
  theme: typeof THEMES[ThemeKey];
  font: typeof FONTS[FontKey];
  show: { measurements: boolean; rates: boolean; instagram: boolean; tags: boolean; hairEye: boolean };
}

function CompCard({ data, heroSrc, theme, font, show }: CardProps) {
  const strip = data.portfolioImages.filter((u) => u !== heroSrc).slice(0, 4);
  const nameParts = data.displayName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div
      style={{
        width: 900, height: 600, display: 'flex', flexDirection: 'column',
        background: theme.bg, overflow: 'hidden', position: 'relative',
        fontFamily: font.name,
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Hero image */}
        <div style={{ width: 540, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {heroSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={heroSrc}
              alt={data.displayName}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fce7f3,#f5d0e6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 80, color: '#ec4899', opacity: 0.3 }}>✦</span>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1, background: theme.panelBg, display: 'flex', flexDirection: 'column',
          padding: '22px 24px 18px', gap: 0, overflow: 'hidden',
        }}>
          {/* Kailani brand */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <span style={{
              fontFamily: font.name, fontSize: 9, letterSpacing: 4,
              color: theme.accent, fontWeight: 400, textTransform: 'uppercase',
            }}>KAILANI</span>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: font.name, fontWeight: 300, fontSize: font.nameSize, lineHeight: 1.05, color: theme.text }}>
              {firstName}
            </div>
            <div style={{ fontFamily: font.name, fontWeight: 600, fontSize: font.nameSize, lineHeight: 1.05, color: theme.text }}>
              {lastName}
            </div>
            {data.location && (
              <div style={{ fontSize: font.subSize, letterSpacing: 2.5, color: theme.sub, marginTop: 7, textTransform: 'uppercase' }}>
                {data.location}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: theme.border, marginBottom: 12 }} />

          {/* Measurements */}
          {show.measurements && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
                {data.heightCm && <MeasRow label="HEIGHT" value={`${cmToFtIn(data.heightCm)} / ${data.heightCm}cm`} theme={theme} font={font} />}
                {data.bustCm && <MeasRow label="BUST" value={`${data.bustCm}cm`} theme={theme} font={font} />}
                {data.waistCm && <MeasRow label="WAIST" value={`${data.waistCm}cm`} theme={theme} font={font} />}
                {data.hipsCm && <MeasRow label="HIPS" value={`${data.hipsCm}cm`} theme={theme} font={font} />}
                {data.shoeSize && <MeasRow label="SHOE" value={`${data.shoeSize}`} theme={theme} font={font} />}
              </div>
            </div>
          )}

          {/* Hair / Eye */}
          {show.hairEye && (data.hairColor || data.eyeColor) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              {data.hairColor && <MeasRow label="HAIR" value={data.hairColor} theme={theme} font={font} />}
              {data.eyeColor && <MeasRow label="EYES" value={data.eyeColor} theme={theme} font={font} />}
            </div>
          )}

          {/* Tags */}
          {show.tags && data.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {data.tags.slice(0, 6).map((t) => (
                <span key={t} style={{
                  fontSize: 7, letterSpacing: 1.5, padding: '2px 7px',
                  border: `1px solid ${theme.accent}`, color: theme.accent,
                  borderRadius: 3, textTransform: 'uppercase',
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Instagram */}
          {show.instagram && data.instagramUrl && (
            <div style={{ fontSize: font.subSize, color: theme.accent, marginBottom: 6, letterSpacing: 1 }}>
              {instagramHandle(data.instagramUrl)}
            </div>
          )}

          {/* Rates */}
          {show.rates && data.rates?.dayRate && (
            <div style={{ fontSize: font.labelSize, color: theme.sub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Day Rate: <span style={{ color: theme.text }}>${data.rates.dayRate}</span>
              {data.rates.hourlyRate ? ` · Hourly: $${data.rates.hourlyRate}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Bottom image strip */}
      {strip.length > 0 && (
        <div style={{ height: 118, display: 'flex', gap: 2, background: theme.strip, flexShrink: 0 }}>
          {strip.slice(0, 4).map((url, i) => (
            <div key={i} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeasRow({ label, value, theme, font }: { label: string; value: string; theme: typeof THEMES[ThemeKey]; font: typeof FONTS[FontKey] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: font.labelSize, letterSpacing: 2, color: theme.sub, textTransform: 'uppercase', fontWeight: 400 }}>{label}</span>
      <span style={{ fontSize: font.subSize + 1, color: theme.text, fontWeight: 500, marginTop: 1 }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompCardPage() {
  const [profile, setProfile] = useState<CompCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Customization state
  const [heroIdx, setHeroIdx] = useState(0);
  const [themeKey, setThemeKey] = useState<ThemeKey>('pink');
  const [fontKey, setFontKey] = useState<FontKey>('classic');
  const [show, setShow] = useState({ measurements: true, rates: true, instagram: true, tags: true, hairEye: true });

  const cardRef = useRef<HTMLDivElement>(null);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<CompCardData>('/api/models/me/comp-card')
      .then((p) => { setProfile(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleShow = useCallback((key: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  async function downloadPDF() {
    if (!cardRef.current || !profile) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [6, 4] });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 6, 4);
      const fileName = `${profile.displayName.replace(/\s+/g, '-').toLowerCase()}-comp-card.pdf`;
      pdf.save(fileName);
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!profile) return;
    const url = `${window.location.origin}/comp-card/${profile.userId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center py-24 gap-4">
        <AlertCircle size={32} className="text-muted-foreground" />
        <p className="text-muted-foreground">Could not load your profile. Please try again.</p>
      </div>
    );
  }

  const allImages = [
    ...(profile.profileImage ? [profile.profileImage] : []),
    ...(profile.coverImage && profile.coverImage !== profile.profileImage ? [profile.coverImage] : []),
    ...profile.portfolioImages,
  ];
  const heroSrc = allImages[heroIdx] ?? '';
  const theme = THEMES[themeKey];
  const font = FONTS[fontKey];
  const { pct, missing } = calcCompleteness(profile);

  // Scale card to fit preview (card is 900×600)
  const CARD_W = 900;
  const CARD_H = 600;
  const previewScale = 0.62;
  const previewW = CARD_W * previewScale;
  const previewH = CARD_H * previewScale;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comp Card Generator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your professional calling card — download as PDF or share a link</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Link2 size={14} /> Share Link</>}
          </button>
          <button
            onClick={downloadPDF}
            disabled={generating}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
          >
            {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Download size={14} /> Download PDF</>}
          </button>
        </div>
      </div>

      {/* Completeness warning */}
      {pct < 60 && missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Complete your profile for a better comp card ({pct}% done)</p>
            <p className="text-xs text-amber-700 mt-1">Missing: {missing.slice(0, 3).join(' · ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}</p>
          </div>
          <Link
            href="/model/profile"
            className="flex-shrink-0 flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
          >
            Complete Profile <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6 items-start flex-wrap lg:flex-nowrap">

        {/* Card preview */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-muted/30 p-6 flex items-center justify-center">
            <div
              style={{ width: previewW, height: previewH, overflow: 'hidden', borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            >
              <div
                ref={cardRef}
                style={{ width: CARD_W, height: CARD_H, transformOrigin: 'top left', transform: `scale(${previewScale})` }}
              >
                <CompCard
                  data={profile}
                  heroSrc={heroSrc}
                  theme={theme}
                  font={font}
                  show={show}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Preview — 6"×4" landscape · Download for print quality</p>
        </div>

        {/* Customization panel */}
        <div className="w-full lg:w-72 xl:w-80 space-y-5 flex-shrink-0">

          {/* Hero image picker */}
          {allImages.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ImageIcon size={12} /> Main Image
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {allImages.slice(0, 8).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      heroIdx === i ? 'border-pink-500 scale-105' : 'border-transparent hover:border-pink-200'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Palette size={12} /> Color Theme
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setThemeKey(k)}
                  className={`h-10 rounded-xl border-2 transition-all capitalize text-xs font-semibold ${
                    themeKey === k ? 'border-pink-500 scale-105' : 'border-transparent'
                  }`}
                  style={{ background: THEMES[k].bg, color: THEMES[k].text, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Font style */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Type size={12} /> Typography
            </p>
            <div className="space-y-1.5">
              {(Object.keys(FONTS) as FontKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFontKey(k)}
                  className={`w-full h-10 rounded-xl border text-sm transition-all capitalize px-3 text-left flex items-center justify-between ${
                    fontKey === k ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-border hover:bg-muted'
                  }`}
                  style={{ fontFamily: FONTS[k].name }}
                >
                  <span>{k}</span>
                  {fontKey === k && <Check size={14} className="text-pink-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle fields */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ToggleLeft size={12} /> Show / Hide
            </p>
            <div className="space-y-2">
              {([
                { key: 'measurements', label: 'Measurements' },
                { key: 'hairEye',      label: 'Hair & Eye Color' },
                { key: 'tags',         label: 'Look Tags' },
                { key: 'instagram',    label: 'Instagram' },
                { key: 'rates',        label: 'Rates' },
              ] as { key: keyof typeof show; label: string }[]).map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                  <button
                    onClick={() => toggleShow(key)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      show[key] ? 'bg-pink-500' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      show[key] ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Share</p>
            <p className="text-xs text-muted-foreground">Share a web version with agencies or brands</p>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted text-xs text-muted-foreground font-mono truncate">
              /comp-card/{me?.userId?.slice(0, 8)}…
            </div>
            <button
              onClick={copyLink}
              className="w-full h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <><Check size={13} className="text-green-500" /> Copied!</> : <><Link2 size={13} /> Copy Link</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
