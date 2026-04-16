'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BrandProfile } from '@/components/brand/BrandProfile';
import { apiFetch } from '@/lib/api';
import type { BrandProfile as BrandProfileType } from '@kailani/types';

export default function PublicBrandProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<BrandProfileType | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch<BrandProfileType>(`/api/brands/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="text-muted-foreground">Brand not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  return <BrandProfile profile={profile} />;
}
