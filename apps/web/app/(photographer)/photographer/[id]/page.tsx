'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { StructuredReviewsSection } from '@/components/shared/StructuredReviewsSection';
import { ProfileActions } from '@/components/shared/ProfileActions';
import { ProfileSaveButton } from '@/components/shared/ProfileSaveButton';
import { OwnProfileBanner } from '@/components/shared/OwnProfileBanner';
import { PortfolioGallery } from '@/components/shared/PortfolioGallery';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { PhotographerProfile } from '@kailani/types';

function getInboxHref(role: string, threadId: string) {
  if (role === 'MODEL') return `/model/inbox?thread=${threadId}`;
  if (role === 'BRAND') return `/brand/inbox?thread=${threadId}`;
  if (role === 'PHOTOGRAPHER') return `/photographer/inbox?thread=${threadId}`;
  return `/photographer/inbox?thread=${threadId}`;
}

export default function PublicPhotographerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<PhotographerProfile>(`/api/photographers/${id}`)
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

  if (notFound) return <p className="text-muted-foreground">Photographer not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  const isOwnProfile = me?.userId === profile.userId;

  const photographerCompleteness = [
    { label: 'Display name', done: !!profile.displayName },
    { label: 'Bio', done: !!profile.bio },
    { label: 'Location', done: !!profile.location },
    { label: 'Profile photo', done: !!profile.profileImage },
    { label: 'Specialties', done: profile.specialties.length > 0 },
    { label: 'Portfolio images', done: profile.portfolioImages.length > 0 },
    { label: 'Rates', done: !!(profile.rates?.dayRate || profile.rates?.hourlyRate) },
    { label: 'Instagram', done: !!profile.instagramUrl },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {isOwnProfile && (
        <OwnProfileBanner editHref="/photographer/profile" completenessItems={photographerCompleteness} />
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

      <div className="flex gap-6 items-start">
        <div className="w-32 h-32 relative rounded-full overflow-hidden bg-muted flex-shrink-0">
          {profile.profileImage ? (
            <Image src={profile.profileImage} alt={profile.displayName} fill sizes="128px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
              {profile.displayName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
          {profile.location && <p className="text-muted-foreground mt-1">{profile.location}</p>}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
          {profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.specialties.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          )}
          {profile.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary mt-2 block hover:underline"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      {profile.rates && (
        <>
          <Separator />
          <Card>
            <CardHeader><CardTitle className="text-lg">Rates</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-4 text-sm">
                {profile.rates.dayRate != null && (
                  <div><dt className="text-muted-foreground">Full Day</dt><dd className="font-medium">${profile.rates.dayRate}</dd></div>
                )}
                {profile.rates.halfDayRate != null && (
                  <div><dt className="text-muted-foreground">Half Day</dt><dd className="font-medium">${profile.rates.halfDayRate}</dd></div>
                )}
                {profile.rates.hourlyRate != null && (
                  <div><dt className="text-muted-foreground">Hourly</dt><dd className="font-medium">${profile.rates.hourlyRate}</dd></div>
                )}
              </dl>
            </CardContent>
          </Card>
        </>
      )}

      {profile.portfolioImages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Portfolio</h2>
          <PortfolioGallery
            images={profile.portfolioImages}
            coverImage={profile.coverImage}
            profileName={profile.displayName}
            profileLocation={profile.location}
            tags={profile.specialties}
            updateUrl
          />
        </div>
      )}

      <Separator />
      <StructuredReviewsSection revieweeUserId={profile.userId} revieweeName={profile.displayName} />
      <Separator />
      <ReviewsSection revieweeUserId={profile.userId} />
    </div>
  );
}
