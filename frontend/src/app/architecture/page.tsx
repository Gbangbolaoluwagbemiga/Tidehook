'use client';

import React from 'react';
import { Navbar } from '@/components/navbar';
import { motion } from 'framer-motion';
import { Layers, Zap, ShieldAlert, Cpu, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Under the Hood</h1>
            <p className="text-slate-400 text-lg">
              TideHook leverages Uniswap v4's architecture and the Reactive Network to create 
              an autonomous, dual-market liquidity system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <ArchitectureStep 
              icon={<Zap className="w-6 h-6 text-green-400" />}
              title="1. Trade Classification"
              description="The hook intercepts every swap in the beforeSwap callback. If the trade size is below the whaleThreshold, it executes immediately in the AMM."
            />
            <ArchitectureStep 
              icon={<ShieldAlert className="w-6 h-6 text-blue-400" />}
              title="2. Whale Detection"
              description="Whale trades skip the AMM and are stored in the hook state. A new Dutch auction is initialized with a starting price premium."
              isWhale
            />
            <ArchitectureStep 
              icon={<Cpu className="w-6 h-6 text-purple-400" />}
              title="3. Autonomous Ticking"
              description="The Reactive Network listens for NewWhaleAuction events and automatically calls tickAuction every few blocks, decaying the price."
            />
            <ArchitectureStep 
              icon={<RefreshCw className="w-6 h-6 text-cyan-400" />}
              title="4. Internal Settlement"
              description="When the auction price decays to the market price (or better), the hook settles the trade via poolManager.unlock, preserving all invariants."
            />
          </div>

          {/* Technical Deep Dive */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm mb-16 overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 p-8">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Layers className="w-6 h-6 text-primary" />
                The Dual-Routing Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Preserving Pool Invariants
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Unlike conventional "off-chain" auctions, TideHook performs the final settlement swap
                  internally within the Uniswap v4 pool. This ensures that:
                </p>
                <ul className="mt-4 space-y-3 list-inside list-disc text-slate-400 ml-4">
                  <li>LP fees are correctly accrued for the settlement volume.</li>
                  <li>The AMM price stays in sync with the auction settlement price.</li>
                  <li>ERC-6909 claims are used to manage token flows without external transfers.</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 opacity-50">// TideHook.sol: Settlement Logic snippet</span>
                </div>
                <pre className="text-slate-300">
{`function unlockCallback(bytes calldata data) external returns (bytes memory) {
    // Perform internal swap using PoolManager.swap()
    // Distribute settlement tokens to whale
    // Settle net balance delta with PoolManager
    return "";
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ArchitectureStep({ icon, title, description, isWhale }: { icon: React.ReactNode, title: string, description: string, isWhale?: boolean }) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border transition-all hover:scale-[1.02]",
      isWhale ? "bg-blue-500/5 border-blue-500/20" : "bg-slate-900/50 border-slate-800"
    )}>
      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
