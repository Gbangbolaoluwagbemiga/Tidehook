'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { EventFeed } from '@/components/tide/event-feed';
import { LiquidityImpactChart } from '@/components/tide/liquidity-impact-chart';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import TideHookABI from '@/contracts/abis/TideHook.json';
import { formatUnits } from 'viem';
import { useEffect } from 'react';

export default function AnalyticsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVolume: '0',
    avgFill: '0',
    auctionCount: 0
  });

  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber({ watch: true });

  useEffect(() => {
    async function fetchAnalytics() {
      if (!publicClient) return;

      try {
        const fromBlock = 0n; // Simple for demo, in prod use a specific starting block

        const [startedLogs, completedLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
            event: {
              type: 'event',
              name: 'WhaleAuctionStarted',
              inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionStarted')?.inputs || [],
            },
            fromBlock,
          }),
          publicClient.getLogs({
            address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
            event: {
              type: 'event',
              name: 'WhaleAuctionCompleted',
              inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionCompleted')?.inputs || [],
            },
            fromBlock,
          })
        ]);

        // Aggregate Stats
        let totalVolRaw = 0n;
        startedLogs.forEach((log: any) => {
          totalVolRaw += BigInt(log.args.totalAmount || 0n);
        });

        const completedMap = new Map();
        let totalFilledRaw = 0n;
        let totalAmountForCompleted = 0n;

        completedLogs.forEach((log: any) => {
          completedMap.set(log.args.auctionId.toLowerCase(), log.args.filledAmount);
          totalFilledRaw += BigInt(log.args.filledAmount || 0n);
        });

        // To calculate avg fill, we need the totalAmount of only the COMPLETED auctions
        startedLogs.forEach((log: any) => {
          if (completedMap.has(log.args.auctionId.toLowerCase())) {
            totalAmountForCompleted += BigInt(log.args.totalAmount || 0n);
          }
        });

        const avgFill = totalAmountForCompleted > 0n 
          ? (Number(totalFilledRaw * 10000n / totalAmountForCompleted) / 100).toFixed(1)
          : '100.0';

        setStats({
          totalVolume: (Number(totalVolRaw / 10n**18n)).toLocaleString(),
          avgFill: avgFill,
          auctionCount: startedLogs.length
        });

        // Format Activity Feed
        const combinedEvents = [
          ...startedLogs.map(log => ({
            blockNumber: Number(log.blockNumber),
            event: 'AuctionStarted' as const,
            user: log.args.whale,
            size: `${(Number(BigInt(log.args.totalAmount) / 10n**18n)).toLocaleString()} USDC`,
            hash: log.transactionHash
          })),
          ...completedLogs.map(log => ({
            blockNumber: Number(log.blockNumber),
            event: 'AuctionSettled' as const,
            user: '0x0000...0000', // Completed event doesn't have whale, could join but keep simple
            size: `${(Number(BigInt(log.args.filledAmount) / 10n**18n)).toLocaleString()} USDC`,
            hash: log.transactionHash
          }))
        ].sort((a, b) => b.blockNumber - a.blockNumber).slice(0, 10);

        setEvents(combinedEvents);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    }

    fetchAnalytics();
  }, [publicClient, currentBlock]);

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
                value={`$${stats.totalVolume}`} 
                detail="Cumulative protocol throughput"
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                loading={loading}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AnalyticsStatCard 
                title="Avg. Auction Fill" 
                value={`${stats.avgFill}%`} 
                detail={`Across ${stats.auctionCount} whale orders`}
                icon={<Activity className="w-5 h-5 text-blue-400" />}
                loading={loading}
              />
            </motion.div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

function AnalyticsStatCard({ title, value, detail, icon, loading }: { title: string, value: string, detail: string, icon: React.ReactNode, loading?: boolean }) {
  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 relative">
            {icon}
            {!loading && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Metric</span>
        </div>
        <div className="space-y-1">
          {loading ? (
            <div className="h-9 w-24 bg-slate-800 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-white">{value}</p>
          )}
          <p className="text-sm font-semibold text-slate-400">{title}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          {loading ? "Analyzing logs..." : detail}
        </div>
      </CardContent>
    </Card>
  );
}
