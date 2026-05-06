import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'e-con Systems',
  description: 'CMS-driven page rendering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={openSans.variable}>
      <body className="min-h-screen bg-white text-slate-900 antialiased" suppressHydrationWarning>
        <div className="mx-auto max-w-[2000px] overflow-x-hidden">
          <SiteHeader />
          <main >{children}</main>
        </div>
      </body>
    </html>
  );
}
