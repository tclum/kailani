'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ModelProfile } from '@/components/model/ModelProfile';
import { ReviewsSection } from '@/components/shared/ReviewsSection';
import { StructuredReviewsSection } from '@/components/shared/StructuredReviewsSection';
import { ProfileActions } from '@/components/shared/ProfileActions';
import { ProfileSaveButton } from '@/components/shared/ProfileSaveButton';
import { OwnProfileBanner } from '@/components/shared/OwnProfileBanner';
import { ProfilePortfolioPanel } from '@/components/shared/ProfilePortfolioPanel';
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
  const [showMobilePortfolio, setShowMobilePortfolio] = useState(false);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<ModelProfileType>(`/api/models/${id}`)
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

  if (notFound) return <p className="text-muted-foreground">Model not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  const isOwnProfile = me?.userId === profile.userId;
  const isBrandViewer = me?.role === 'BRAND' && !isOwnProfile;

  const modelCompleteness = [
    { label: 'Display name',   done: !!profile.displayName },
    { label: 'Bio',            done: !!profile.bio },
    { label: 'Location',       done: !!profile.location },
    { label: 'Profile photo',  done: !!profile.profileImage },
    { label: 'Tags',           done: profile.tags.length > 0 },
    { label: 'Portfolio images', done: profile.portfolioImages.length > 0 },
    { label: 'Measurements',   done: !!profile.heightCm },
    { label: 'Rates',          done: !!(profile.rates?.dayRate || profile.rates?.hourlyRate) },
    { label: 'Instagram',      done: !!profile.instagramUrl },
  ];

  const hasPortfolio = profile.portfolioImages.length > 0;

  return (
    // Break out of the layout's py-8 top padding for the sticky panel; use -mt-8 + pt-8 on left col
    <div className="flex items-start -mt-8 min-h-[calc(100vh-4rem)]">

      {/* ── Left column: profile info (scrolls normally) ── */}
      <div className="flex-[55] min-w-0 pt-8 pr-0 lg:pr-6 pb-16">

        {isOwnProfile && (
          <OwnProfileBanner editHref="/model/profile" completenessItems={modelCompleteness} />
        )}

        {/* Action buttons — non-owners only, desktop */}
        {me && !isOwnProfile && (
          <div className="hidden lg:flex justify-end gap-2 mb-4">
            {isBrandViewer && <ProfileSaveButton targetUserId={profile.userId} />}
            <Button onClick={handleMessage} className="flex items-center gap-2">
              <MessageSquare size={15} /> Message
            </Button>
            <ProfileActions targetUserId={profile.userId} targetName={profile.displayName} />
          </div>
        )}

        {/* Mobile: action bar */}
        {me && !isOwnProfile && (
          <div className="flex lg:hidden gap-2 mb-4 flex-wrap">
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
          <div className="flex lg:hidden mb-4">
            <Button variant="outline" size="sm" onClick={() => setShowMobilePortfolio(true)} className="flex items-center gap-1.5">
              <Camera size={14} /> View Portfolio ({profile.portfolioImages.length})
            </Button>
          </div>
        )}

        <ModelProfile profile={profile} hidePortfolio />
        <Separator className="mt-6" />
        <StructuredReviewsSection revieweeUserId={profile.userId} revieweeName={profile.displayName} />
        <Separator className="mt-6" />
        <ReviewsSection revieweeUserId={profile.userId} />
      </div>

      {/* ── Right column: portfolio panel, always visible on desktop ── */}
      {hasPortfolio && (
        <div className="hidden lg:flex flex-[45] flex-col sticky top-16 h-[calc(100vh-4rem)] border-l border-border overflow-hidden">
          <ProfilePortfolioPanel
            images={profile.portfolioImages}
            coverImage={profile.coverImage}
            displayName={profile.displayName}
            isOwnProfile={isOwnProfile}
            isBrandViewer={isBrandViewer}
            editPortfolioHref="/model/portfolio"
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
              editPortfolioHref="/model/portfolio"
              onMessage={handleMessage}
              onSave={undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
