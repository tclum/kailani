'use client';
import { useEffect, useState, KeyboardEvent } from 'react';
import { MapPin, Instagram, Ruler, Palette, Tag, CheckCircle2, Sparkles, User, X, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Tab = 'identity' | 'measurements' | 'appearance';

const HAIR_PRESETS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Silver', 'White', 'Other'];
const EYE_PRESETS  = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];

const HAIR_SWATCHES: Record<string, string> = {
  Black: '#1a1a1a', Brown: '#6b3a2a', Blonde: '#e8c97e',
  Red: '#c0392b', Auburn: '#922b21', Silver: '#c0c0c0',
  White: '#f5f5f5', Other: '#a78bfa',
};
const EYE_SWATCHES: Record<string, string> = {
  Brown: '#6b3a2a', Blue: '#3b82f6', Green: '#22c55e',
  Hazel: '#a16207', Gray: '#6b7280', Amber: '#f59e0b', Other: '#a78bfa',
};

export default function ModelProfilePage() {
  const [tab, setTab] = useState<Tab>('identity');
  const [form, setForm] = useState({
    displayName: '', bio: '', location: '', instagramUrl: '',
    height: '', bust: '', waist: '', hips: '', shoeSize: '',
    hairColor: '', eyeColor: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<any>('/api/models/me').then((p) => {
      if (!p) return;
      setForm({
        displayName: p.displayName ?? '',
        bio: p.bio ?? '',
        location: p.location ?? '',
        instagramUrl: p.instagramUrl ?? '',
        height: p.height?.toString() ?? '',
        bust: p.bust?.toString() ?? '',
        waist: p.waist?.toString() ?? '',
        hips: p.hips?.toString() ?? '',
        shoeSize: p.shoeSize?.toString() ?? '',
        hairColor: p.hairColor ?? '',
        eyeColor: p.eyeColor ?? '',
      });
      setTags(p.tags ?? []);
    }).catch(() => {});
  }, []);

  function upd(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput('');
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags((p) => p.slice(0, -1));
    }
  }

  function removeTag(t: string) { setTags((p) => p.filter((x) => x !== t)); }

  // Completion score
  const fields = [
    form.displayName, form.bio, form.location, form.instagramUrl,
    form.height, form.bust, form.waist, form.hips,
    form.hairColor, form.eyeColor, tags.length > 0 ? 'ok' : '',
  ];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        displayName: form.displayName,
        bio: form.bio || undefined,
        location: form.location || undefined,
        instagramUrl: form.instagramUrl || undefined,
        hairColor: form.hairColor || undefined,
        eyeColor: form.eyeColor || undefined,
        tags,
      };
      if (form.height)   payload.height   = parseInt(form.height);
      if (form.bust)     payload.bust     = parseInt(form.bust);
      if (form.waist)    payload.waist    = parseInt(form.waist);
      if (form.hips)     payload.hips     = parseInt(form.hips);
      if (form.shoeSize) payload.shoeSize = parseFloat(form.shoeSize);
      await apiFetch('/api/models/me', { method: 'PUT', body: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'identity',     label: 'Identity',     icon: <User size={15} /> },
    { id: 'measurements', label: 'Measurements', icon: <Ruler size={15} /> },
    { id: 'appearance',   label: 'Appearance',   icon: <Palette size={15} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How brands see you — keep it complete and current
          </p>
        </div>
        <button
          form="profile-form"
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{
            background: saved
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'linear-gradient(135deg,#ec4899,#be185d)',
            boxShadow: saved
              ? '0 4px 16px rgba(34,197,94,0.3)'
              : '0 4px 16px rgba(236,72,153,0.3)',
          }}
        >
          {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving…' : <><Sparkles size={15} /> Save Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: live preview ─────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <PreviewCard form={form} tags={tags} />

          {/* Completion meter */}
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Profile strength</span>
              <span className="font-bold" style={{ color: pct >= 80 ? '#22c55e' : '#ec4899' }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct >= 80
                    ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                    : 'linear-gradient(90deg,#f472b6,#ec4899)',
                }}
              />
            </div>
            {pct < 100 && (
              <p className="text-xs text-muted-foreground">
                {pct < 50 ? 'Add more details to get discovered by brands.' : 'Almost there — fill in the remaining fields.'}
              </p>
            )}
          </div>

          {/* Section jump hints */}
          <div className="rounded-2xl border bg-card p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Sections</p>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  tab === t.id ? 'bg-pink-50 text-pink-600 font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className="flex items-center gap-2">{t.icon}{t.label}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: tabbed form ─────────────────────────── */}
        <div className="lg:col-span-2">
          {/* Tab bar */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl bg-muted w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <form id="profile-form" onSubmit={handleSave}>
            {error && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}

            {/* ── Identity tab ── */}
            {tab === 'identity' && (
              <div className="space-y-5">
                <FormSection icon={<User size={16} />} title="Display Name" required>
                  <input
                    value={form.displayName}
                    onChange={(e) => upd('displayName', e.target.value)}
                    required
                    placeholder="Your model name"
                    className="form-field"
                  />
                </FormSection>

                <FormSection icon={<User size={16} />} title="Bio">
                  <textarea
                    value={form.bio}
                    onChange={(e) => upd('bio', e.target.value)}
                    placeholder="A short introduction — what makes you unique as a model?"
                    rows={4}
                    maxLength={400}
                    className="form-field resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {form.bio.length}/400
                  </p>
                </FormSection>

                <FormSection icon={<MapPin size={16} />} title="Location">
                  <input
                    value={form.location}
                    onChange={(e) => upd('location', e.target.value)}
                    placeholder="City, Country"
                    className="form-field"
                  />
                </FormSection>

                <FormSection icon={<Instagram size={16} />} title="Instagram URL">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      instagram.com/
                    </span>
                    <input
                      value={form.instagramUrl.replace(/.*instagram\.com\//,'')}
                      onChange={(e) => upd('instagramUrl', e.target.value ? `https://instagram.com/${e.target.value}` : '')}
                      placeholder="yourhandle"
                      className="form-field pl-28"
                    />
                  </div>
                </FormSection>

                <FormSection icon={<Tag size={16} />} title="Specialties">
                  <div className="rounded-xl border bg-background p-3 min-h-[56px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-pink-300 focus-within:border-pink-300 transition-all">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-pink-900 ml-0.5">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={onTagKey}
                      onBlur={addTag}
                      placeholder={tags.length === 0 ? 'Type a specialty + press Enter  (e.g. editorial, runway, beauty)' : 'Add more…'}
                      className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add a tag</p>
                </FormSection>
              </div>
            )}

            {/* ── Measurements tab ── */}
            {tab === 'measurements' && (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Body Measurements</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'height', label: 'Height', unit: 'cm', icon: '↕' },
                      { key: 'bust',   label: 'Bust',   unit: 'cm', icon: '◯' },
                      { key: 'waist',  label: 'Waist',  unit: 'cm', icon: '◯' },
                      { key: 'hips',   label: 'Hips',   unit: 'cm', icon: '◯' },
                    ].map(({ key, label, unit, icon }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {icon} {label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={(form as any)[key]}
                            onChange={(e) => upd(key, e.target.value)}
                            placeholder="—"
                            className="form-field pr-12 text-center text-lg font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                            {unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Shoe Size</p>
                  <div className="max-w-[160px]">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={form.shoeSize}
                        onChange={(e) => upd('shoeSize', e.target.value)}
                        placeholder="—"
                        className="form-field pr-10 text-center text-lg font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">EU</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 text-sm text-pink-700">
                  <strong>Tip:</strong> Accurate measurements help brands shortlist you faster. Always measure in centimetres.
                </div>
              </div>
            )}

            {/* ── Appearance tab ── */}
            {tab === 'appearance' && (
              <div className="space-y-5">
                <ColorPicker
                  label="Hair Color"
                  value={form.hairColor}
                  onChange={(v) => upd('hairColor', v)}
                  presets={HAIR_PRESETS}
                  swatches={HAIR_SWATCHES}
                />
                <ColorPicker
                  label="Eye Color"
                  value={form.eyeColor}
                  onChange={(v) => upd('eyeColor', v)}
                  presets={EYE_PRESETS}
                  swatches={EYE_SWATCHES}
                />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Global CSS for form fields */}
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
        textarea.form-field {
          height: auto;
          padding: 10px 12px;
        }
        .form-field:focus {
          border-color: #f472b6;
          box-shadow: 0 0 0 3px rgba(244,114,182,0.15);
        }
        .form-field::placeholder {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function FormSection({
  icon, title, required, children,
}: {
  icon: React.ReactNode;
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-pink-500">{icon}</span>
        <label className="text-sm font-semibold">
          {title}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
}

function PreviewCard({ form, tags }: { form: any; tags: string[] }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Cover strip */}
      <div className="h-20 w-full" style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8,#f5f3ff)' }} />
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full border-4 border-white -mt-8 mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-md"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
        >
          {form.displayName ? form.displayName[0].toUpperCase() : '?'}
        </div>

        <h3 className="font-bold text-lg leading-tight">
          {form.displayName || <span className="text-muted-foreground italic font-normal text-base">Display name</span>}
        </h3>

        {form.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {form.location}
          </p>
        )}

        {form.bio && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{form.bio}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 5).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-pink-50 text-pink-600 border border-pink-100">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Brand preview</span>
          <span className="flex items-center gap-1 text-pink-400">
            <Sparkles size={11} /> Live
          </span>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label, value, onChange, presets, swatches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  swatches: Record<string, string>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <span className="text-pink-500"><Palette size={16} /></span>
        {label}
      </p>

      {/* Swatch grid */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              value === p
                ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                : 'border-border hover:border-pink-300 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ background: swatches[p] }}
            />
            {p}
          </button>
        ))}
      </div>

      {/* Free-text fallback */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all"
          style={{
            background: swatches[value] ?? (value ? '#e5e7eb' : '#f3f4f6'),
            borderColor: value ? '#f472b6' : '#e5e7eb',
          }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or type a custom color…"
          className="form-field"
        />
      </div>
    </div>
  );
}
