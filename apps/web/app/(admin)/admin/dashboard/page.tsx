'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch<Stats>('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  const tiles = [
    { label: 'Total Users', key: 'totalUsers' },
    { label: 'Models', key: 'models' },
    { label: 'Brands', key: 'brands' },
    { label: 'Campaigns', key: 'campaigns' },
    { label: 'Applications', key: 'applications' },
    { label: 'Pending Approvals', key: 'pendingApprovals' },
    { label: 'Open Campaigns', key: 'openCampaigns' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ label, key }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats ? stats[key] : '—'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button asChild><Link href="/admin/users">Manage Users</Link></Button>
        <Button variant="outline" asChild><Link href="/admin/approvals">Approvals</Link></Button>
        <Button variant="outline" asChild><Link href="/admin/analytics">Analytics</Link></Button>
      </div>
    </div>
  );
}
