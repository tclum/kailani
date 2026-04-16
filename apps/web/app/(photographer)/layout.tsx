import { Navbar } from '@/components/shared/Navbar';
import { ApprovalBanner } from '@/components/shared/ApprovalBanner';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ApprovalBanner />
      <main className="flex-1 container py-8">{children}</main>
    </div>
  );
}
