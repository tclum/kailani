'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PortfolioPage() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<any>('/api/models/me').then((p) => {
      if (p?.portfolioImages) setImages(p.portfolioImages);
    }).catch(() => {});
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[portfolio] upload triggered:', { name: file.name, type: file.type, size: file.size });
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/models/me/portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }
      setImages((prev) => [...prev, data.url]);
    } catch (err) {
      console.error('[portfolio] upload error:', err);
      setError('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Button onClick={() => { console.log('[portfolio] button clicked, ref:', !!inputRef.current); inputRef.current?.click(); }} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload Image'}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {images.length === 0 ? (
        <p className="text-muted-foreground">No portfolio images yet. Upload your first image.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square relative">
                <Image src={url} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
