'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, PenSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface AuthorInfo {
  id: string;
  role: string;
  modelProfile: { displayName: string; profileImage?: string | null } | null;
  brandProfile: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null;
  photographerProfile: { displayName: string; profileImage?: string | null } | null;
}

interface Post {
  id: string;
  content: string;
  isPublic: boolean;
  responseDeadline: string;
  subjectResponse?: string | null;
  createdAt: string;
  author: AuthorInfo;
  campaign: { id: string; title: string; brand: { brandName: string } };
}

interface FeedData {
  posts: Post[];
  myPending: Post[];
  eligibleCampaigns: { id: string; title: string }[];
}

function getAuthorName(a: AuthorInfo) {
  return a.modelProfile?.displayName ?? a.brandProfile?.brandName ?? a.photographerProfile?.displayName ?? 'User';
}

function getAuthorImage(a: AuthorInfo): string | null {
  return a.modelProfile?.profileImage ?? a.brandProfile?.profileImage ?? a.brandProfile?.logoUrl ?? a.photographerProfile?.profileImage ?? null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expiring soon';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const ROLE_COLORS: Record<string, string> = {
  MODEL: 'bg-pink-100 text-pink-700',
  BRAND: 'bg-purple-100 text-purple-700',
  PHOTOGRAPHER: 'bg-teal-100 text-teal-700',
};

// ─── New post modal ───────────────────────────────────────────────────────────
function NewPostModal({ campaigns, onSubmit, onCancel }: {
  campaigns: { id: string; title: string }[];
  onSubmit: (campaignId: string, content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!content.trim() || !campaignId) { setError('Select a campaign and write your post'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(campaignId, content.trim());
    } catch (err: any) {
      setError(err?.error ?? 'Failed to post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="font-bold text-lg">Share your experience</h2>
          <p className="text-sm text-muted-foreground">Your post will be shared privately for 48 hours before going public.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Campaign</label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your experience</label>
            <span className="text-xs text-muted-foreground">{content.length}/1000</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="Describe what it was like working on this campaign…"
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={submit}
            disabled={loading || !content.trim()}
            className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? 'Sharing…' : 'Share Experience'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, isPending, onRespond }: {
  post: Post;
  isPending?: boolean;
  onRespond?: (id: string, text: string) => void;
}) {
  const name = getAuthorName(post.author);
  const img = getAuthorImage(post.author);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const [expanded, setExpanded] = useState(false);
  const [respondText, setRespondText] = useState('');
  const [responding, setResponding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const MAX_LEN = 240;
  const isLong = post.content.length > MAX_LEN;

  async function submitResponse() {
    if (!respondText.trim() || !onRespond) return;
    setResponding(true);
    try {
      await apiFetch(`/api/working-together/${post.id}/respond`, {
        method: 'POST',
        body: { response: respondText.trim() },
      });
      onRespond(post.id, respondText.trim());
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${isPending ? 'border-amber-200 bg-amber-50/20' : ''}`}>
      {isPending && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 font-medium flex items-center gap-1.5">
          <Clock size={11} /> Goes public in {timeUntil(post.responseDeadline)} — only visible to you right now
        </div>
      )}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
            style={{ background: img ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {img ? <Image src={img} alt={name} width={40} height={40} className="object-cover w-full h-full" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{name}</span>
              <Badge className={`text-[10px] px-1.5 py-0 capitalize ${ROLE_COLORS[post.author.role] ?? ''}`} variant="secondary">
                {post.author.role.toLowerCase()}
              </Badge>
            </div>
            <Link href={`/campaigns/${post.campaign.id}`} className="text-xs text-muted-foreground hover:text-pink-600 transition-colors">
              {post.campaign.title} · {post.campaign.brand.brandName}
            </Link>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Content */}
        <div>
          <p className="text-sm leading-relaxed">
            {isLong && !expanded ? post.content.slice(0, MAX_LEN) + '…' : post.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-pink-600 hover:text-pink-700 mt-1 flex items-center gap-0.5 transition-colors"
            >
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          )}
        </div>

        {/* Subject response */}
        {post.subjectResponse && (
          <div className="rounded-xl bg-muted/60 px-4 py-3 border-l-4 border-pink-300">
            <p className="text-xs font-semibold text-pink-600 mb-1">Response</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.subjectResponse}</p>
          </div>
        )}

        {/* Respond button (for non-author participants) */}
        {onRespond && !post.subjectResponse && (
          <div className="space-y-2">
            {!showInput ? (
              <button onClick={() => setShowInput(true)} className="text-xs font-medium text-pink-600 hover:text-pink-700 transition-colors">
                + Add your perspective
              </button>
            ) : (
              <>
                <textarea
                  value={respondText}
                  onChange={(e) => setRespondText(e.target.value)}
                  placeholder="Share your perspective on this experience…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowInput(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">Cancel</button>
                  <button
                    onClick={submitResponse}
                    disabled={responding || !respondText.trim()}
                    className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    {responding ? 'Saving…' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const me = getCurrentUser();

  const load = useCallback(async () => {
    apiFetch<FeedData>('/api/working-together')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createPost(campaignId: string, content: string) {
    await apiFetch('/api/working-together', { method: 'POST', body: { campaignId, content } });
    setShowNewPost(false);
    load();
  }

  function handleResponded(postId: string, text: string) {
    setData((prev) => prev ? {
      ...prev,
      posts: prev.posts.map((p) => p.id === postId ? { ...p, subjectResponse: text } : p),
    } : prev);
  }

  const allPosts = data ? [...(data.myPending ?? []), ...data.posts] : [];

  return (
    <>
      {showNewPost && data && data.eligibleCampaigns.length > 0 && (
        <NewPostModal
          campaigns={data.eligibleCampaigns}
          onSubmit={createPost}
          onCancel={() => setShowNewPost(false)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
            >
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community</h1>
              <p className="text-sm text-muted-foreground">Experiences from verified collaborations</p>
            </div>
          </div>
          {me && data && data.eligibleCampaigns.length > 0 && (
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
            >
              <PenSquare size={15} />
              Share experience
            </button>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center">
              <Users size={28} className="text-pink-400" />
            </div>
            <div>
              <p className="font-semibold text-lg">Nothing here yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">Be the first to share your experience working with the Kailani community</p>
            </div>
            {me && data && data.eligibleCampaigns.length > 0 && (
              <button
                onClick={() => setShowNewPost(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                <PenSquare size={15} /> Share your first experience
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map((post) => {
              const isPending = !post.isPublic;
              const isMyPost = post.author.id === me?.userId;
              const canRespond = !isMyPost && !isPending && new Date(post.responseDeadline) > new Date();
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  isPending={isPending}
                  onRespond={canRespond ? handleResponded : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
