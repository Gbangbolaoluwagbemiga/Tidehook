'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { SwapCard } from '@/components/tide/swap-card';
import { AuctionPanel } from '@/components/tide/auction-panel';
import { HookStats } from '@/components/tide/hook-stats';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import TideHookABI from '@/contracts/abis/TideHook.json';
import { formatUnits } from 'viem';

export type Auction = {
  id: string;
  whale: string;
  totalAmount: string;
  filledAmount: string;
  startPrice: number;
  currentPrice: number;
  startBlock: number;
  remainingBlocks: number;
  status: 'ACTIVE' | 'SETTLED';
};

export default function SwapPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const pendingHashes = React.useRef<Set<string>>(new Set());
  const publicClient = usePublicClient();

  // Rehydration: Fetch past events on mount
  React.useEffect(() => {
    const fetchPastEvents = async () => {
      if (!publicClient) return;

      try {
        // Increase block range for better rehydration
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

        const startedLogs = await publicClient.getLogs({
          address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
          event: {
            type: 'event',
            name: 'WhaleAuctionStarted',
            inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionStarted')?.inputs || [],
          },
          fromBlock,
        });

        const completedLogs = await publicClient.getLogs({
          address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
          event: {
            type: 'event',
            name: 'WhaleAuctionCompleted',
            inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionCompleted')?.inputs || [],
          },
          fromBlock,
        });

        const completedIds = new Map();
        completedLogs.forEach((log: any) => {
          completedIds.set(log.args.auctionId.toLowerCase(), log.args.filledAmount);
        });

        const activeAuctions = await Promise.all(startedLogs.map(async (log: any) => {
          const { auctionId } = log.args;
          const idLower = auctionId.toLowerCase();
          
          // Fetch ground truth from contract
          try {
            const auctionData = await publicClient.readContract({
              address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
              abi: TideHookABI.abi,
              functionName: 'auctions',
              args: [auctionId],
            }) as any[];

            const [
              whale, 
              poolId, 
              zeroForOne, 
              totalAmount, 
              filledAmount, 
              startSqrtPriceX96, 
              priceDecayPerBlock, 
              startBlock, 
              durationBlocks, 
              active, 
              settled
            ] = auctionData;
            
            // Convert sqrtPriceX96 to human readable price (approximate for demo)
            // For USDC/ETH where token0=USDC (decimal 6) and token1=ETH (decimal 18)
            const basePrice = 2162.94; 

            return {
              id: auctionId,
              whale,
              totalAmount: formatUnits(totalAmount, 18),
              filledAmount: settled ? formatUnits(totalAmount, 18) : formatUnits(filledAmount, 18),
              startPrice: basePrice,
              currentPrice: basePrice,
              startBlock: Number(startBlock),
              remainingBlocks: settled ? 0 : Math.max(0, 300 - (Number(currentBlock) - Number(startBlock))),
              status: settled ? 'SETTLED' : 'ACTIVE',
            };
          } catch (e) {
            return null;
          }
        }));

        const pastAuctions = activeAuctions.filter(a => a !== null) as Auction[];

        setAuctions((prev) => {
          const existingIds = new Set(prev.map(a => a.id));
          const newOnes = pastAuctions.filter(a => !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
      } catch (e) {
        console.error('Failed to fetch past auctions', e);
      }
    };

    fetchPastEvents();
    
  }, [publicClient]);


  // Auto-expire pending auctions older than 5 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPendingAuctions(prev => prev.filter(p => {
        const createdAt = p.createdAt || 0;
        return Date.now() - createdAt < 5 * 60 * 1000;
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear all pending auctions from localStorage on fresh load
  React.useEffect(() => {
    setPendingAuctions([]);
    pendingHashes.current.clear();
  }, []);

  // ========================================================
  // POLLING: getLogs every 5s instead of useWatchContractEvent
  // Handles RPC 403/rate-limit issues gracefully
  // ========================================================
  const lastPolledBlock = useRef<bigint>(0n);

  const processNewEvents = useCallback(async () => {
    if (!publicClient) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = lastPolledBlock.current > 0n 
        ? lastPolledBlock.current + 1n 
        : (currentBlock > 500n ? currentBlock - 500n : 0n);

      if (fromBlock > currentBlock) return;
      lastPolledBlock.current = currentBlock;

      // WhaleAuctionStarted
      const startedLogs = await publicClient.getLogs({
        address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
        event: {
          type: 'event',
          name: 'WhaleAuctionStarted',
          inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionStarted')?.inputs || [],
        },
        fromBlock,
        toBlock: currentBlock,
      });

      if (startedLogs.length > 0) {
        startedLogs.forEach((log: any) => {
          const { auctionId, whale, totalAmount } = log.args;
          setAuctions(prev => {
            if (prev.some(a => a.id === auctionId)) return prev;
            return [{
              id: auctionId,
              whale,
              totalAmount: formatUnits(totalAmount, 18),
              filledAmount: '0',
              startPrice: 2162.94,
              currentPrice: 2162.94,
              startBlock: Number(currentBlock),
              remainingBlocks: 300,
              status: 'ACTIVE' as const
            }, ...prev];
          });
          setPendingAuctions([]);
          pendingHashes.current.clear();
        });
      }

      // WhaleAuctionCompleted
      const completedLogs = await publicClient.getLogs({
        address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
        event: {
          type: 'event',
          name: 'WhaleAuctionCompleted',
          inputs: TideHookABI.abi.find(x => x.name === 'WhaleAuctionCompleted')?.inputs || [],
        },
        fromBlock,
        toBlock: currentBlock,
      });

      if (completedLogs.length > 0) {
        completedLogs.forEach((log: any) => {
          const { auctionId, filledAmount } = log.args;
          const idLower = auctionId.toLowerCase();
          setAuctions(prev => prev.map(a => a.id.toLowerCase() === idLower ? { 
            ...a, 
            status: 'SETTLED', 
            remainingBlocks: 0,
            filledAmount: formatUnits(filledAmount, 18)
          } : a));
        });
      }

      // AuctionTickExecuted (Partial Fills)
      const tickLogs = await publicClient.getLogs({
        address: CONTRACTS.TIDE_HOOK.address as `0x${string}`,
        event: {
          type: 'event',
          name: 'AuctionTickExecuted',
          inputs: TideHookABI.abi.find(x => x.name === 'AuctionTickExecuted')?.inputs || [],
        },
        fromBlock,
        toBlock: currentBlock,
      });

      if (tickLogs.length > 0) {
        tickLogs.forEach((log: any) => {
          const { auctionId, filledAmount, remainingAmount } = log.args;
          const idLower = auctionId.toLowerCase();
          setAuctions(prev => prev.map(a => a.id.toLowerCase() === idLower ? { 
            ...a, 
            filledAmount: formatUnits(filledAmount, 18)
          } : a));
        });
      }
    } catch (e) {
      // Silently fail on RPC errors, retry on next interval
    }
  }, [publicClient]);

  React.useEffect(() => {
    processNewEvents(); // immediate first run
    const interval = setInterval(processNewEvents, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [processNewEvents]);


  const [toast, setToast] = useState<string | null>(null);

  const handleAuctionPending = (amount: string, hash: string) => {
    // Deduplicate: only add if we haven't seen this hash before
    if (pendingHashes.current.has(hash)) return;
    pendingHashes.current.add(hash);
    
    setPendingAuctions(prev => [
      { id: hash, amount, status: 'PENDING', hash, createdAt: Date.now() },
      ...prev
    ]);
    setToast(`Whale Transaction sent! Mining on-chain...`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAuctionFailed = (hash: string) => {
    setPendingAuctions(prev => prev.filter(p => p.hash !== hash));
    pendingHashes.current.delete(hash);
    setToast('Transaction failed on-chain. Please try again.');
    setTimeout(() => setToast(null), 5000);
  };

  const handleDismissPending = (hash: string) => {
    setPendingAuctions(prev => prev.filter(p => p.hash !== hash));
    pendingHashes.current.delete(hash);
  };

  const handleAuctionCreated = (amount: string) => {
    setToast(`Whale Auction confirmed for ${parseInt(amount).toLocaleString()} USDC`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl backdrop-blur-md shadow-xl max-w-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="grow container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Swap & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SwapCard 
                onAuctionCreated={handleAuctionCreated}
                onAuctionPending={handleAuctionPending}
                onAuctionFailed={handleAuctionFailed}
              />
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
              <AuctionPanel 
                auctions={auctions} 
                pendingAuctions={pendingAuctions}
                onDismissPending={handleDismissPending}
              />
            </motion.div>
          </div>

        </div>
      </main>

      <footer className="py-8 border-t border-slate-900 text-center text-slate-600 text-xs">
        <p>Connected to Unichain Sepolia &amp; Reactive Lasna</p>
      </footer>
    </div>
  );
}
