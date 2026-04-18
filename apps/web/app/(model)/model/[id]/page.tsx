'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ModelProfile } from '@/components/model/ModelProfile';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { StructuredReviewsSection } from '@/components/shared/StructuredReviewsSection';
import { ProfileActions } from '@/components/shared/ProfileActions';
import { ProfileSaveButton } from '@/components/shared/ProfileSaveButton';
import { OwnProfileBanner } from '@/components/shared/OwnProfileBanner';
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

  const modelCompleteness = [
    { label: 'Display name', done: !!profile.displayName },
    { label: 'Bio', done: !!profile.bio },
    { label: 'Location', done: !!profile.location },
    { label: 'Profile photo', done: !!profile.profileImage },
    { label: 'Tags', done: profile.tags.length > 0 },
    { label: 'Portfolio images', done: profile.portfolioImages.length > 0 },
    { label: 'Measurements', done: !!profile.heightCm },
    { label: 'Rates', done: !!(profile.rates?.dayRate || profile.rates?.hourlyRate) },
    { label: 'Instagram', done: !!profile.instagramUrl },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {isOwnProfile && (
        <OwnProfileBanner editHref="/model/profile" completenessItems={modelCompleteness} />
      )}
      {me && !isOwnProfile && (
        <div className="flex justify-end gap-2">
          {me.role === 'BRAND' && <ProfileSaveButton targetUserId={profile.userId} />}
          <Button onClick={handleMessage} disabled={messaging} className="flex items-center gap-2">
            <MessageSquare size={15} />
            {messaging ? 'Opening…' : 'Message'}
          </Button>
          <ProfileActions targetUserId={profile.userId} targetName={profile.displayName} />
        </div>
      )}
      <ModelProfile profile={profile} />
      <Separator />
      <StructuredReviewsSection revieweeUserId={profile.userId} revieweeName={profile.displayName} />
      <Separator />
      <ReviewsSection revieweeUserId={profile.userId} />
    </div>
  );
}
