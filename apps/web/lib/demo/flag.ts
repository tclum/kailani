// The only reader of NEXT_PUBLIC_DEMO_MODE. Next.js inlines the value at build
// time, so a flag-off build never loads the demo backend.
export function isDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === '1';
}
