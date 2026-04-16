'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  profile: { displayName: string; coverImage?: string } | null;
  openCampaigns: number;
}

export default function ModelDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/models/me').catch(() => null),
      apiFetch<any>('/api/campaigns?status=OPEN&limit=1'),
    ]).then(([profile, campaigns]) => {
      setData({ profile, openCampaigns: campaigns?.total ?? 0 });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {data?.profile ? `Hi, ${data.profile.displayName}` : 'Model Dashboard'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.openCampaigns ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/model/jobs">Browse Campaigns</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/model/profile">Edit Profile</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/model/portfolio">Portfolio</Link>
        </Button>
      </div>
    </div>
  );
}
