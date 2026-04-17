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
  _count?: { applications: number };
}

export interface CampaignWithBrand extends Campaign {
  brand: {
    id: string;
    brandName: string;
    logoUrl?: string | null;
    profileImage?: string | null;
    location?: string | null;
    website?: string | null;
    instagramUrl?: string | null;
    userId?: string;
  };
}

export interface Application {
  id: string;
  campaignId: string;
  modelId: string;
  coverNote?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithModel extends Application {
  model: {
    id: string;
    userId: string;
    displayName: string;
    profileImage?: string | null;
    coverImage?: string | null;
    portfolioImages: string[];
    location?: string | null;
    tags: string[];
    heightCm?: number | null;
    bustCm?: number | null;
    waistCm?: number | null;
    hipsCm?: number | null;
    bio?: string | null;
    user?: { id: string } | null;
  };
}

export interface ApplicationWithCampaign extends Application {
  campaign: CampaignWithBrand;
}
