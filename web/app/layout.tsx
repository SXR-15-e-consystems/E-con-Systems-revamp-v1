import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'e-con Systems',
  description: 'CMS-driven page rendering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <header className="border-b bg-slate-50">
  <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
    
    {/* Logo - Left */}
    <img
      src="https://d2u56hfpsewfc3.cloudfront.net/images/e-con-twenty-plus-years-logo-register.svg"
      alt="e-con logo"
      title="e-conSystems"
      className="h-10"
    />

    {/* Center Text */}
    <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold">
      e-con Systems
    </div>

  </div>
</header>
        <main>{children}</main>
      </body>
    </html>
  );
}
