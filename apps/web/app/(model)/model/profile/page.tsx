'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

export default function ModelProfilePage() {
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    height: '',
    bust: '',
    waist: '',
    hips: '',
    shoeSize: '',
    hairColor: '',
    eyeColor: '',
    instagramUrl: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<any>('/api/models/me').then((p) => {
      if (p) {
        setForm({
          displayName: p.displayName ?? '',
          bio: p.bio ?? '',
          location: p.location ?? '',
          height: p.height?.toString() ?? '',
          bust: p.bust?.toString() ?? '',
          waist: p.waist?.toString() ?? '',
          hips: p.hips?.toString() ?? '',
          shoeSize: p.shoeSize?.toString() ?? '',
          hairColor: p.hairColor ?? '',
          eyeColor: p.eyeColor ?? '',
          instagramUrl: p.instagramUrl ?? '',
          tags: (p.tags ?? []).join(', '),
        });
      }
    }).catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        displayName: form.displayName,
        bio: form.bio || undefined,
        location: form.location || undefined,
        hairColor: form.hairColor || undefined,
        eyeColor: form.eyeColor || undefined,
        instagramUrl: form.instagramUrl || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (form.height) payload.height = parseInt(form.height);
      if (form.bust) payload.bust = parseInt(form.bust);
      if (form.waist) payload.waist = parseInt(form.waist);
      if (form.hips) payload.hips = parseInt(form.hips);
      if (form.shoeSize) payload.shoeSize = parseFloat(form.shoeSize);

      await apiFetch('/api/models/me', { method: 'PUT', body: payload });
      setMessage('Profile saved.');
    } catch (err: any) {
      setMessage(err?.error ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Display Name" required>
              <Input value={form.displayName} onChange={(e) => update('displayName', e.target.value)} required />
            </Field>
            <Field label="Bio">
              <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={3} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
            </Field>
            <Field label="Instagram URL">
              <Input value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="editorial, runway, commercial" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Measurements</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <Input type="number" value={form.height} onChange={(e) => update('height', e.target.value)} />
            </Field>
            <Field label="Bust (cm)">
              <Input type="number" value={form.bust} onChange={(e) => update('bust', e.target.value)} />
            </Field>
            <Field label="Waist (cm)">
              <Input type="number" value={form.waist} onChange={(e) => update('waist', e.target.value)} />
            </Field>
            <Field label="Hips (cm)">
              <Input type="number" value={form.hips} onChange={(e) => update('hips', e.target.value)} />
            </Field>
            <Field label="Shoe Size">
              <Input type="number" step="0.5" value={form.shoeSize} onChange={(e) => update('shoeSize', e.target.value)} />
            </Field>
            <Field label="Hair Color">
              <Input value={form.hairColor} onChange={(e) => update('hairColor', e.target.value)} />
            </Field>
            <Field label="Eye Color">
              <Input value={form.eyeColor} onChange={(e) => update('eyeColor', e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
      </form>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
    </div>
  );
}
