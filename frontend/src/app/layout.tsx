import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TideHook | Professional Order Flow Routing',
  description: 'Dual-market liquidity system for Uniswap v4 using Dutch auctions for whale trades.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-50 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
