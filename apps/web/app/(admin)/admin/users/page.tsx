'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
  modelProfile: { id: string; displayName: string } | null;
  brandProfile: { id: string; brandName: string } | null;
  photographerProfile: { id: string; displayName: string } | null;
}

function profileLink(u: UserRow): string | null {
  if (u.modelProfile) return `/model/${u.modelProfile.id}`;
  if (u.brandProfile) return `/brand/${u.brandProfile.id}`;
  if (u.photographerProfile) return `/photographer/${u.photographerProfile.id}`;
  return null;
}

function displayName(u: UserRow): string {
  return (
    u.modelProfile?.displayName ??
    u.brandProfile?.brandName ??
    u.photographerProfile?.displayName ??
    u.email
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    apiFetch<UserRow[]>('/api/admin/users').then(setUsers).catch(() => {});
  }, []);

  async function approve(id: string) {
    await apiFetch(`/api/admin/users/${id}/approve`, { method: 'PUT' });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, approved: true } : u)));
  }

  async function remove(id: string) {
    if (!confirm('Delete this user?')) return;
    await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Users ({users.length})</h1>
      {users.map((u) => {
        const link = profileLink(u);
        const nameEl = (
          <p className="font-medium">{displayName(u)}</p>
        );
        return (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                {link ? (
                  <Link href={link} className="hover:underline">
                    {nameEl}
                  </Link>
                ) : nameEl}
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{u.role}</Badge>
                  {u.approved ? (
                    <Badge variant="default">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {link && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={link}>View Profile</Link>
                  </Button>
                )}
                {!u.approved && (
                  <Button size="sm" onClick={() => approve(u.id)}>Approve</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
