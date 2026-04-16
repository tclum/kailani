'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

export default function BrandDashboard() {
  const [stats, setStats] = useState<{ campaigns: number; open: number } | null>(null);
  const [profile, setProfile] = useState<{ brandName: string } | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/brands/me').catch(() => null),
      apiFetch<any>('/api/campaigns?limit=1').catch(() => null),
      apiFetch<any>('/api/campaigns?status=OPEN&limit=1').catch(() => null),
    ]).then(([p, all, open]) => {
      setProfile(p);
      setStats({ campaigns: all?.total ?? 0, open: open?.total ?? 0 });
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {profile ? `${profile.brandName} Dashboard` : 'Brand Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Campaigns" value={stats?.campaigns} />
        <StatCard label="Open Campaigns" value={stats?.open} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button asChild>
          <Link href="/brand/campaigns">My Campaigns</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/brand/discover">Discover Models</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/brand/inbox">Inbox</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value ?? '—'}</p>
      </CardContent>
    </Card>
  );
}
