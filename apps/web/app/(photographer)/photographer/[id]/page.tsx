'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { MessageSquare, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { StructuredReviewsSection } from '@/components/shared/StructuredReviewsSection';
import { ProfileActions } from '@/components/shared/ProfileActions';
import { ProfileSaveButton } from '@/components/shared/ProfileSaveButton';
import { OwnProfileBanner } from '@/components/shared/OwnProfileBanner';
import { ProfilePortfolioPanel } from '@/components/shared/ProfilePortfolioPanel';
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
  const [showMobilePortfolio, setShowMobilePortfolio] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<PhotographerProfile>(`/api/photographers/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleMessage() {
    if (!profile || !me) return;
    try {
      const thread = await apiFetch<{ id: string }>('/api/threads', {
        method: 'POST',
        body: { recipientId: profile.userId },
      });
      router.push(getInboxHref(me.role, thread.id));
    } catch { /* ignore */ }
  }

  if (notFound) return <p className="text-muted-foreground">Photographer not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  const isOwnProfile = me?.userId === profile.userId;
  const isBrandViewer = me?.role === 'BRAND' && !isOwnProfile;

  const photographerCompleteness = [
    { label: 'Display name',    done: !!profile.displayName },
    { label: 'Bio',             done: !!profile.bio },
    { label: 'Location',        done: !!profile.location },
    { label: 'Profile photo',   done: !!profile.profileImage },
    { label: 'Specialties',     done: profile.specialties.length > 0 },
    { label: 'Portfolio images', done: profile.portfolioImages.length > 0 },
    { label: 'Rates',           done: !!(profile.rates?.dayRate || profile.rates?.hourlyRate) },
    { label: 'Instagram',       done: !!profile.instagramUrl },
  ];

  const hasPortfolio = profile.portfolioImages.length > 0;

  return (
    <div className="flex items-start -mt-8 min-h-[calc(100vh-4rem)]">

      {/* ── Left column: profile info ── */}
      <div className="flex-[55] min-w-0 pt-8 pr-0 lg:pr-6 pb-16 space-y-6">

        {isOwnProfile && (
          <OwnProfileBanner editHref="/photographer/profile" completenessItems={photographerCompleteness} />
        )}

        {/* Desktop action bar */}
        {me && !isOwnProfile && (
          <div className="hidden lg:flex justify-end gap-2">
            {isBrandViewer && <ProfileSaveButton targetUserId={profile.userId} />}
            <Button onClick={handleMessage} className="flex items-center gap-2">
              <MessageSquare size={15} /> Message
            </Button>
            <ProfileActions targetUserId={profile.userId} targetName={profile.displayName} />
          </div>
        )}

        {/* Mobile action bar */}
        {me && !isOwnProfile && (
          <div className="flex lg:hidden gap-2 flex-wrap">
            {isBrandViewer && <ProfileSaveButton targetUserId={profile.userId} />}
            <Button onClick={handleMessage} size="sm" className="flex items-center gap-1.5">
              <MessageSquare size={14} /> Message
            </Button>
            {hasPortfolio && (
              <Button variant="outline" size="sm" onClick={() => setShowMobilePortfolio(true)} className="flex items-center gap-1.5">
                <Camera size={14} /> Portfolio ({profile.portfolioImages.length})
              </Button>
            )}
            <ProfileActions targetUserId={profile.userId} targetName={profile.displayName} />
          </div>
        )}

        {/* Mobile portfolio button for own profile */}
        {isOwnProfile && hasPortfolio && (
          <div className="flex lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setShowMobilePortfolio(true)} className="flex items-center gap-1.5">
              <Camera size={14} /> View Portfolio ({profile.portfolioImages.length})
            </Button>
          </div>
        )}

        {/* Profile header */}
        <div className="flex gap-5 items-start">
          <div className="w-28 h-28 relative rounded-full overflow-hidden bg-muted flex-shrink-0">
            {profile.profileImage ? (
              <Image src={profile.profileImage} alt={profile.displayName} fill sizes="112px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
                {profile.displayName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
            {profile.location && <p className="text-muted-foreground text-sm mt-0.5">{profile.location}</p>}
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

        {/* Rates */}
        {profile.rates && (
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
        )}

        <Separator />
        <StructuredReviewsSection revieweeUserId={profile.userId} revieweeName={profile.displayName} />
        <Separator />
        <ReviewsSection revieweeUserId={profile.userId} />
      </div>

      {/* ── Right column: portfolio panel, desktop only ── */}
      {hasPortfolio && (
        <div className="hidden lg:flex flex-[45] flex-col sticky top-16 h-[calc(100vh-4rem)] border-l border-border overflow-hidden">
          <ProfilePortfolioPanel
            images={profile.portfolioImages}
            coverImage={profile.coverImage}
            displayName={profile.displayName}
            isOwnProfile={isOwnProfile}
            isBrandViewer={isBrandViewer}
            editPortfolioHref="/photographer/portfolio"
            onMessage={handleMessage}
            onSave={undefined}
          />
        </div>
      )}

      {/* ── Mobile full-screen portfolio overlay ── */}
      {showMobilePortfolio && hasPortfolio && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
            <p className="font-semibold">Portfolio</p>
            <button onClick={() => setShowMobilePortfolio(false)}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProfilePortfolioPanel
              images={profile.portfolioImages}
              coverImage={profile.coverImage}
              displayName={profile.displayName}
              isOwnProfile={isOwnProfile}
              isBrandViewer={isBrandViewer}
              editPortfolioHref="/photographer/portfolio"
              onMessage={handleMessage}
              onSave={undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
