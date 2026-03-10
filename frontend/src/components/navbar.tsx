'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Waves } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <Waves className="w-6 h-6 text-primary-foreground" />
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
