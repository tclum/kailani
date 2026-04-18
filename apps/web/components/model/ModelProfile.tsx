import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import type { ModelProfile as ModelProfileType } from '@kailani/types';

interface Props {
  profile: ModelProfileType & { user?: { verified?: boolean } | null };
}

export function ModelProfile({ profile }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex gap-6 items-start">
        <div className="w-48 h-64 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {profile.profileImage ? (
            <Image src={profile.profileImage} alt={profile.displayName} fill sizes="192px" className="object-cover" />
          ) : profile.coverImage ? (
            <Image src={profile.coverImage} alt={profile.displayName} fill sizes="192px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-muted-foreground">
              {profile.displayName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            {profile.user?.verified && <VerifiedBadge size="md" />}
          </div>
          {profile.location && <p className="text-muted-foreground">{profile.location}</p>}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
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

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            {profile.heightCm && <Stat label="Height" value={`${profile.heightCm} cm`} />}
            {profile.bustCm && <Stat label="Bust" value={`${profile.bustCm} cm`} />}
            {profile.waistCm && <Stat label="Waist" value={`${profile.waistCm} cm`} />}
            {profile.hipsCm && <Stat label="Hips" value={`${profile.hipsCm} cm`} />}
            {profile.shoeSize && <Stat label="Shoe" value={String(profile.shoeSize)} />}
            {profile.hairColor && <Stat label="Hair" value={profile.hairColor} />}
            {profile.eyeColor && <Stat label="Eyes" value={profile.eyeColor} />}
            {profile.skinTone && <Stat label="Skin" value={profile.skinTone} />}
          </dl>
        </CardContent>
      </Card>

      {profile.portfolioImages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.portfolioImages.map((url, i) => (
              <div key={i} className="aspect-square relative rounded-md overflow-hidden bg-muted">
                <Image src={url} alt={`Portfolio ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
