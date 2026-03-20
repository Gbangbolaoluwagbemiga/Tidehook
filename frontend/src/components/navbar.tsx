'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      {/* Global Value Proposition Banner (Judge Feedback Fix) */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-slate-950 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-slate-950 to-transparent z-10" />
        
        <div className="whitespace-nowrap flex items-center gap-4 animate-scroll-fast font-black text-[10px] uppercase tracking-widest text-primary/80">
          <div className="flex items-center gap-1.5 px-4">
             <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
             TideHook: Smart Order Flow Routing for Uniswap v4
          </div>
          <div className="flex items-center gap-1.5 px-4 opacity-50">
             <div className="w-1 h-1 rounded-full bg-primary" />
             Large trades shouldn’t break AMMs — TideHook routes them intelligently
          </div>
          <div className="flex items-center gap-1.5 px-4">
             <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
             Dutch Auctions prevent price impact and LP loss
          </div>
          <div className="flex items-center gap-1.5 px-4 opacity-50">
             <div className="w-1 h-1 rounded-full bg-primary" />
             Retail → AMM | Whale → Dutch Auction
          </div>
          {/* Duplicate for infinite effect */}
          <div className="flex items-center gap-1.5 px-4">
             <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
             TideHook: Smart Order Flow Routing for Uniswap v4
          </div>
          <div className="flex items-center gap-1.5 px-4 opacity-50">
             <div className="w-1 h-1 rounded-full bg-primary" />
             Large trades shouldn’t break AMMs — TideHook routes them intelligently
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform shadow-lg shadow-primary/20 flex items-center justify-center bg-slate-900 border border-slate-800">
              <Image src="/logo.png" alt="TideHook Logo" width={40} height={40} className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
              TideHook
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/swap" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/analytics" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Analytics
            </Link>
            <Link href="/architecture" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Architecture
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
