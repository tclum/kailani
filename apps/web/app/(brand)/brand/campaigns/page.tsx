'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CampaignCard } from '@/components/brand/CampaignCard';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand } from '@kailani/types';

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([]);

  useEffect(() => {
    apiFetch<any>('/api/campaigns').then((r) => setCampaigns(r.campaigns ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button asChild>
          <Link href="/brand/campaigns/new">New Campaign</Link>
        </Button>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} href={`/brand/campaigns/${c.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
