import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrandProfile as BrandProfileType } from '@kailani/types';

interface Props {
  profile: BrandProfileType;
}

export function BrandProfile({ profile }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex gap-6 items-start">
        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {profile.logoUrl ? (
            <Image src={profile.logoUrl} alt={profile.brandName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
              {profile.brandName[0]}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.brandName}</h1>
          {profile.industry && <p className="text-muted-foreground">{profile.industry}</p>}
          {profile.location && <p className="text-sm text-muted-foreground">{profile.location}</p>}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {profile.website}
            </a>
          )}
        </div>
      </div>
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
