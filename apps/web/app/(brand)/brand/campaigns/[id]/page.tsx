'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand, ApplicationWithModel } from '@kailani/types';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  SHORTLISTED: 'default',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null);
  const [applications, setApplications] = useState<ApplicationWithModel[]>([]);

  useEffect(() => {
    apiFetch<CampaignWithBrand>(`/api/campaigns/${id}`).then(setCampaign);
    apiFetch<ApplicationWithModel[]>(`/api/campaigns/${id}/applications`).then(setApplications).catch(() => {});
  }, [id]);

  async function updateStatus(appId: string, status: string) {
    const updated = await apiFetch<any>(`/api/campaigns/applications/${appId}/status`, {
      method: 'PUT',
      body: { status },
    });
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: updated.status } : a)));
  }

  if (!campaign) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.brand.brandName}</p>
        </div>
        <Badge>{campaign.status}</Badge>
      </div>

      <p className="leading-relaxed">{campaign.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {campaign.location && <span>📍 {campaign.location}</span>}
        {campaign.budget && <span>💰 {campaign.budget}</span>}
        {campaign.startDate && <span>Start: {new Date(campaign.startDate).toLocaleDateString()}</span>}
        {campaign.endDate && <span>End: {new Date(campaign.endDate).toLocaleDateString()}</span>}
      </div>

      {campaign.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {campaign.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}

      <Separator />

      <h2 className="text-xl font-semibold">Applications ({applications.length})</h2>
      {applications.length === 0 ? (
        <p className="text-muted-foreground">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-12 h-12 relative rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {app.model.coverImage ? (
                    <Image src={app.model.coverImage} alt={app.model.displayName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {app.model.displayName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{app.model.displayName}</span>
                    <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                  </div>
                  {app.model.location && <p className="text-sm text-muted-foreground">{app.model.location}</p>}
                  {app.coverNote && <p className="text-sm mt-1">{app.coverNote}</p>}
                  <div className="flex gap-2 mt-2">
                    {(['SHORTLISTED', 'ACCEPTED', 'REJECTED'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={app.status === s ? 'default' : 'outline'}
                        onClick={() => updateStatus(app.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
