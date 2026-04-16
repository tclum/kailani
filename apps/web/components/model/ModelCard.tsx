import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ModelCardProps {
  id: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  coverImage?: string | null;
  tags: string[];
  height?: number | null;
}

export function ModelCard({ id, displayName, bio, location, coverImage, tags, height }: ModelCardProps) {
  return (
    <Link href={`/brand/discover/${id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="aspect-[3/4] relative bg-muted">
          {coverImage ? (
            <Image src={coverImage} alt={displayName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
              {displayName[0]}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{displayName}</h3>
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
        </CardContent>
      </Card>
    </Link>
  );
}
