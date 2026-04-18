'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    startDate: '',
    endDate: '',
    tags: '',
    status: 'DRAFT' as 'DRAFT' | 'OPEN',
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        status: form.status,
        budget: form.budget || undefined,
        location: form.location || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const campaign = await apiFetch<any>('/api/campaigns', { method: 'POST', body: payload });
      toast.success('Campaign created');
      router.push(`/brand/campaigns/${campaign.id}`);
    } catch (err: any) {
      toast.error(err?.error ?? 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
        <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
          {saving && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {saving ? 'Creating…' : 'Create Campaign'}
        </Button>
      </form>
    </div>
  );
}
