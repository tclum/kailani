import { isDemo } from '@/lib/demo/flag';

/** Slim notice shown on every page of a demo-mode build. */
export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div
      role="note"
      className="w-full text-center text-xs py-1.5 px-4 font-medium tracking-wide"
      style={{ background: '#1a0a12', color: '#f9a8d4', borderBottom: '1px solid rgba(244,114,182,0.25)' }}
    >
      Demo — fictional data, stored only in your browser.
    </div>
  );
}
