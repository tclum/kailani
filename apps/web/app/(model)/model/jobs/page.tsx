'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CampaignCard } from '@/components/brand/CampaignCard';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand } from '@kailani/types';

export default function ModelJobsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    apiFetch<any>('/api/campaigns?status=OPEN').then((r) => {
      setCampaigns(r.campaigns ?? []);
      setTotal(r.total ?? 0);
    });
  }, []);

  const filtered = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  async function apply(campaignId: string) {
    try {
      await apiFetch(`/api/campaigns/${campaignId}/apply`, {
        method: 'POST',
        body: { coverNote },
      });
      setApplying(null);
      setCoverNote('');
      setMessage({ id: campaignId, text: 'Applied successfully!' });
    } catch (err: any) {
      setMessage({ id: campaignId, text: err?.error ?? 'Application failed' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Open Campaigns</h1>
        <span className="text-muted-foreground text-sm">{total} available</span>
      </div>
      <Input
        placeholder="Search campaigns…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="space-y-2">
            <CampaignCard campaign={c} />
            {message?.id === c.id && (
              <p className="text-sm text-muted-foreground">{message.text}</p>
            )}
            {applying === c.id ? (
              <div className="space-y-2 border rounded-md p-3">
                <Textarea
                  placeholder="Cover note (optional)"
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => apply(c.id)}>Submit</Button>
                  <Button size="sm" variant="outline" onClick={() => setApplying(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => setApplying(c.id)}>
                Apply
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
