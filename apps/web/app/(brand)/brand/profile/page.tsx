'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Building2, Globe, MapPin, Instagram, FileText, Camera, CheckCircle2, Sparkles, Tag } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const INDUSTRIES = ['Fashion', 'Apparel', 'Beauty', 'Lifestyle', 'Sports', 'Entertainment', 'Other'];

export default function BrandProfilePage() {
  const [form, setForm] = useState({
    brandName: '',
    industry: '',
    website: '',
    bio: '',
    location: '',
    instagramUrl: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<any>('/api/brands/me').then((p) => {
      if (!p) return;
      setForm({
        brandName:    p.brandName ?? '',
        industry:     p.industry ?? '',
        website:      p.website ?? '',
        bio:          p.bio ?? '',
        location:     p.location ?? '',
        instagramUrl: (p.instagramUrl ?? '').replace(/^https?:\/\/(www\.)?instagram\.com\//, ''),
      });
      if (p.logoUrl) setLogoUrl(p.logoUrl);
    }).catch(() => {});
  }, []);

  function upd(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/brands/me/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Logo upload failed'); return; }
      setLogoUrl(data.url);
    } catch {
      setError('Logo upload failed — please try again');
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        brandName:    form.brandName || undefined,
        industry:     form.industry || undefined,
        website:      form.website || undefined,
        bio:          form.bio || undefined,
        location:     form.location || undefined,
        instagramUrl: form.instagramUrl ? `https://instagram.com/${form.instagramUrl}` : undefined,
      };
      await apiFetch('/api/brands/me', { method: 'PUT', body: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const me = getCurrentUser();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">How talent sees your brand — keep it complete</p>
        </div>
        <div className="flex items-center gap-2">
          {me?.userId && (
            <Link
              href={`/brand/${me.userId}`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              View My Profile
            </Link>
          )}
          <button
            form="brand-profile-form"
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{
              background: saved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ec4899,#be185d)',
              boxShadow: saved ? '0 4px 16px rgba(34,197,94,0.3)' : '0 4px 16px rgba(236,72,153,0.3)',
            }}
          >
            {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving…' : <><Sparkles size={15} /> Save Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: logo + preview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Logo card */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground self-start">Logo</p>

            <div className="relative">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-muted flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: logoUrl ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                {logoUrl ? (
                  <Image src={logoUrl} alt="Brand logo" fill className="object-cover" />
                ) : (
                  form.brandName ? form.brandName[0].toUpperCase() : '?'
                )}
              </div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow hover:bg-pink-600 transition-colors disabled:opacity-50"
                title="Upload logo"
              >
                {uploadingLogo ? <span className="text-[10px]">…</span> : <Camera size={14} />}
              </button>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

            <p className="text-xs text-muted-foreground text-center">
              Square image recommended · Max 5 MB
            </p>
          </div>

          {/* Brand preview */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="h-16 w-full" style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8,#f5f3ff)' }} />
            <div className="px-4 pb-4">
              <div
                className="w-14 h-14 rounded-full border-4 border-white -mt-7 mb-3 overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-md"
                style={{ background: logoUrl ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                {logoUrl ? (
                  <Image src={logoUrl} alt="Brand logo" width={56} height={56} className="object-cover" />
                ) : (
                  form.brandName ? form.brandName[0].toUpperCase() : '?'
                )}
              </div>
              <h3 className="font-bold text-base leading-tight">
                {form.brandName || <span className="text-muted-foreground italic font-normal text-sm">Brand name</span>}
              </h3>
              {form.industry && (
                <p className="text-xs text-muted-foreground mt-0.5">{form.industry}</p>
              )}
              {form.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {form.location}
                </p>
              )}
              {form.bio && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{form.bio}</p>
              )}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Talent preview</span>
                <span className="flex items-center gap-1 text-pink-400"><Sparkles size={11} /> Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          <form id="brand-profile-form" onSubmit={handleSave} className="space-y-5">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
            )}

            <FormSection icon={<Building2 size={16} />} title="Brand Name" required>
              <input
                value={form.brandName}
                onChange={(e) => upd('brandName', e.target.value)}
                required
                placeholder="Your brand name"
                className="form-field"
              />
            </FormSection>

            <FormSection icon={<Tag size={16} />} title="Industry">
              <select
                value={form.industry}
                onChange={(e) => upd('industry', e.target.value)}
                className="form-field"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </FormSection>

            <FormSection icon={<FileText size={16} />} title="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => upd('bio', e.target.value)}
                placeholder="Tell talent about your brand — aesthetic, values, and what you look for"
                rows={4}
                className="form-field resize-none"
              />
            </FormSection>

            <FormSection icon={<MapPin size={16} />} title="Location">
              <input
                value={form.location}
                onChange={(e) => upd('location', e.target.value)}
                placeholder="City, Country"
                className="form-field"
              />
            </FormSection>

            <FormSection icon={<Globe size={16} />} title="Website">
              <input
                type="url"
                value={form.website}
                onChange={(e) => upd('website', e.target.value)}
                placeholder="https://yourbrand.com"
                className="form-field"
              />
            </FormSection>

            <FormSection icon={<Instagram size={16} />} title="Instagram">
              <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-pink-300 focus-within:border-pink-300 transition-all">
                <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-border whitespace-nowrap select-none">
                  instagram.com/
                </span>
                <input
                  value={form.instagramUrl}
                  onChange={(e) => upd('instagramUrl', e.target.value)}
                  placeholder="yourbrand"
                  className="flex-1 h-11 px-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </FormSection>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .form-field {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          color: hsl(var(--foreground));
        }
        textarea.form-field { height: auto; padding: 10px 12px; }
        .form-field:focus { border-color: #f472b6; box-shadow: 0 0 0 3px rgba(244,114,182,0.15); }
        .form-field::placeholder { color: hsl(var(--muted-foreground)); }
        select.form-field { appearance: none; cursor: pointer; }
      `}</style>
    </div>
  );
}

function FormSection({ icon, title, required, children }: {
  icon: React.ReactNode; title: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-pink-500">{icon}</span>
        <label className="text-sm font-semibold">
          {title}{required && <span className="text-pink-400 ml-1">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
}
