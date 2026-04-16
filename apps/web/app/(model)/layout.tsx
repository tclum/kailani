import { Navbar } from '@/components/shared/Navbar';

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">{children}</main>
    </div>
  );
}
