'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { SwapCard } from '@/components/tide/swap-card';
import { AuctionPanel } from '@/components/tide/auction-panel';
import { HookStats } from '@/components/tide/hook-stats';
import { motion } from 'framer-motion';

export default function SwapPage() {
  // Mock auctions for demo
  const [auctions] = useState([
    {
      id: '0xefa54f68e2d536a8a73800cf024779b6ab529931c16e093400235caeb755241e',
      whale: '0x3Be7fbBDbC73Fc4731D60EF09c4BA1A94DC58E41',
      totalAmount: '600000',
      filledAmount: '120000',
      startPrice: 79228,
      currentPrice: 78540,
      remainingBlocks: 240,
      status: 'ACTIVE' as const
    },
    {
      id: '0xb4b7c7af64773f2e2c9d098fab6b56b080626433fe53b41dfbdb620488c12069',
      whale: '0x9994fbBDbC73Fc4731D60EF09c4BA1A94DC58E41',
      totalAmount: '800000',
      filledAmount: '800000',
      startPrice: 79228,
      currentPrice: 75266,
      remainingBlocks: 0,
      status: 'SETTLED' as const
    }
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="grow container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Swap & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SwapCard />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <HookStats />
            </motion.div>
          </div>

          {/* Right Column: Active Auctions */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AuctionPanel auctions={auctions} />
            </motion.div>
          </div>
          
        </div>
      </main>

      <footer className="py-8 border-t border-slate-900 text-center text-slate-600 text-xs">
        <p>Connected to Unichain Sepolia & Reactive Lasna</p>
      </footer>
    </div>
  );
}
