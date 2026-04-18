'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Zap, ShieldCheck, Briefcase, Bookmark, Flag, Users, CreditCard, BookOpen, Newspaper, Calculator, Star, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearTokens, getCurrentUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { connectSocket, getSocket, resetSocket } from '@/lib/socket';


export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      apiFetch<{ count: number }>('/api/threads/unread-count')
        .then(({ count }) => setUnreadCount(count))
        .catch(() => {});

      pollRef.current = setInterval(() => {
        apiFetch<{ count: number }>('/api/threads/unread-count')
          .then(({ count }) => setUnreadCount(count))
          .catch(() => {});
      }, 30000);

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
    clearTokens();
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    resetSocket();
    setUser(null);
    setUnreadCount(0);
    setVerified(null);
    setMobileOpen(false);
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

  // ─── Link lists (shared between desktop and mobile menu) ───────────────────

  function renderLinks(mobile = false) {
    const btnCls = mobile
      ? 'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors'
      : undefined;

    if (!user) {
      return (
        <>
          {mobile ? (
            <>
              <Link href="/login" className={btnCls} onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/signup" className={`${btnCls} text-pink-500 font-semibold`} onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link href="/login">Log in</Link></Button>
              <Button size="sm" asChild><Link href="/signup">Sign up</Link></Button>
            </>
          )}
        </>
      );
    }

    const close = () => setMobileOpen(false);

    const link = (href: string, icon: React.ReactNode, label: React.ReactNode) =>
      mobile ? (
        <Link key={href} href={href} className={btnCls} onClick={close}>
          <span className="text-pink-500">{icon}</span>
          {label}
        </Link>
      ) : (
        <Button key={href} variant="ghost" size="sm" asChild>
          <Link href={href} className="flex items-center gap-1.5">{icon}{label}</Link>
        </Button>
      );

    return (
      <>
        {/* Home */}
        {link(getDashboardHref(), null, 'Home')}

        {/* Role-specific */}
        {user.role === 'BRAND' && link('/brand/profile', null, 'Brand Profile')}
        {user.role === 'PHOTOGRAPHER' && link('/photographer/profile', null, 'Profile')}
        {user.role === 'PHOTOGRAPHER' && link('/photographer/portfolio', null, 'Portfolio')}
        {user.role === 'MODEL' && link('/model/comp-card', <CreditCard size={15} />, 'Comp Card')}
        {user.role === 'MODEL' && link('/model/campaigns', <Briefcase size={15} />, 'Campaigns')}
        {user.role === 'BRAND' && link('/brand/campaigns', <Briefcase size={15} />, 'Campaigns')}
        {user.role === 'BRAND' && link('/brand/saved', <Bookmark size={15} />, 'Saved')}
        {user.role === 'ADMIN' && link('/admin/reports', <Flag size={15} />, 'Reports')}
        {user.role === 'ADMIN' && link('/admin/spotlights', <Star size={15} />, 'Spotlights')}

        {/* Discover + Inbox */}
        {discoverHref && link(discoverHref, <Zap size={15} />, 'Discover')}
        {inboxHref && (
          mobile ? (
            <Link href={inboxHref} className={btnCls} onClick={close}>
              <span className="text-pink-500"><MessageSquare size={15} /></span>
              Inbox
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ) : (
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
          )
        )}

        {/* ── Community & content ── */}
        {mobile && user.role !== 'ADMIN' && (
          <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Content
          </p>
        )}
        {user.role !== 'ADMIN' && link('/tutorials', <BookOpen size={15} />, 'Tutorials')}
        {user.role !== 'ADMIN' && link('/news', <Newspaper size={15} />, 'News')}
        {(user.role === 'MODEL' || user.role === 'PHOTOGRAPHER') && link('/tools/rate-calculator', <Calculator size={15} />, 'Rates')}
        {user.role !== 'ADMIN' && link('/community', <Users size={15} />, 'Community')}

        {/* Verify / Account */}
        {showGetVerified && (
          mobile ? (
            <Link href={verifyHref!} className={`${btnCls} text-pink-500`} onClick={close}>
              <ShieldCheck size={15} />
              Get Verified
            </Link>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={verifyHref!} className="flex items-center gap-1.5 text-pink-500 hover:text-pink-600">
                <ShieldCheck size={15} />
                Get Verified
              </Link>
            </Button>
          )
        )}

        {mobile ? (
          <>
            <div className="border-t my-1" />
            <div className="px-3 py-1 text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</div>
            <button onClick={handleLogout} className={`${btnCls} text-red-500`}>Log out</button>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
          </>
        )}
      </>
    );
  }

  return (
    <nav className="border-b bg-background relative z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Kailani
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-3">
          {renderLinks(false)}
        </div>

        {/* Mobile right: inbox badge + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          {user && inboxHref && unreadCount > 0 && (
            <Link href={inboxHref} className="relative p-1">
              <MessageSquare size={20} />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-background px-3 py-3 flex flex-col gap-0.5 shadow-lg">
          {renderLinks(true)}
        </div>
      )}
    </nav>
  );
}
