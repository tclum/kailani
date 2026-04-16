'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModelProfile } from '@/components/model/ModelProfile';
import { apiFetch } from '@/lib/api';
import type { ModelProfile as ModelProfileType } from '@kailani/types';

export default function PublicModelProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ModelProfileType | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch<ModelProfileType>(`/api/models/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="text-muted-foreground">Model not found.</p>;
  if (!profile) return <p className="text-muted-foreground">Loading…</p>;

  return <ModelProfile profile={profile} />;
}
