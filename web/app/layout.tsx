import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'e-con Systems',
  description: 'CMS-driven page rendering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased" suppressHydrationWarning>
        <div className="mx-auto max-w-[2000px] overflow-x-hidden">
          <SiteHeader />
          <main className="px-3 sm:px-4 md:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
