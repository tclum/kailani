import { redirect } from 'next/navigation';

// Root redirect — client-side role-based routing happens after login.
// This just ensures `/` goes somewhere sensible.
export default function RootPage() {
  redirect('/login');
}
