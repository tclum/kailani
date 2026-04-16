export type CampaignStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  budget?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  tags: string[];
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithBrand extends Campaign {
  brand: {
    id: string;
    brandName: string;
    logoUrl?: string;
    location?: string;
  };
}

export interface Application {
  id: string;
  campaignId: string;
  modelId: string;
  coverNote?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithModel extends Application {
  model: {
    id: string;
    displayName: string;
    coverImage?: string;
    location?: string;
    tags: string[];
  };
}
