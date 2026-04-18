'use client';
import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { PageTransition } from '@/components/shared/PageTransition';
import { SkeletonCard } from '@/components/shared/Skeleton';

type NewsCategory = 'ALL' | 'fashion' | 'beauty' | 'business' | 'photography';

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

const CATEGORIES: { key: NewsCategory; label: string; query: string }[] = [
  { key: 'ALL',         label: 'All',         query: 'fashion industry OR modeling OR runway' },
  { key: 'fashion',     label: 'Fashion',      query: 'fashion week OR runway show OR designer collection' },
  { key: 'beauty',      label: 'Beauty',       query: 'beauty industry OR makeup trends OR skincare brand' },
  { key: 'business',    label: 'Business',     query: 'fashion business OR modeling agency OR brand campaign' },
  { key: 'photography', label: 'Photography',  query: 'fashion photography OR editorial shoot' },
];

// Fallback articles shown when API is unavailable
const PLACEHOLDER_ARTICLES: NewsArticle[] = [
  {
    title: 'The Evolution of Sustainable Fashion in 2026',
    description: 'How leading brands are rethinking production, materials, and supply chains to meet growing consumer demand for sustainability.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    source: { name: 'Fashion Industry Weekly' },
  },
  {
    title: 'Casting Directors Share What They Look For in New Models',
    description: 'Five top casting directors reveal their criteria for discovering fresh talent, from first-impression essentials to portfolio must-haves.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    source: { name: 'Model Scout Magazine' },
  },
  {
    title: 'Beauty Industry Trends: What\'s Driving Growth in 2026',
    description: 'From inclusive shade ranges to "skinimalism," the beauty industry is evolving rapidly. We look at the trends shaping the sector.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    source: { name: 'Beauty Business Journal' },
  },
  {
    title: 'Digital-First Campaigns: How Brands Are Adapting to a Social World',
    description: 'Major brands are shifting budget from traditional print to social and digital-first campaigns. Here\'s what that means for models and photographers.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80',
    publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    source: { name: 'Campaign Creative' },
  },
  {
    title: 'Studio Lighting Innovations Every Fashion Photographer Should Know',
    description: 'New portable flash systems, AI-assisted light metering, and LED technology are transforming how photographers work on location.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80',
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    source: { name: 'Photography Pro' },
  },
  {
    title: 'Modeling Agency Contracts: Know Your Rights',
    description: 'A legal guide for models navigating agency contracts — what to look out for, what to negotiate, and when to walk away.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
    publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    source: { name: 'Model Advocate' },
  },
];

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('ALL');
  const [usingFallback, setUsingFallback] = useState(false);

  async function fetchNews(category: NewsCategory) {
    setLoading(true);
    setUsingFallback(false);
    const cat = CATEGORIES.find((c) => c.key === category)!;
    try {
      const apiKey = process.env.NEXT_PUBLIC_NEWSAPI_KEY;
      if (!apiKey) throw new Error('No API key');
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(cat.query)}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`
      );
      const data = await res.json();
      if (data.articles?.length) {
        setArticles(data.articles.filter((a: NewsArticle) => a.title !== '[Removed]'));
      } else {
        throw new Error('No articles');
      }
    } catch {
      setArticles(PLACEHOLDER_ARTICLES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNews('ALL'); }, []);

  function handleCategory(cat: NewsCategory) {
    setActiveCategory(cat);
    fetchNews(cat);
  }

  return (
    <PageTransition>
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Newspaper size={24} className="text-pink-500 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Industry News</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Stay current with fashion, beauty, and industry news.</p>
          </div>
        </div>
        <button
          onClick={() => fetchNews(activeCategory)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => handleCategory(c.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === c.key
                ? 'bg-pink-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {usingFallback && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Showing curated industry stories. Live news requires a NewsAPI key configured in your environment.
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Newspaper size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold">No news yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Check back later for industry updates.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const isExternal = article.url !== '#';
  const content = (
    <div className="rounded-2xl border overflow-hidden hover:shadow-md transition-shadow group bg-card h-full flex flex-col">
      <div className="h-44 overflow-hidden bg-muted relative">
        {article.urlToImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950/30 dark:to-pink-900/20 flex items-center justify-center">
            <Newspaper size={32} className="text-pink-300" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium truncate">{article.source.name}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors flex-1">{article.title}</p>
        {article.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
        )}
        {isExternal && (
          <div className="flex items-center gap-1 text-xs text-pink-500 font-medium pt-1">
            Read more <ExternalLink size={11} />
          </div>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </a>
    );
  }
  return <div className="h-full">{content}</div>;
}
