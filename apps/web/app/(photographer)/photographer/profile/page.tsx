'use client';
import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { MapPin, Instagram, DollarSign, CalendarX2, User, X, CheckCircle2, Sparkles, Tag, Camera } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PhotographerProfilePage() {
  const [form, setForm] = useState({
    displayName: '', bio: '', location: '', instagramUrl: '',
    dayRate: '', halfDayRate: '', hourlyRate: '',
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<any>('/api/photographers/me').then((p) => {
      if (!p) return;
      const rates = p.rates ?? {};
      setForm({
        displayName:  p.displayName ?? '',
        bio:          p.bio ?? '',
        location:     p.location ?? '',
        instagramUrl: (p.instagramUrl ?? '').replace(/^https?:\/\/(www\.)?instagram\.com\//, ''),
        dayRate:      rates.dayRate?.toString() ?? '',
        halfDayRate:  rates.halfDayRate?.toString() ?? '',
        hourlyRate:   rates.hourlyRate?.toString() ?? '',
      });
      setSpecialties(p.specialties ?? []);
      setUnavailableDates(p.availability ?? []);
      if (p.profileImage) setProfileImage(p.profileImage);
    }).catch(() => {});
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/photographers/me/profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setProfileImage(data.url);
    } catch {
      setError('Avatar upload failed — please try again');
    } finally {
      setUploadingAvatar(false);
      if (avatarRef.current) avatarRef.current.value = '';
    }
  }

  function upd(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !specialties.includes(t)) setSpecialties((p) => [...p, t]);
    setTagInput('');
  }
  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && specialties.length) setSpecialties((p) => p.slice(0, -1));
  }

  function addDate() {
    if (dateInput && !unavailableDates.includes(dateInput)) {
      setUnavailableDates((p) => [...p, dateInput].sort());
    }
    setDateInput('');
  }

  const pct = Math.round(
    [form.displayName, form.bio, form.location, form.instagramUrl, form.dayRate, specialties.length > 0 ? 'ok' : '']
      .filter(Boolean).length / 6 * 100
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        displayName:  form.displayName,
        bio:          form.bio || undefined,
        location:     form.location || undefined,
        instagramUrl: form.instagramUrl ? `https://instagram.com/${form.instagramUrl}` : undefined,
        specialties,
        availability: unavailableDates,
      };
      const rates: Record<string, number> = {};
      if (form.dayRate)     rates.dayRate     = parseFloat(form.dayRate);
      if (form.halfDayRate) rates.halfDayRate = parseFloat(form.halfDayRate);
      if (form.hourlyRate)  rates.hourlyRate  = parseFloat(form.hourlyRate);
      if (Object.keys(rates).length) payload.rates = rates;

      await apiFetch('/api/photographers/me', { method: 'PUT', body: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">How brands and models see you</p>
        </div>
        <button
          form="profile-form"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: preview + progress */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="h-20 w-full" style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8,#f5f3ff)' }} />
            <div className="px-4 pb-4">
              <div className="relative w-16 h-16 -mt-8 mb-3">
                <div
                  className="w-16 h-16 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-2xl font-bold text-white shadow-md"
                  style={{ background: profileImage ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
                >
                  {profileImage ? (
                    <Image src={profileImage} alt="Profile" fill className="object-cover" />
                  ) : (
                    form.displayName ? form.displayName[0].toUpperCase() : '?'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <span className="text-[10px]">…</span> : <Camera size={12} />}
                </button>
              </div>
              <h3 className="font-bold text-lg leading-tight">
                {form.displayName || <span className="text-muted-foreground italic font-normal text-base">Display name</span>}
              </h3>
              {form.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {form.location}
                </p>
              )}
              {form.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{form.bio}</p>}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {specialties.slice(0, 5).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-pink-50 text-pink-600 border border-pink-100">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Public preview</span>
                <span className="flex items-center gap-1 text-pink-400"><Sparkles size={11} /> Live</span>
              </div>
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

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
                  background: pct >= 80 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f472b6,#ec4899)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          <form id="profile-form" onSubmit={handleSave} className="space-y-5">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
            )}

            <Section icon={<User size={16} />} title="Display Name" required>
              <input
                value={form.displayName}
                onChange={(e) => upd('displayName', e.target.value)}
                required
                placeholder="Your photographer name"
                className="form-field"
              />
            </Section>

            <Section icon={<User size={16} />} title="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => upd('bio', e.target.value)}
                placeholder="What's your style? Tell brands and models about your work…"
                rows={4}
                maxLength={400}
                className="form-field resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/400</p>
            </Section>

            <Section icon={<MapPin size={16} />} title="Location">
              <input
                value={form.location}
                onChange={(e) => upd('location', e.target.value)}
                placeholder="City, Country"
                className="form-field"
              />
            </Section>

            <Section icon={<Instagram size={16} />} title="Instagram">
              <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-pink-300 focus-within:border-pink-300 transition-all">
                <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-border whitespace-nowrap select-none">
                  instagram.com/
                </span>
                <input
                  value={form.instagramUrl}
                  onChange={(e) => upd('instagramUrl', e.target.value)}
                  placeholder="yourhandle"
                  className="flex-1 h-11 px-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </Section>

            <Section icon={<Tag size={16} />} title="Specialties">
              <div className="rounded-xl border bg-background p-3 min-h-[56px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-pink-300 transition-all">
                {specialties.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200">
                    {t}
                    <button type="button" onClick={() => setSpecialties((p) => p.filter((x) => x !== t))} className="hover:text-pink-900 ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKey}
                  onBlur={addTag}
                  placeholder={specialties.length === 0 ? 'Type a specialty + press Enter (e.g. editorial, portrait, commercial)' : 'Add more…'}
                  className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add a specialty</p>
            </Section>

            <Section icon={<DollarSign size={16} />} title="Rates">
              <div className="space-y-3">
                {[
                  { key: 'dayRate',     label: 'Full Day',  desc: '8+ hours' },
                  { key: 'halfDayRate', label: 'Half Day',  desc: '4 hours' },
                  { key: 'hourlyRate',  label: 'Hourly',    desc: 'per hour' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={(form as any)[key]}
                        onChange={(e) => upd(key, e.target.value)}
                        placeholder="—"
                        className="form-field pl-7 text-lg font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={<CalendarX2 size={16} />} title="Unavailable Dates">
              <p className="text-sm text-muted-foreground mb-3">Mark dates you are not available for bookings.</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-field flex-1"
                />
                <button
                  type="button"
                  onClick={addDate}
                  disabled={!dateInput}
                  className="px-4 h-11 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
                >
                  Block date
                </button>
              </div>
              {unavailableDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {unavailableDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <CalendarX2 size={11} />
                      {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <button type="button" onClick={() => setUnavailableDates((p) => p.filter((x) => x !== d))} className="hover:text-red-900 ml-0.5">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .form-field {
          width: 100%; height: 44px; padding: 0 12px;
          border-radius: 12px; border: 1px solid hsl(var(--border));
          background: hsl(var(--background)); font-size: 0.875rem;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          color: hsl(var(--foreground));
        }
        textarea.form-field { height: auto; padding: 10px 12px; }
        .form-field:focus { border-color: #f472b6; box-shadow: 0 0 0 3px rgba(244,114,182,0.15); }
        .form-field::placeholder { color: hsl(var(--muted-foreground)); }
      `}</style>
    </div>
  );
}

function Section({ icon, title, required, children }: {
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
