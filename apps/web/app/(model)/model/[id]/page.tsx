'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelProfile } from '@/components/model/ModelProfile';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { ModelProfile as ModelProfileType } from '@kailani/types';

function getInboxHref(role: string, threadId: string) {
  if (role === 'MODEL') return `/model/inbox?thread=${threadId}`;
  if (role === 'BRAND') return `/brand/inbox?thread=${threadId}`;
  if (role === 'PHOTOGRAPHER') return `/photographer/inbox?thread=${threadId}`;
  return `/model/inbox?thread=${threadId}`;
}

export default function PublicModelProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ModelProfileType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<ModelProfileType>(`/api/models/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleMessage() {
    if (!profile || !me) return;
    setMessaging(true);
    try {
      const thread = await apiFetch<{ id: string }>('/api/threads', {
        method: 'POST',
        body: { recipientId: profile.userId },
      });
      router.push(getInboxHref(me.role, thread.id));
    } catch {
      setMessaging(false);
    }
  }

  if (notFound) return <p className="text-muted-foreground">Model not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  const isOwnProfile = me?.userId === profile.userId;

  return (
    <div className="max-w-3xl space-y-6">
      {me && !isOwnProfile && (
        <div className="flex justify-end">
          <Button onClick={handleMessage} disabled={messaging} className="flex items-center gap-2">
            <MessageSquare size={15} />
            {messaging ? 'Opening…' : 'Message'}
          </Button>
        </div>
      )}
      <ModelProfile profile={profile} />
    </div>
  );
}
