'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                  <Zap className="w-3 h-3" />
                  <span>The Future of Large-Cap Execution</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-500">
                  Smart Order Flow Routing for Uniswap v4
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                  TideHook separates retail and whale trades, routing large orders into Dutch auctions 
                  to protect liquidity providers and eliminate MEV extraction.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/swap">
                    <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/25">
                      Launch App
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-slate-800 bg-slate-900/50 hover:bg-slate-800">
                    View Architecture
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 border-t border-slate-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-blue-400" />}
                title="MEV Resistance"
                description="Dutch auctions spread execution over multiple blocks, making sandwich attacks unprofitable and ensuring fair price discovery."
              />
              <FeatureCard 
                icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
                title="LP Protection"
                description="Smoothing large trades prevents inventory imbalances and toxic order flow, reducing impermanent loss for liquidity providers."
              />
              <FeatureCard 
                icon={<Layers className="w-6 h-6 text-cyan-400" />}
                title="Uniswap v4 Native"
                description="Built on the core Uniswap v4 singleton, leveraging custom hooks and ERC-6909 claims for gas-efficient settlement."
              />
            </div>
          </div>
        </section>

        {/* Visual Architecture Preview */}
        <section className="py-24 bg-slate-900/20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold mb-16 text-white">How TideHook Works</h2>
            
            <ArchitectureDiagram />
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>© 2026 TideHook. Built for UHI8 Hookathon.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="relative p-12 rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm overflow-hidden min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 w-full">
        <div className="flex-1 space-y-4">
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-mono text-sm shadow-lg">
            User Swap Request
          </div>
          <ArrowRight className="mx-auto rotate-90 md:rotate-0 text-slate-700" />
          <div className="p-6 rounded-2xl border border-primary/50 bg-primary/10 text-primary font-bold shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            TideHook beforeSwap
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/5 text-green-400">
              <p className="font-bold mb-2">Retail Trade</p>
              <p className="text-xs opacity-70">Immediate Execution via AMM</p>
            </div>
            <div className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-blue-400">
              <p className="font-bold mb-2">Whale Trade</p>
              <p className="text-xs opacity-70">Trigger Dutch Auction</p>
            </div>
          </div>
          
          <div className="w-px h-12 bg-gradient-to-b from-slate-700 to-transparent md:hidden" />
          
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 text-sm">
            Reactive Network Tick Tickers
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-50" />
    </div>
  );
}
