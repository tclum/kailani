'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LayoutDashboard, Users, ShieldCheck, AlertTriangle, Briefcase } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Badges {
  pendingVerifications: number;
  openReports: number;
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/approvals', label: 'Verifications', icon: ShieldCheck, badgeKey: 'pendingVerifications' as keyof Badges },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, badgeKey: 'openReports' as keyof Badges },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Briefcase },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Badges>({ pendingVerifications: 0, openReports: 0 });

  useEffect(() => {
    apiFetch<Badges>('/api/admin/stats')
      .then((s) => setBadges({ pendingVerifications: s.pendingVerifications, openReports: s.openReports }))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 border-r bg-background sticky top-0 h-[calc(100vh-64px)] pt-6 pb-4 px-3 gap-1 flex-shrink-0">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            const count = badgeKey ? badges[badgeKey] : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={active ? { background: 'linear-gradient(135deg,#ec4899,#be185d)' } : undefined}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            const count = badgeKey ? badges[badgeKey] : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium relative transition-colors ${
                  active ? 'text-pink-600' : 'text-muted-foreground'
                }`}
              >
                <Icon size={18} />
                {label}
                {count > 0 && (
                  <span className="absolute top-1.5 right-1/4 text-[9px] font-bold px-1 py-0 rounded-full bg-red-500 text-white min-w-[14px] text-center">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 container py-8 pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
