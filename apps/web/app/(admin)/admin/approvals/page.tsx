'use client';
import { useEffect, useState } from 'react';
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
  modelProfile: { displayName: string } | null;
  brandProfile: { brandName: string } | null;
}

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    apiFetch<UserRow[]>('/api/admin/users')
      .then((all) => setUsers(all.filter((u) => !u.approved)))
      .catch(() => {});
  }, []);

  async function approve(id: string) {
    await apiFetch(`/api/admin/users/${id}/approve`, { method: 'PUT' });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Pending Approvals ({users.length})</h1>
      {users.length === 0 && <p className="text-muted-foreground">No pending approvals.</p>}
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">
                {u.modelProfile?.displayName ?? u.brandProfile?.brandName ?? u.email}
              </p>
              <p className="text-sm text-muted-foreground">{u.email}</p>
              <Badge variant="outline" className="mt-1">{u.role}</Badge>
            </div>
            <Button size="sm" onClick={() => approve(u.id)}>Approve</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
