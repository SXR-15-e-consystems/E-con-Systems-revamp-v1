import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'e-con Systems POC',
  description: 'CMS-driven page rendering POC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <header className="border-b bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-4 text-lg font-semibold">e-con Systems POC</div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
