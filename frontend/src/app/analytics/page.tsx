'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { EventFeed } from '@/components/tide/event-feed';
import { LiquidityImpactChart } from '@/components/tide/liquidity-impact-chart';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AnalyticsPage() {
  const [events] = useState([
    {
      blockNumber: 1301042,
      time: '2 mins ago',
      event: 'WhaleSwapDetected' as const,
      user: '0x3Be7fbBDbC73Fc4731D60EF09c4BA1A94DC58E41',
      size: '600,000 USDC',
      hash: '0xefa54f68e2d536a8a73800cf024779b6ab529931c16e093400235caeb755241e'
    },
    {
      blockNumber: 1301038,
      time: '5 mins ago',
      event: 'RetailSwap' as const,
      user: '0x1234fbBDbC73Fc4731D60EF09c4BA1A94DC58E41',
      size: '120 USDC',
      hash: '0xb4b7c7af64773f2e2c9d098fab6b56b080626433fe53b41dfbdb620488c12069'
    },
    {
      blockNumber: 1300990,
      time: '12 mins ago',
      event: 'AuctionSettled' as const,
      user: '0x9994fbBDbC73Fc4731D60EF09c4BA1A94DC58E41',
      size: '800,000 USDC',
      hash: '0xc7c7af64773f2e2c9d098fab6b56b080626433fe53b41dfbdb620488c12069'
    }
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="grow container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-primary" />
            Protocol Analytics
          </h1>
          <p className="text-slate-400">Real-time monitoring of liquidity impact and whale execution quality.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Liquidity Impact Comparison */}
          <div className="lg:col-span-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LiquidityImpactChart />
            </motion.div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <EventFeed events={events} />
            </motion.div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnalyticsStatCard 
                title="Total Whale Volume" 
                value="$12.4M" 
                detail="+14% this week"
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AnalyticsStatCard 
                title="Avg. Auction Fill" 
                value="98.2%" 
                detail="Across 142 auctions"
                icon={<Activity className="w-5 h-5 text-blue-400" />}
              />
            </motion.div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

function AnalyticsStatCard({ title, value, detail, icon }: { title: string, value: string, detail: string, icon: React.ReactNode }) {
  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            {icon}
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Metric</span>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm font-semibold text-slate-400">{title}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          {detail}
        </div>
      </CardContent>
    </Card>
  );
}
