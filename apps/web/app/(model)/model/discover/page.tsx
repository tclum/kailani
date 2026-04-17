'use client';
import { SwipeStack } from '@/components/swipe/SwipeStack';
import { Zap } from 'lucide-react';

export default function ModelDiscoverPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
        >
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover Campaigns</h1>
          <p className="text-sm text-muted-foreground">Swipe right on campaigns you love</p>
        </div>
      </div>
      <SwipeStack inboxHref="/model/inbox" />
    </div>
  );
}
