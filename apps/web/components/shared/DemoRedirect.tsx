'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Demo mode: pages with no demo equivalent (signup, password reset) send visitors here instead. */
export function DemoRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}
