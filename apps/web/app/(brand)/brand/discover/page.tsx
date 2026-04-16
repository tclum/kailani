'use client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ModelCard } from '@/components/model/ModelCard';
import { apiFetch } from '@/lib/api';

interface ModelSummary {
  id: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  coverImage?: string | null;
  tags: string[];
  height?: number | null;
}

export default function DiscoverPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    apiFetch<any>('/api/models').then((r) => {
      setModels(r.profiles ?? []);
      setTotal(r.total ?? 0);
    });
  }, []);

  const filtered = models.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (m.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discover Models</h1>
        <span className="text-muted-foreground text-sm">{total} models</span>
      </div>
      <Input
        placeholder="Search by name, location, or tag…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No models found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <ModelCard key={m.id} {...m} />
          ))}
        </div>
      )}
    </div>
  );
}
