'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrandProfile } from '@/components/brand/BrandProfile';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { StructuredReviewsSection } from '@/components/shared/StructuredReviewsSection';
import { ProfileActions } from '@/components/shared/ProfileActions';
import { OwnProfileBanner } from '@/components/shared/OwnProfileBanner';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { BrandProfile as BrandProfileType } from '@kailani/types';

function getInboxHref(role: string, threadId: string) {
  if (role === 'MODEL') return `/model/inbox?thread=${threadId}`;
  if (role === 'BRAND') return `/brand/inbox?thread=${threadId}`;
  if (role === 'PHOTOGRAPHER') return `/photographer/inbox?thread=${threadId}`;
  return `/brand/inbox?thread=${threadId}`;
}

export default function PublicBrandProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<BrandProfileType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<BrandProfileType>(`/api/brands/${id}`)
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

  if (notFound) return <p className="text-muted-foreground">Brand not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  const isOwnProfile = me?.userId === profile.userId;
  const displayName = profile.brandName;

  const brandCompleteness = [
    { label: 'Brand name', done: !!profile.brandName },
    { label: 'Bio', done: !!profile.bio },
    { label: 'Location', done: !!profile.location },
    { label: 'Logo', done: !!(profile.logoUrl || profile.profileImage) },
    { label: 'Industry', done: !!profile.industry },
    { label: 'Website', done: !!profile.website },
    { label: 'Instagram', done: !!profile.instagramUrl },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {isOwnProfile && (
        <OwnProfileBanner editHref="/brand/profile" completenessItems={brandCompleteness} />
      )}
      {me && !isOwnProfile && (
        <div className="flex justify-end gap-2">
          <Button onClick={handleMessage} disabled={messaging} className="flex items-center gap-2">
            <MessageSquare size={15} />
            {messaging ? 'Opening…' : 'Message'}
          </Button>
          <ProfileActions targetUserId={profile.userId} targetName={displayName} />
        </div>
      )}
      <BrandProfile profile={profile} />
      <Separator />
      <StructuredReviewsSection revieweeUserId={profile.userId} revieweeName={profile.brandName} />
      <Separator />
      <ReviewsSection revieweeUserId={profile.userId} />
    </div>
  );
}
