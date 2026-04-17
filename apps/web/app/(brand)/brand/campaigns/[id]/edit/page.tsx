'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand } from '@kailani/types';

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', budget: '', location: '',
    startDate: '', endDate: '', tags: '',
    status: 'DRAFT' as 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    apiFetch<CampaignWithBrand>(`/api/campaigns/${id}`)
      .then((c) => {
        if (c.status !== 'DRAFT' && c.status !== 'OPEN') {
          setForbidden(true);
          return;
        }
        setForm({
          title:       c.title,
          description: c.description,
          budget:      c.budget ?? '',
          location:    c.location ?? '',
          startDate:   toDateInput(c.startDate),
          endDate:     toDateInput(c.endDate),
          tags:        c.tags.join(', '),
          status:      c.status as any,
        });
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, [id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        title:       form.title,
        description: form.description,
        status:      form.status,
        budget:      form.budget || undefined,
        location:    form.location || undefined,
        startDate:   form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate:     form.endDate ? new Date(form.endDate).toISOString() : undefined,
        tags:        form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await apiFetch(`/api/campaigns/${id}`, { method: 'PUT', body: payload });
      setSaved(true);
      setTimeout(() => router.push(`/brand/campaigns/${id}`), 1200);
    } catch (err: any) {
      setError(err?.error ?? 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-muted-foreground">This campaign cannot be edited (it may be closed or completed, or you don&apos;t own it).</p>
        <Link href="/brand/campaigns" className="text-sm text-pink-500 hover:underline">← Back to campaigns</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/brand/campaigns/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Campaign</h1>
          <p className="text-sm text-muted-foreground">Changes apply immediately</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Budget</Label>
                <Input value={form.budget} onChange={(e) => update('budget', e.target.value)} placeholder="e.g. $500–$1000" />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="editorial, swimwear, beauty" />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <div className="flex gap-3">
                {(['DRAFT', 'OPEN'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                      form.status === s
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || saved} className="flex items-center gap-2">
            {saved ? (
              <><CheckCircle2 size={15} /> Saved! Redirecting…</>
            ) : saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/brand/campaigns/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
