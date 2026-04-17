'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Zap, ShieldCheck, Briefcase, Bookmark, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearTokens, getCurrentUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { connectSocket, getSocket, resetSocket } from '@/lib/socket';


export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u && u.role !== 'ADMIN') {
      apiFetch<{ verified: boolean }>('/api/auth/me')
        .then((me) => setVerified(me.verified))
        .catch(() => {});
    }
    if (u) {
      // Initial fetch
      apiFetch<{ count: number }>('/api/threads/unread-count')
        .then(({ count }) => setUnreadCount(count))
        .catch(() => {});

      // Poll every 30 seconds as fallback
      pollRef.current = setInterval(() => {
        apiFetch<{ count: number }>('/api/threads/unread-count')
          .then(({ count }) => setUnreadCount(count))
          .catch(() => {});
      }, 30000);

      // Connect socket and listen for new messages / read events
      connectSocket();
      const socket = getSocket();
      if (socket) {
        socket.on('new-message', (msg: { senderId: string }) => {
          if (msg.senderId !== u.userId) {
            setUnreadCount((c) => c + 1);
          }
        });
        socket.on('messages-read', () => {
          apiFetch<{ count: number }>('/api/threads/unread-count')
            .then(({ count }) => setUnreadCount(count))
            .catch(() => {});
        });
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleLogout() {
    // Clear auth tokens first so any in-flight requests fail cleanly
    clearTokens();
    // Stop the unread-count poll
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // Tear down the socket singleton so the next login gets a fresh connection
    // with the new user's JWT
    resetSocket();
    // Reset local state
    setUser(null);
    setUnreadCount(0);
    setVerified(null);
    // push then refresh forces Next.js to discard all client-side cache and
    // re-run any server components, preventing stale profile data bleeding
    // between sessions
    router.push('/login');
    router.refresh();
  }

  function getDashboardHref() {
    if (!user) return '/login';
    if (user.role === 'MODEL') return '/model/dashboard';
    if (user.role === 'BRAND') return '/brand/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'PHOTOGRAPHER') return '/photographer/dashboard';
    return '/';
  }

  function getInboxHref() {
    if (!user) return null;
    if (user.role === 'MODEL') return '/model/inbox';
    if (user.role === 'BRAND') return '/brand/inbox';
    if (user.role === 'PHOTOGRAPHER') return '/photographer/inbox';
    return null;
  }

  function getDiscoverHref() {
    if (!user) return null;
    if (user.role === 'MODEL') return '/model/discover';
    if (user.role === 'BRAND') return '/brand/discover';
    if (user.role === 'PHOTOGRAPHER') return '/photographer/discover';
    return null;
  }

  function getVerifyHref() {
    if (!user || user.role === 'ADMIN') return null;
    if (user.role === 'MODEL') return '/model/verify';
    if (user.role === 'BRAND') return '/brand/verify';
    if (user.role === 'PHOTOGRAPHER') return '/photographer/verify';
    return null;
  }

  const inboxHref = getInboxHref();
  const discoverHref = getDiscoverHref();
  const verifyHref = getVerifyHref();
  const showGetVerified = verifyHref && verified === false;

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href={getDashboardHref()} className="text-xl font-bold tracking-tight">
          Kailani
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'BRAND' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/brand/profile">Brand Profile</Link>
                </Button>
              )}
              {user.role === 'MODEL' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/model/campaigns" className="flex items-center gap-1.5">
                    <Briefcase size={15} />
                    Campaigns
                  </Link>
                </Button>
              )}
              {user.role === 'BRAND' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/brand/campaigns" className="flex items-center gap-1.5">
                    <Briefcase size={15} />
                    Campaigns
                  </Link>
                </Button>
              )}
              {user.role === 'BRAND' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/brand/saved" className="flex items-center gap-1.5">
                    <Bookmark size={15} />
                    Saved
                  </Link>
                </Button>
              )}
              {user.role === 'ADMIN' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/reports" className="flex items-center gap-1.5">
                    <Flag size={15} />
                    Reports
                  </Link>
                </Button>
              )}
              {discoverHref && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={discoverHref} className="flex items-center gap-1.5">
                    <Zap size={15} />
                    Discover
                  </Link>
                </Button>
              )}
              {inboxHref && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={inboxHref} className="flex items-center gap-1.5 relative">
                    <MessageSquare size={15} />
                    Inbox
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
              )}
              {showGetVerified && (
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={verifyHref!}
                    className="flex items-center gap-1.5 text-pink-500 hover:text-pink-600"
                  >
                    <ShieldCheck size={15} />
                    Get Verified
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground capitalize">
                {user.role.toLowerCase()}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
