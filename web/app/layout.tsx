import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'e-con Systems',
  description: 'CMS-driven page rendering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <div className="mx-auto max-w-[2000px]">
          <SiteHeader />
          <main className='px-[2em]'>{children}</main>
        </div>
      </body>
    </html>
  );
}
