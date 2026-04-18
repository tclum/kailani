'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Trash2, GripVertical, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PortfolioState {
  images: string[];
  coverImage: string | null;
}

export default function PhotographerPortfolioPage() {
  const [state, setState] = useState<PortfolioState>({ images: [], coverImage: null });
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    apiFetch<any>('/api/photographers/me').then((p) => {
      if (!p) return;
      setState({ images: p.portfolioImages ?? [], coverImage: p.coverImage ?? null });
    }).catch(() => {});
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/photographers/me/portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return; }
      setState((prev) => ({ ...prev, images: [...prev.images, data.url] }));
      toast.success('Photo uploaded');
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(url: string) {
    try {
      await apiFetch('/api/photographers/me/portfolio', { method: 'DELETE', body: { url } });
      setState((prev) => ({
        images: prev.images.filter((u) => u !== url),
        coverImage: prev.coverImage === url ? null : prev.coverImage,
      }));
      toast.success('Photo deleted');
    } catch {
      toast.error('Delete failed — please try again');
    }
  }

  async function handleSetCover(url: string) {
    try {
      const updated = await apiFetch<any>('/api/photographers/me', {
        method: 'PUT',
        body: { coverImage: url },
      });
      setState((prev) => ({ ...prev, coverImage: updated.coverImage ?? url }));
      toast.success('Cover photo updated');
    } catch {
      toast.error('Failed to set cover photo');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = state.images.indexOf(active.id as string);
    const newIndex = state.images.indexOf(over.id as string);
    const newImages = arrayMove(state.images, oldIndex, newIndex);
    setState((prev) => ({ ...prev, images: newImages }));
    try {
      await apiFetch('/api/photographers/me', { method: 'PUT', body: { portfolioImages: newImages } });
    } catch {
      toast.error('Failed to save new order');
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag to reorder · ★ to set cover · trash to delete</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={state.images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {state.images.map((url) => (
              <SortableImage
                key={url}
                url={url}
                isCover={state.coverImage === url}
                onDelete={handleDelete}
                onSetCover={handleSetCover}
              />
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-pink-400 hover:bg-pink-50/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-pink-500 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={28} className="animate-spin" /> : <Plus size={28} />}
              <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Add photo'}</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {state.images.length === 0 && !uploading && (
        <p className="text-center text-muted-foreground text-sm py-8">
          No portfolio images yet. Click &quot;Add photo&quot; to upload your first image.
        </p>
      )}
    </div>
  );
}

function SortableImage({ url, isCover, onDelete, onSetCover }: {
  url: string; isCover: boolean;
  onDelete: (url: string) => void; onSetCover: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined };

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
      <Image src={url} alt="Portfolio" fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" />
      {isCover && (
        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star size={10} fill="currentColor" /> Cover
        </div>
      )}
      <div {...attributes} {...listeners} className="absolute top-2 right-2 bg-black/50 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onSetCover(url)}
          disabled={isCover}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium text-white bg-white/20 hover:bg-yellow-400/80 hover:text-yellow-900 disabled:opacity-40 transition-colors"
        >
          <Star size={12} fill={isCover ? 'currentColor' : 'none'} /> Cover
        </button>
        <button
          type="button"
          onClick={() => onDelete(url)}
          className="flex items-center justify-center w-8 rounded-lg bg-white/20 hover:bg-red-500 text-white transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
