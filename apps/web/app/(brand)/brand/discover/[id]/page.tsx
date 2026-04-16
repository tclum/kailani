'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModelProfile } from '@/components/model/ModelProfile';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { ModelProfile as ModelProfileType } from '@kailani/types';

export default function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ModelProfileType | null>(null);

  useEffect(() => {
    apiFetch<ModelProfileType>(`/api/models/${id}`).then(setProfile);
  }, [id]);

  async function startConversation() {
    if (!profile) return;
    const thread = await apiFetch<any>('/api/threads', {
      method: 'POST',
      body: { recipientId: profile.userId },
    });
    router.push(`/brand/inbox?thread=${thread.id}`);
  }

  if (!profile) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <ModelProfile profile={profile} />
      <Button onClick={startConversation}>Message</Button>
    </div>
  );
}
