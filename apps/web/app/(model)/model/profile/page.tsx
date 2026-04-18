'use client';
import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { MapPin, Instagram, Ruler, DollarSign, CalendarX2, User, X, ChevronRight, CheckCircle2, Sparkles, Palette, Tag, Camera, Scale, Clapperboard, GraduationCap, Plus, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Tab = 'basic' | 'measurements' | 'rates' | 'availability' | 'physical' | 'credits' | 'skills' | 'education';

type TvCredit = { title: string; role: string; production: string; director: string; location: string; date: string };
type ModelingCredit = { title: string; role: string; client: string; photographer: string; location: string; date: string };
type FilmCredit = { title: string; role: string; production: string; director: string; location: string; date: string };
type CommercialCredit = { title: string; role: string; client: string; location: string; date: string };
type CreditTab = 'television' | 'modeling' | 'film' | 'commercial';
type EducationEntry = { institution: string; degree: string; year: string };

const HAIR_PRESETS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Silver', 'White', 'Other'];
const EYE_PRESETS  = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];
const SKIN_PRESETS = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep', 'Other'];

const HAIR_SWATCHES: Record<string, string> = {
  Black: '#1a1a1a', Brown: '#6b3a2a', Blonde: '#e8c97e',
  Red: '#c0392b', Auburn: '#922b21', Silver: '#c0c0c0',
  White: '#f5f5f5', Other: '#a78bfa',
};
const EYE_SWATCHES: Record<string, string> = {
  Brown: '#6b3a2a', Blue: '#3b82f6', Green: '#22c55e',
  Hazel: '#a16207', Gray: '#6b7280', Amber: '#f59e0b', Other: '#a78bfa',
};
const SKIN_SWATCHES: Record<string, string> = {
  Fair: '#fde8d8', Light: '#f5cba7', Medium: '#e59866', Olive: '#c9a96e',
  Tan: '#b07d56', Brown: '#7d5a3c', Deep: '#4a2c1a', Other: '#a78bfa',
};

