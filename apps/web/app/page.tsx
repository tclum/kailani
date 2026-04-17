'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, DollarSign, Calendar, ArrowRight, Sparkles, Camera, Users, BookOpen, Rss, Newspaper, Star, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface FeaturedModel {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  tags: string[];
  user?: { verified?: boolean } | null;
}

interface FeaturedCampaign {
  id: string;
  title: string;
  description: string;
  budget?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tags: string[];
  brand: { brandName: string; logoUrl?: string | null; profileImage?: string | null };
}

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ isLoggedIn, dashHref }: { isLoggedIn: boolean; dashHref: string }) {
  return (
    <section
      className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{ background: '#080808' }}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(244,114,182,0.13) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(192,192,192,0.06) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 50% 50%, rgba(236,72,153,0.05) 0%, transparent 70%)',
      }} />

      {/* Corner accents */}
      <CornerAccent pos="top-left" />
      <CornerAccent pos="top-right" />
      <CornerAccent pos="bottom-left" />
      <CornerAccent pos="bottom-right" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(192,192,192,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-pink-400/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400/50" />
          <span className="text-xs tracking-[0.35em] uppercase text-pink-300/60 font-light">Est. 2025</span>
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400/50" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-pink-400/40" />
        </div>

        {/* Logo */}
        <h1
          className="kailani-logo-animated text-[clamp(5rem,14vw,9rem)] font-light leading-none"
          style={{ fontFamily: 'var(--font-cormorant, Georgia, serif)' }}
        >
          Kailani
        </h1>

        {/* Tagline */}
        <div className="space-y-3">
          <p className="text-2xl md:text-3xl font-light tracking-wide" style={{ color: 'rgba(244,244,245,0.9)' }}>
            Where Fashion Meets Talent
          </p>
          <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(161,161,170,0.7)' }}>
            A curated community connecting models, brands, and photographers.
            Discover collaborators, build your career, and create work that matters.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isLoggedIn ? (
            <Link
              href={dashHref}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 6px 24px rgba(236,72,153,0.4)' }}
            >
              <Sparkles size={16} /> Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 6px 24px rgba(236,72,153,0.4)' }}
              >
                <Sparkles size={16} /> Join the Community
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'rgba(244,244,245,0.85)', border: '1px solid rgba(244,114,182,0.25)' }}
              >
                Sign In <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 pt-4">
          {[['Models', '22+'], ['Brands', '8+'], ['Photographers', '5+'], ['Campaigns', '10+']].map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold" style={{ color: 'rgba(244,244,245,0.9)' }}>{val}</p>
              <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.5)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-pink-400/40 to-transparent" />
      </div>
    </section>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, href, hrefLabel }: { title: string; sub: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      </div>
      {href && hrefLabel && (
        <Link href={href} className="text-sm font-medium text-pink-500 hover:text-pink-600 flex items-center gap-1 transition-colors">
          {hrefLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ─── Model card ───────────────────────────────────────────────────────────────

function ModelCard({ m }: { m: FeaturedModel }) {
  const img = m.profileImage ?? m.coverImage;
  const initials = m.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Link href={`/model/${m.userId}`} className="group flex-shrink-0 w-48 sm:w-52">
      <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
        <div className="aspect-[3/4] relative bg-muted overflow-hidden">
          {img ? (
            <Image src={img} alt={m.displayName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-semibold text-sm truncate">{m.displayName}</p>
            {m.location && <p className="text-white/70 text-xs truncate flex items-center gap-0.5"><MapPin size={9} /> {m.location}</p>}
          </div>
          {m.user?.verified && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        {m.tags.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {m.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({ c }: { c: FeaturedCampaign }) {
  const brandImg = c.brand.logoUrl ?? c.brand.profileImage;
  return (
    <Link href={`/campaigns/${c.id}`} className="group flex-shrink-0 w-72 sm:w-80">
      <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow h-full flex flex-col gap-3">
        {/* Brand row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
            {brandImg ? <Image src={brandImg} alt={c.brand.brandName} width={32} height={32} className="object-cover w-full h-full" /> : c.brand.brandName[0]}
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate">{c.brand.brandName}</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex-shrink-0">OPEN</span>
        </div>
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-pink-500 transition-colors">{c.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1 leading-relaxed">{c.description}</p>
        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {c.location && <span className="flex items-center gap-1"><MapPin size={10} /> {c.location}</span>}
          {c.budget && <span className="flex items-center gap-1"><DollarSign size={10} /> {c.budget}</span>}
          {c.startDate && <span className="flex items-center gap-1"><Calendar size={10} /> {fmt(c.startDate)}</span>}
        </div>
        {c.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Coming Soon card ─────────────────────────────────────────────────────────

function ComingSoonCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-3 relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-200 tracking-wider">COMING SOON</span>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(236,72,153,0.12),rgba(190,24,93,0.08))', border: '1px solid rgba(236,72,153,0.15)' }}>
        <span className="text-pink-500">{icon}</span>
      </div>
      <h3 className="font-semibold text-sm leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Join card ────────────────────────────────────────────────────────────────

function JoinCard({ icon, role, desc, color }: { icon: string; role: string; desc: string; color: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-shadow">
      <div className="text-4xl">{icon}</div>
      <div>
        <h3 className="font-bold text-lg">{role}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
      </div>
      <Link
        href={`/signup`}
        className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{ background: color }}
      >
        Join as {role}
      </Link>
    </div>
  );
}

// ─── Corner accent (same as login page) ───────────────────────────────────────

function CornerAccent({ pos }: { pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const posClass = { 'top-left': 'top-6 left-6', 'top-right': 'top-6 right-6', 'bottom-left': 'bottom-6 left-6', 'bottom-right': 'bottom-6 right-6' }[pos];
  const isRight = pos.includes('right');
  const isBottom = pos.includes('bottom');
  return (
    <div className={`absolute w-16 h-16 pointer-events-none ${posClass}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <line x1={isRight ? 64 : 0} y1={isBottom ? 64 : 0} x2={isRight ? 64 : 0} y2={isBottom ? 20 : 44} stroke="rgba(244,114,182,0.2)" strokeWidth="1" />
        <line x1={isRight ? 20 : 0} y1={isBottom ? 64 : 0} x2={isRight ? 64 : 44} y2={isBottom ? 64 : 0} stroke="rgba(244,114,182,0.2)" strokeWidth="1" />
        <circle cx={isRight ? 64 : 0} cy={isBottom ? 64 : 0} r="2" fill="rgba(212,212,216,0.35)" />
      </svg>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const me = getCurrentUser();
  const isLoggedIn = !!me;
  const dashHref = me
    ? me.role === 'MODEL' ? '/model/dashboard'
    : me.role === 'BRAND' ? '/brand/dashboard'
    : me.role === 'PHOTOGRAPHER' ? '/photographer/dashboard'
    : '/admin/dashboard'
    : '/login';

  const [models, setModels] = useState<FeaturedModel[]>([]);
  const [campaigns, setCampaigns] = useState<FeaturedCampaign[]>([]);

  useEffect(() => {
    apiFetch<{ profiles: FeaturedModel[] }>(`/api/models?featured=true&limit=6`)
      .then((r) => setModels(r.profiles))
      .catch(() => {});

    apiFetch<{ campaigns: FeaturedCampaign[] }>(`/api/campaigns?status=OPEN&limit=4`)
      .then((r) => setCampaigns(r.campaigns ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <Hero isLoggedIn={isLoggedIn} dashHref={dashHref} />

      {/* Featured Models */}
      {models.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Discover Models"
              sub="Talented professionals ready to collaborate"
              href="/signup"
              hrefLabel="Browse all"
            />
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {models.map((m) => <ModelCard key={m.userId} m={m} />)}
            </div>
          </div>
        </section>
      )}

      {/* Featured Campaigns */}
      {campaigns.length > 0 && (
        <section className="py-16 px-4" style={{ background: 'rgba(244,114,182,0.02)', borderTop: '1px solid rgba(244,114,182,0.08)', borderBottom: '1px solid rgba(244,114,182,0.08)' }}>
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Open Campaigns"
              sub="Brands actively looking for talent right now"
              href="/signup"
              hrefLabel="View all campaigns"
            />
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {campaigns.map((c) => <CampaignCard key={c.id} c={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* What's Coming */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="What's Coming"
            sub="We're building the most complete fashion platform on the web"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ComingSoonCard
              icon={<BookOpen size={20} />}
              title="Tutorials"
              desc="Posing tips, makeup tutorials, photography guides, and industry resources from experts."
            />
            <ComingSoonCard
              icon={<Rss size={20} />}
              title="Community Feed"
              desc="Stories, tips, and behind-the-scenes content shared by verified members of the Kailani community."
            />
            <ComingSoonCard
              icon={<Newspaper size={20} />}
              title="Industry News"
              desc="Latest trends, casting calls, seasonal highlights, and opportunities in fashion."
            />
            <ComingSoonCard
              icon={<Star size={20} />}
              title="Spotlights"
              desc="Model, brand, and photographer of the week — celebrating outstanding community members."
            />
          </div>
        </div>
      </section>

      {/* Join section — logged-out only */}
      {!isLoggedIn && (
        <section className="py-20 px-4" style={{ background: '#080808' }}>
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-pink-400/40" />
              <span className="w-1 h-1 rounded-full bg-pink-400/50" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-400/40" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light" style={{ color: 'rgba(244,244,245,0.95)' }}>
              Join the Community
            </h2>
            <p className="mt-3 text-sm leading-relaxed max-w-lg mx-auto" style={{ color: 'rgba(161,161,170,0.65)' }}>
              Whether you're a model building your portfolio, a brand finding talent, or a photographer growing your network — Kailani is built for you.
            </p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            <JoinCard
              icon="✨"
              role="Model"
              desc="Build your portfolio, get discovered by top brands, and apply to paid campaigns."
              color="linear-gradient(135deg,#ec4899,#be185d)"
            />
            <JoinCard
              icon="🏷️"
              role="Brand"
              desc="Post campaigns, discover verified models, and build your talent roster."
              color="linear-gradient(135deg,#8b5cf6,#6d28d9)"
            />
            <JoinCard
              icon="📷"
              role="Photographer"
              desc="Showcase your portfolio, connect with models and brands, and grow your business."
              color="linear-gradient(135deg,#06b6d4,#0e7490)"
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-semibold tracking-wider">◆ &nbsp;KAILANI&nbsp; ◆</span>
          <span>© {new Date().getFullYear()} Kailani. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
