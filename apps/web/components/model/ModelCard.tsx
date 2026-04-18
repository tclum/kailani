'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ProfileSaveButton } from '@/components/shared/ProfileSaveButton';
import { getCurrentUser } from '@/lib/auth';

interface ModelCardProps {
  id: string;
  userId?: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  coverImage?: string | null;
  profileImage?: string | null;
  tags: string[];
  height?: number | null;
  user?: { verified?: boolean } | null;
  build?: string | null;
  playingAgeMin?: number | null;
  playingAgeMax?: number | null;
  unionStatus?: string | null;
}

export function ModelCard({ id, userId, displayName, bio, location, coverImage, profileImage, tags, height, user, build, playingAgeMin, playingAgeMax, unionStatus }: ModelCardProps) {
  const image = profileImage ?? coverImage;
  const me = getCurrentUser();
  const showSave = me?.role === 'BRAND' && userId;

  return (
    <div className="relative">
      <Link href={`/model/${userId ?? id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="aspect-[3/4] relative bg-muted">
            {image ? (
              <Image src={image} alt={displayName} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
                {displayName[0]}
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <h3 className="font-semibold text-lg leading-tight">{displayName}</h3>
              {user?.verified && <VerifiedBadge />}
            </div>
            {location && <p className="text-sm text-muted-foreground">{location}</p>}
            {height && <p className="text-sm text-muted-foreground">{height} cm</p>}
            {bio && <p className="text-sm mt-1 line-clamp-2">{bio}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
            {(build || playingAgeMin || unionStatus) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {build && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{build}</span>}
                {playingAgeMin && playingAgeMax && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    Age {playingAgeMin}–{playingAgeMax}
                  </span>
                )}
                {unionStatus && unionStatus !== 'Non-Union' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{unionStatus}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      {showSave && (
        <div className="absolute top-2 right-2">
          <ProfileSaveButton targetUserId={userId!} />
        </div>
      )}
    </div>
  );
}