export default function ModelProfilePage() {
  const [tab, setTab] = useState<Tab>('basic');
  const [form, setForm] = useState({
    displayName: '', bio: '', location: '', instagramUrl: '',
    heightCm: '', bustCm: '', waistCm: '', hipsCm: '', shoeSize: '',
    hairColor: '', eyeColor: '', skinTone: '',
    dayRate: '', halfDayRate: '', hourlyRate: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Physical
  const [weightKg, setWeightKg] = useState('');
  const [build, setBuild] = useState('');
  const [gender, setGender] = useState('');
  const [playingAgeMin, setPlayingAgeMin] = useState('');
  const [playingAgeMax, setPlayingAgeMax] = useState('');

  // Credits
  const [tvCredits, setTvCredits] = useState<TvCredit[]>([]);
  const [modelingCredits, setModelingCredits] = useState<ModelingCredit[]>([]);
  const [filmCredits, setFilmCredits] = useState<FilmCredit[]>([]);
  const [commercialCredits, setCommercialCredits] = useState<CommercialCredit[]>([]);
  const [creditTab, setCreditTab] = useState<CreditTab>('television');

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [unionStatus, setUnionStatus] = useState('');
  const [representation, setRepresentation] = useState('');
  const [website, setWebsite] = useState('');

  // Education
  const [education, setEducation] = useState<EducationEntry[]>([]);

  useEffect(() => {
    apiFetch<any>('/api/models/me').then((p) => {
      if (!p) return;
      const rates = p.rates ?? {};
      setForm({
        displayName:  p.displayName ?? '',
        bio:          p.bio ?? '',
        location:     p.location ?? '',
        instagramUrl: (p.instagramUrl ?? '').replace(/^https?:\/\/(www\.)?instagram\.com\//, ''),
        heightCm:     p.heightCm?.toString() ?? '',
        bustCm:       p.bustCm?.toString() ?? '',
        waistCm:      p.waistCm?.toString() ?? '',
        hipsCm:       p.hipsCm?.toString() ?? '',
        shoeSize:     p.shoeSize?.toString() ?? '',
        hairColor:    p.hairColor ?? '',
        eyeColor:     p.eyeColor ?? '',
        skinTone:     p.skinTone ?? '',
        dayRate:      rates.dayRate?.toString() ?? '',
        halfDayRate:  rates.halfDayRate?.toString() ?? '',
        hourlyRate:   rates.hourlyRate?.toString() ?? '',
      });
      setTags(p.tags ?? []);
      setUnavailableDates(p.availability ?? []);
      if (p.profileImage) setProfileImage(p.profileImage);

      setWeightKg(p.weightKg?.toString() ?? '');
      setBuild(p.build ?? '');
      setGender(p.gender ?? '');
      setPlayingAgeMin(p.playingAgeMin?.toString() ?? '');
      setPlayingAgeMax(p.playingAgeMax?.toString() ?? '');
      setTvCredits((p.televisionCredits as TvCredit[]) ?? []);
      setModelingCredits((p.modelingCredits as ModelingCredit[]) ?? []);
      setFilmCredits((p.filmCredits as FilmCredit[]) ?? []);
      setCommercialCredits((p.commercialCredits as CommercialCredit[]) ?? []);
      setSkills(p.skills ?? []);
      setLanguages(p.languages ?? []);
      setUnionStatus(p.unionStatus ?? '');
      setRepresentation(p.representation ?? '');
      setWebsite(p.website ?? '');
      setEducation((p.education as EducationEntry[]) ?? []);
    }).catch(() => {});
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/models/me/profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return; }
      setProfileImage(data.url);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Avatar upload failed — please try again');
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
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput('');
  }
  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags((p) => p.slice(0, -1));
  }

  function addDate() {
    if (dateInput && !unavailableDates.includes(dateInput)) {
      setUnavailableDates((p) => [...p, dateInput].sort());
    }
    setDateInput('');
  }

  // Completion score
  const fields = [
    form.displayName, form.bio, form.location, form.instagramUrl,
    form.heightCm, form.bustCm, form.waistCm, form.hipsCm,
    form.hairColor, form.eyeColor, form.skinTone,
    form.dayRate, tags.length > 0 ? 'ok' : '',
  ];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        displayName:  form.displayName,
        bio:          form.bio || undefined,
        location:     form.location || undefined,
        instagramUrl: form.instagramUrl ? `https://instagram.com/${form.instagramUrl}` : undefined,
        hairColor:    form.hairColor || undefined,
        eyeColor:     form.eyeColor || undefined,
        skinTone:     form.skinTone || undefined,
        tags,
        availability: unavailableDates,
      };
      if (form.heightCm)  payload.heightCm  = parseInt(form.heightCm);
      if (form.bustCm)    payload.bustCm    = parseInt(form.bustCm);
      if (form.waistCm)   payload.waistCm   = parseInt(form.waistCm);
      if (form.hipsCm)    payload.hipsCm    = parseInt(form.hipsCm);
      if (form.shoeSize)  payload.shoeSize  = parseFloat(form.shoeSize);
      const rates: Record<string, number> = {};
      if (form.dayRate)     rates.dayRate     = parseFloat(form.dayRate);
      if (form.halfDayRate) rates.halfDayRate = parseFloat(form.halfDayRate);
      if (form.hourlyRate)  rates.hourlyRate  = parseFloat(form.hourlyRate);
      if (Object.keys(rates).length) payload.rates = rates;

      if (weightKg) payload.weightKg = parseFloat(weightKg);
      if (build) payload.build = build;
      if (gender) payload.gender = gender;
      if (playingAgeMin) payload.playingAgeMin = parseInt(playingAgeMin);
      if (playingAgeMax) payload.playingAgeMax = parseInt(playingAgeMax);
      payload.televisionCredits = tvCredits;
      payload.modelingCredits = modelingCredits;
      payload.filmCredits = filmCredits;
      payload.commercialCredits = commercialCredits;
      payload.skills = skills;
      payload.languages = languages;
      if (unionStatus) payload.unionStatus = unionStatus;
      if (representation) payload.representation = representation;
      if (website) payload.website = website || undefined;
      payload.education = education;

      await apiFetch('/api/models/me', { method: 'PUT', body: payload });
      setSaved(true);
      toast.success('Profile saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'basic',        label: 'Basic Info',    icon: <User size={15} /> },
    { id: 'measurements', label: 'Measurements',  icon: <Ruler size={15} /> },
    { id: 'physical',     label: 'Physical',      icon: <Scale size={15} /> },
    { id: 'credits',      label: 'Credits',       icon: <Clapperboard size={15} /> },
    { id: 'skills',       label: 'Skills',        icon: <Sparkles size={15} /> },
    { id: 'education',    label: 'Education',     icon: <GraduationCap size={15} /> },
    { id: 'rates',        label: 'Rates',         icon: <DollarSign size={15} /> },
    { id: 'availability', label: 'Availability',  icon: <CalendarX2 size={15} /> },
  ];

  const me = getCurrentUser();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">How brands see you — keep it complete and current</p>
        </div>
        <div className="flex items-center gap-2">
          {me?.userId && (
            <Link
              href={`/model/${me.userId}`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              View My Profile
            </Link>
          )}
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
            {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : <><Sparkles size={15} /> Save Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: preview + progress */}
        <div className="lg:col-span-1 space-y-4">
          <PreviewCard form={form} tags={tags} profileImage={profileImage} onAvatarClick={() => avatarRef.current?.click()} uploading={uploadingAvatar} />
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
            {pct < 100 && (
              <p className="text-xs text-muted-foreground">
                {pct < 50 ? 'Add more details to get discovered by brands.' : 'Almost there — fill in the remaining fields.'}
              </p>
            )}
          </div>

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

        {/* Right: tabbed form */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-5 p-1 rounded-xl bg-muted w-fit flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <form id="profile-form" onSubmit={handleSave}>
            {/* ── Basic Info ── */}
            {tab === 'basic' && (
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
                  <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/400</p>
                </FormSection>

                <FormSection icon={<MapPin size={16} />} title="Location">
                  <input
                    value={form.location}
                    onChange={(e) => upd('location', e.target.value)}
                    placeholder="City, Country"
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
                      placeholder="yourhandle"
                      className="flex-1 h-11 px-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
                    />
                  </div>
                </FormSection>

                <FormSection icon={<Tag size={16} />} title="Specialties">
                  <div className="rounded-xl border bg-background p-3 min-h-[56px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-pink-300 focus-within:border-pink-300 transition-all">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200">
                        {t}
                        <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="hover:text-pink-900 ml-0.5">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={onTagKey}
                      onBlur={addTag}
                      placeholder={tags.length === 0 ? 'Type a specialty + press Enter (e.g. editorial, runway, beauty)' : 'Add more…'}
                      className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add a tag</p>
                </FormSection>

                <ColorPicker label="Hair Color" value={form.hairColor} onChange={(v) => upd('hairColor', v)} presets={HAIR_PRESETS} swatches={HAIR_SWATCHES} />
                <ColorPicker label="Eye Color"  value={form.eyeColor}  onChange={(v) => upd('eyeColor', v)}  presets={EYE_PRESETS}  swatches={EYE_SWATCHES} />
                <ColorPicker label="Skin Tone"  value={form.skinTone}  onChange={(v) => upd('skinTone', v)}  presets={SKIN_PRESETS} swatches={SKIN_SWATCHES} />
              </div>
            )}

            {/* ── Measurements ── */}
            {tab === 'measurements' && (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Body Measurements</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'heightCm', label: 'Height', icon: '↕' },
                      { key: 'bustCm',   label: 'Bust',   icon: '◯' },
                      { key: 'waistCm',  label: 'Waist',  icon: '◯' },
                      { key: 'hipsCm',   label: 'Hips',   icon: '◯' },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{icon} {label}</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={(form as any)[key]}
                            onChange={(e) => upd(key, e.target.value)}
                            placeholder="—"
                            className="form-field pr-12 text-center text-lg font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">cm</span>
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

            {/* ── Rates ── */}
            {tab === 'rates' && (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Day Rates</p>
                  <div className="space-y-4">
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
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 text-sm text-pink-700">
                  <strong>Tip:</strong> Setting clear rates helps brands know if you fit their budget — you can always negotiate.
                </div>
              </div>
            )}

            {/* ── Physical ── */}
            {tab === 'physical' && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Physical Attributes</h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Weight */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Weight</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" placeholder="kg" value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                      {weightKg && (
                        <span className="text-sm text-muted-foreground flex-shrink-0">
                          {Math.round(parseFloat(weightKg) * 2.205)} lbs
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Build */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Build</label>
                    <select value={build} onChange={(e) => setBuild(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                      <option value="">Select build</option>
                      {['Slim', 'Athletic', 'Average', 'Curvy', 'Plus-size', 'Petite', 'Muscular'].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {/* Gender */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                      <option value="">Select gender</option>
                      {['Female', 'Male', 'Non-binary', 'Other'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  {/* Playing age */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Playing Age Range</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" placeholder="Min" value={playingAgeMin}
                        onChange={(e) => setPlayingAgeMin(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                      <span className="text-muted-foreground text-sm">–</span>
                      <input type="number" placeholder="Max" value={playingAgeMax}
                        onChange={(e) => setPlayingAgeMax(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Credits ── */}
            {tab === 'credits' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Credits & Experience</h2>
                {/* Sub-tab bar */}
                <div className="flex gap-1 p-1 rounded-xl bg-muted">
                  {(['television', 'modeling', 'film', 'commercial'] as CreditTab[]).map((ct) => (
                    <button key={ct} type="button"
                      onClick={() => setCreditTab(ct)}
                      className={`flex-1 h-8 rounded-lg text-xs font-medium capitalize transition-colors ${creditTab === ct ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      {ct === 'television' ? 'TV' : ct.charAt(0).toUpperCase() + ct.slice(1)}
                    </button>
                  ))}
                </div>
                <CreditList
                  type={creditTab}
                  tvCredits={tvCredits} setTvCredits={setTvCredits}
                  modelingCredits={modelingCredits} setModelingCredits={setModelingCredits}
                  filmCredits={filmCredits} setFilmCredits={setFilmCredits}
                  commercialCredits={commercialCredits} setCommercialCredits={setCommercialCredits}
                />
              </div>
            )}

            {/* ── Skills ── */}
            {tab === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Skills & Languages</h2>
                {/* Skills tag input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Skills</label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-background min-h-[44px] mb-2">
                    {skills.map((s) => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
                        {s}
                        <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X size={11} /></button>
                      </span>
                    ))}
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                          e.preventDefault();
                          const s = skillInput.trim();
                          if (!skills.includes(s)) setSkills([...skills, s]);
                          setSkillInput('');
                        }
                      }}
                      placeholder="Type a skill, press Enter"
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-sm" />
                  </div>
                  {/* Suggested chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['General Modeling', 'Runway', 'Editorial', 'Commercial', 'Acting', 'Dancing', 'Singing',
                      'Martial Arts', 'Stunt Work', 'Graphic Design', 'Social Media', 'Fitness', 'Swimwear', 'Lingerie'].filter((s) => !skills.includes(s)).map((s) => (
                      <button key={s} type="button"
                        onClick={() => setSkills([...skills, s])}
                        className="px-2.5 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Languages */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Languages</label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-background min-h-[44px] mb-2">
                    {languages.map((l) => (
                      <span key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {l}
                        <button type="button" onClick={() => setLanguages(languages.filter((x) => x !== l))}><X size={11} /></button>
                      </span>
                    ))}
                    <input value={languageInput} onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && languageInput.trim()) {
                          e.preventDefault();
                          const l = languageInput.trim();
                          if (!languages.includes(l)) setLanguages([...languages, l]);
                          setLanguageInput('');
                        }
                      }}
                      placeholder="Add a language, press Enter"
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-sm" />
                  </div>
                </div>
                {/* Union status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Union Status</label>
                    <select value={unionStatus} onChange={(e) => setUnionStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                      <option value="">Not specified</option>
                      {['Non-Union', 'SAG-AFTRA', 'Equity', 'AEA', 'AGMA', 'ACTRA'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Representation</label>
                    <input value={representation} onChange={(e) => setRepresentation(e.target.value)}
                      placeholder="Agency name"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                  </div>
                </div>
                {/* Website */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Personal Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
            )}

            {/* ── Education ── */}
            {tab === 'education' && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Education & Training</h2>
                {education.map((e, i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <input value={e.institution} onChange={(ev) => {
                        const u = [...education]; u[i] = { ...u[i], institution: ev.target.value }; setEducation(u);
                      }} placeholder="Institution" className="col-span-2 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                      <input value={e.year} onChange={(ev) => {
                        const u = [...education]; u[i] = { ...u[i], year: ev.target.value }; setEducation(u);
                      }} placeholder="Year" className="h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <input value={e.degree} onChange={(ev) => {
                        const u = [...education]; u[i] = { ...u[i], degree: ev.target.value }; setEducation(u);
                      }} placeholder="Degree / Program" className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                      <button type="button" onClick={() => setEducation(education.filter((_, j) => j !== i))}
                        className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setEducation([...education, { institution: '', degree: '', year: '' }])}
                  className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 transition-colors font-medium">
                  <Plus size={15} /> Add Education
                </button>
              </div>
            )}

            {/* ── Availability ── */}
            {tab === 'availability' && (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Unavailable Dates</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mark dates you are <strong>not available</strong> for bookings. Leave this empty if your calendar is fully open.
                  </p>

                  <div className="flex gap-2 mb-4">
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
                      className="px-4 h-11 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
                      style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
                    >
                      Block date
                    </button>
                  </div>

                  {unavailableDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No blocked dates — fully available</p>
                  ) : (
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
                </div>
              </div>
            )}
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
      `}</style>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

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

function PreviewCard({ form, tags, profileImage, onAvatarClick, uploading }: {
  form: any; tags: string[]; profileImage: string | null;
  onAvatarClick: () => void; uploading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="h-20 w-full" style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8,#f5f3ff)' }} />
      <div className="px-4 pb-4">
        <div className="relative w-16 h-16 -mt-8 mb-3">
          <div
            className="w-16 h-16 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-2xl font-bold text-white shadow-md"
            style={{ background: profileImage ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {profileImage ? (
              <Image src={profileImage} alt="Profile" fill sizes="96px" className="object-cover" />
            ) : (
              form.displayName ? form.displayName[0].toUpperCase() : '?'
            )}
          </div>
          <button
            type="button"
            onClick={onAvatarClick}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow hover:bg-pink-600 transition-colors disabled:opacity-50"
            title="Upload profile photo"
          >
            {uploading ? <span className="text-[10px]">…</span> : <Camera size={12} />}
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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 5).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-pink-50 text-pink-600 border border-pink-100">{t}</span>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Brand preview</span>
          <span className="flex items-center gap-1 text-pink-400"><Sparkles size={11} /> Live</span>
        </div>
      </div>
    </div>
  );
}

function CreditList({
  type,
  tvCredits, setTvCredits,
  modelingCredits, setModelingCredits,
  filmCredits, setFilmCredits,
  commercialCredits, setCommercialCredits,
}: {
  type: CreditTab;
  tvCredits: TvCredit[]; setTvCredits: (v: TvCredit[]) => void;
  modelingCredits: ModelingCredit[]; setModelingCredits: (v: ModelingCredit[]) => void;
  filmCredits: FilmCredit[]; setFilmCredits: (v: FilmCredit[]) => void;
  commercialCredits: CommercialCredit[]; setCommercialCredits: (v: CommercialCredit[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  // Reset form state when tab changes
  useEffect(() => {
    setEditingIndex(null);
    setAddingNew(false);
    setForm({});
  }, [type]);

  const getList = (): Array<Record<string, string>> => {
    if (type === 'television') return tvCredits as unknown as Array<Record<string, string>>;
    if (type === 'modeling')   return modelingCredits as unknown as Array<Record<string, string>>;
    if (type === 'film')       return filmCredits as unknown as Array<Record<string, string>>;
    return commercialCredits as unknown as Array<Record<string, string>>;
  };

  const setList = (items: Array<Record<string, string>>) => {
    if (type === 'television') { setTvCredits(items as unknown as TvCredit[]); return; }
    if (type === 'modeling')   { setModelingCredits(items as unknown as ModelingCredit[]); return; }
    if (type === 'film')       { setFilmCredits(items as unknown as FilmCredit[]); return; }
    setCommercialCredits(items as unknown as CommercialCredit[]);
  };

  const fieldsFor = (t: CreditTab): { key: string; label: string; placeholder: string }[] => {
    if (t === 'television') return [
      { key: 'title',      label: 'Title',      placeholder: 'Show title' },
      { key: 'role',       label: 'Role',       placeholder: 'Character / Role' },
      { key: 'production', label: 'Production', placeholder: 'Network / Studio' },
      { key: 'director',   label: 'Director',   placeholder: 'Director name' },
      { key: 'location',   label: 'Location',   placeholder: 'City' },
      { key: 'date',       label: 'Date',       placeholder: 'e.g. Jun 2023' },
    ];
    if (t === 'modeling') return [
      { key: 'title',        label: 'Title',        placeholder: 'Campaign / Shoot name' },
      { key: 'role',         label: 'Role',         placeholder: 'Role / type' },
      { key: 'client',       label: 'Client',       placeholder: 'Brand / Agency' },
      { key: 'photographer', label: 'Photographer', placeholder: 'Photographer name' },
      { key: 'location',     label: 'Location',     placeholder: 'City' },
      { key: 'date',         label: 'Date',         placeholder: 'e.g. Jun 2023' },
    ];
    if (t === 'film') return [
      { key: 'title',      label: 'Title',      placeholder: 'Film title' },
      { key: 'role',       label: 'Role',       placeholder: 'Character / Role' },
      { key: 'production', label: 'Production', placeholder: 'Studio / Production co.' },
      { key: 'director',   label: 'Director',   placeholder: 'Director name' },
      { key: 'location',   label: 'Location',   placeholder: 'City' },
      { key: 'date',       label: 'Date',       placeholder: 'e.g. Jun 2023' },
    ];
    return [
      { key: 'title',    label: 'Title',    placeholder: 'Commercial name' },
      { key: 'role',     label: 'Role',     placeholder: 'Role / type' },
      { key: 'client',   label: 'Client',   placeholder: 'Brand / Client' },
      { key: 'location', label: 'Location', placeholder: 'City' },
      { key: 'date',     label: 'Date',     placeholder: 'e.g. Jun 2023' },
    ];
  };

  const blankFor = (t: CreditTab): Record<string, string> => {
    const base: Record<string, string> = { title: '', role: '', location: '', date: '' };
    if (t === 'television' || t === 'film') { base.production = ''; base.director = ''; }
    if (t === 'modeling') { base.client = ''; base.photographer = ''; }
    if (t === 'commercial') { base.client = ''; }
    return base;
  };

  const list = getList();
  const fields = fieldsFor(type);

  function startAdd() {
    setAddingNew(true);
    setEditingIndex(null);
    setForm(blankFor(type));
  }

  function startEdit(i: number) {
    setEditingIndex(i);
    setAddingNew(false);
    setForm({ ...blankFor(type), ...list[i] });
  }

  function cancel() {
    setAddingNew(false);
    setEditingIndex(null);
    setForm({});
  }

  function save() {
    if (!form.title || !form.title.trim()) return;
    const entry = { ...blankFor(type), ...form };
    if (editingIndex !== null) {
      const next = [...list];
      next[editingIndex] = entry;
      setList(next);
    } else {
      setList([...list, entry]);
    }
    cancel();
  }

  function remove(i: number) {
    const next = list.filter((_, idx) => idx !== i);
    setList(next);
    if (editingIndex === i) cancel();
  }

  return (
    <div className="space-y-3">
      {list.length === 0 && !addingNew && (
        <p className="text-sm text-muted-foreground italic">No credits yet — add your first one below.</p>
      )}

      {list.map((c, i) => {
        const isEditing = editingIndex === i;
        if (isEditing) {
          return (
            <div key={i} className="rounded-xl border border-pink-200 bg-pink-50/40 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                  <input
                    key={f.key}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className={`${f.key === 'title' ? 'col-span-2' : ''} h-10 px-3 rounded-xl border border-border bg-background text-sm`}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={cancel}
                  className="h-9 px-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={save}
                  className="h-9 px-3 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
                  Save
                </button>
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="rounded-xl border border-border p-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="font-semibold text-sm truncate">{c.title}</h4>
                {c.role && <span className="text-xs text-muted-foreground">{c.role}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {(c as any).production && <span>{(c as any).production}</span>}
                {(c as any).client && <span>{(c as any).client}</span>}
                {(c as any).director && <span>Dir. {(c as any).director}</span>}
                {(c as any).photographer && <span>Photo: {(c as any).photographer}</span>}
                {c.location && <span>{c.location}</span>}
                {c.date && <span>{c.date}</span>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button type="button" onClick={() => startEdit(i)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Pencil size={13} />
              </button>
              <button type="button" onClick={() => remove(i)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}

      {addingNew ? (
        <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <input
                key={f.key}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={`${f.key === 'title' ? 'col-span-2' : ''} h-10 px-3 rounded-xl border border-border bg-background text-sm`}
              />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancel}
              className="h-9 px-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={save}
              className="h-9 px-3 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              Add Credit
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startAdd}
          className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 transition-colors font-medium">
          <Plus size={15} /> Add Credit
        </button>
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange, presets, swatches }: {
  label: string; value: string; onChange: (v: string) => void;
  presets: string[]; swatches: Record<string, string>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <span className="text-pink-500"><Palette size={16} /></span>
        {label}
      </p>
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
            <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ background: swatches[p] }} />
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all"
          style={{ background: swatches[value] ?? (value ? '#e5e7eb' : '#f3f4f6'), borderColor: value ? '#f472b6' : '#e5e7eb' }}
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
