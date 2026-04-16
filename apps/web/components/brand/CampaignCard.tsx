import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampaignWithBrand } from '@kailani/types';

interface Props {
  campaign: CampaignWithBrand;
  href?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  OPEN: 'default',
  CLOSED: 'outline',
  COMPLETED: 'outline',
};

export function CampaignCard({ campaign, href }: Props) {
  const card = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{campaign.title}</CardTitle>
          <Badge variant={statusColors[campaign.status] as any}>{campaign.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{campaign.brand.brandName}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-2 mb-3">{campaign.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {campaign.location && <span>📍 {campaign.location}</span>}
          {campaign.budget && <span>💰 {campaign.budget}</span>}
          {campaign.startDate && (
            <span>📅 {new Date(campaign.startDate).toLocaleDateString()}</span>
          )}
        </div>
        {campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {campaign.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
