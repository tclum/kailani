'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface Stats {
  totalUsers: number;
  models: number;
  brands: number;
  campaigns: number;
  applications: number;
  pendingApprovals: number;
  openCampaigns: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch<Stats>('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  if (!stats) return <p className="text-muted-foreground">Loading…</p>;

  const metrics = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Models', value: stats.models },
    { label: 'Brands', value: stats.brands },
    { label: 'Total Campaigns', value: stats.campaigns },
    { label: 'Open Campaigns', value: stats.openCampaigns },
    { label: 'Total Applications', value: stats.applications },
    { label: 'Pending Approvals', value: stats.pendingApprovals },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
