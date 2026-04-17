'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearTokens, getCurrentUser } from '@/lib/auth';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.push('/login');
  }

  function getDashboardHref() {
    if (!user) return '/login';
    if (user.role === 'MODEL') return '/model/dashboard';
    if (user.role === 'BRAND') return '/brand/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'PHOTOGRAPHER') return '/model/dashboard';
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

  const inboxHref = getInboxHref();
  const discoverHref = getDiscoverHref();

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
                  <Link href={inboxHref} className="flex items-center gap-1.5">
                    <MessageSquare size={15} />
                    Inbox
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
