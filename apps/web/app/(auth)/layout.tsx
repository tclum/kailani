import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cormorant.variable}>
      {children}
    </div>
  );
}
