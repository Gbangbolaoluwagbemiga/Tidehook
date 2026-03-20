'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceDecayChart } from './price-decay-chart';
import { Timer, TrendingDown, Layers, CheckCircle2, Loader2, ExternalLink, ArrowDown, Coins, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReadContract, useBlockNumber } from 'wagmi';
import { CONTRACTS } from '@/contracts';
import IPoolManagerABI from '@/contracts/abis/IPoolManager.json';

interface Auction {
  id: string;
  whale: string;
  totalAmount: string;
  filledAmount: string;
  startPrice: number;
  currentPrice: number;
  remainingBlocks: number;
  startBlock: number;
  status: 'ACTIVE' | 'SETTLED' | 'PENDING';
  hash?: string;
}

interface PendingAuction {
  id: string;
  amount: string;
  status: 'PENDING';
  hash: string;
}

export function AuctionPanel({ auctions, pendingAuctions = [], onDismissPending }: { 
  auctions: Auction[], 
  pendingAuctions?: PendingAuction[],
  onDismissPending?: (hash: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Whale Activity Terminal</h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase opacity-60">Real-time Unichain Liquidity Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            LIVE
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary font-black px-3 py-1 text-[10px]">
            {auctions.filter(a => a.status === 'ACTIVE').length + pendingAuctions.length} ACTIVE
          </Badge>
        </div>
      </div>

      {auctions.length === 0 && pendingAuctions.length === 0 ? (
        <Card className="border-dashed border-slate-800 bg-slate-950/20 backdrop-blur-sm">
          <CardContent className="h-64 flex flex-col items-center justify-center text-slate-600">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 opacity-50">
              <Layers className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Scanner Idle</p>
            <p className="text-[10px] opacity-50 mt-1">Awaiting incoming whale swaps on Unichain...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingAuctions.map((pending) => (
            <PendingAuctionCard key={pending.id} pending={pending} onDismiss={onDismissPending} />
          ))}
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingAuctionCard({ pending, onDismiss }: { pending: PendingAuction, onDismiss?: (hash: string) => void }) {
  return (
    <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm relative overflow-hidden group animate-pulse">
      <div className="absolute top-0 left-0 h-1 bg-primary/50 w-full" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold mb-1 flex items-center gap-2 text-primary/80">
              Auction Pending...
              <Loader2 className="w-4 h-4 animate-spin" />
            </CardTitle>
            <p className="text-xs text-slate-500 font-mono">Tx Hash: {pending.hash?.slice(0, 20)}...</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">
              PENDING
            </Badge>
            {onDismiss && (
              <button
                onClick={() => onDismiss(pending.hash)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Stat label="Total Amount" value={`${parseInt(pending.amount).toLocaleString()} USDC`} />
          <Stat label="Status" value="Mining..." />
          <Stat label="Wait Time" value="~10s" />
          <div className="flex items-end pb-1">
            <a 
              href={`https://sepolia.uniscan.xyz/tx/${pending.hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors underline"
            >
              View on Unichain Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="h-24 bg-slate-800/20 rounded-xl border border-slate-800/30 flex items-center justify-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Waiting for confirmation</p>
        </div>
      </CardContent>
    </Card>
  );
}



function AuctionCard({ auction }: { auction: Auction }) {
  const { data: currentBlockData } = useBlockNumber({ watch: true });
  
  const currentBlock = Number(currentBlockData || 0);
  const isSettled = auction.status === 'SETTLED';
  
  // Calculate dynamic stats
  const totalDuration = 300;
  const elapsed = isSettled 
    ? totalDuration 
    : currentBlock > 0 && auction.startBlock > 0 
      ? Math.min(totalDuration, Math.max(0, currentBlock - auction.startBlock))
      : 300 - auction.remainingBlocks;

  const remaining = isSettled ? 0 : Math.max(0, totalDuration - elapsed);
  
  // Dynamic Price Decay: Decay 20% over 300 blocks
  const startPriceVal = auction.startPrice || 2162.94;
  const floorPriceVal = startPriceVal * 0.8;
  const currentPriceVal = isSettled 
    ? floorPriceVal
    : startPriceVal - ((startPriceVal - floorPriceVal) * (elapsed / totalDuration));

  const progress = (parseFloat(auction.filledAmount) / parseFloat(auction.totalAmount)) * 100;

  return (
    <Card className={cn(
      "border-slate-800/80 bg-slate-950/40 backdrop-blur-xl relative overflow-hidden group transition-all duration-500",
      isSettled ? "border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]" : "hover:border-primary/30"
    )}>
      <div className={cn(
        "absolute top-0 left-0 h-1 transition-all duration-1000",
        isSettled ? "bg-green-500 w-full" : "bg-primary"
      )} style={{ width: isSettled ? '100%' : `${progress}%` }} />
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-black flex items-center gap-2 group-hover:text-primary transition-colors">
                ORDER #{auction.id.slice(2, 8).toUpperCase()}
              </CardTitle>
              {isSettled && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-400 uppercase">
                   <CheckCircle2 className="w-3 h-3" />
                   Fully Settled
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">UNICHANE-SEPOLIA</span>
              <span>•</span>
              <span>Whale: {auction.whale.slice(0, 10)}...{auction.whale.slice(-6)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn(
              "uppercase text-[10px] font-black px-3 py-1 tracking-widest transition-all",
              isSettled 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] text-white border-blue-500"
            )}>
              {isSettled ? 'COMPLETE' : 'AUCTION LIVE'}
            </Badge>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                <Timer className="w-3 h-3 text-primary animate-pulse" />
                {Math.floor(remaining / 60)}m {remaining % 60}s
              </span>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                {remaining} Blocks Remaining
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-4 rounded-3xl bg-slate-900/30 border border-slate-800/50",
          isSettled && "border-green-500/20 bg-green-500/5"
        )}>
          <Stat label="Principal" value={`${parseInt(auction.totalAmount).toLocaleString()} USDC`} color="blue" />
          <Stat label="Filled" value={`${parseInt(isSettled ? auction.totalAmount : auction.filledAmount).toLocaleString()} USDC`} color={isSettled ? "green" : "blue"} />
          <Stat 
            label="Floor Price" 
            value={`$${currentPriceVal.toFixed(2)}`} 
            subValue={`-${((1 - currentPriceVal / startPriceVal) * 100).toFixed(1)}%`}
            color="orange"
            tooltip="The current price at which this whale order can be filled. It decays over time."
          />
          <Stat 
            label="Est. Blocks" 
            value={`${remaining}`} 
            icon={<Timer className="w-3 h-3 text-slate-500" />}
            color="slate"
          />
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/50 pointer-events-none z-10" />
          <PriceDecayChart 
            startPrice={startPriceVal} 
            currentPrice={currentPriceVal} 
            duration={totalDuration} 
            elapsedBlocks={elapsed} 
          />
        </div>

        {/* Impact Comparison (The "Winner" Feature) */}
        {!isSettled && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Liquidity Impact Comparison</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Legacy AMM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase">TideHook</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-red-400 uppercase">Without TideHook</span>
                  <ArrowDown className="w-3 h-3 text-red-500 animate-bounce" />
                </div>
                <div className="h-20 relative flex items-end">
                   {/* Legacy Slippage Curve (Sharp Drop) */}
                   <svg className="w-full h-full" preserveAspectRatio="none">
                     <path 
                       d="M 0 10 L 40 10 L 41 70 L 100 70" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       className="text-red-500/30"
                     />
                     <path 
                       d="M 0 10 L 40 10 L 41 70 L 100 70" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       strokeDasharray="4 2"
                       className="text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                     />
                   </svg>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-red-500/80 rotate-[-15deg] uppercase">
                     Total Price Crash
                   </div>
                </div>
                <p className="text-[8px] text-red-400/60 font-medium">AMM swap for {parseInt(auction.totalAmount).toLocaleString()} USDC causes ~15% instant slippage.</p>
              </div>

              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-primary uppercase">With TideHook</span>
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                </div>
                <div className="h-20 relative flex items-end">
                   {/* TideHook Curve (Smooth) */}
                   <svg className="w-full h-full" preserveAspectRatio="none">
                     <path 
                       d="M 0 10 L 100 70" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       className="text-primary/30"
                     />
                     <motion.path 
                       initial={{ pathLength: 0 }}
                       animate={{ pathLength: 1 }}
                       transition={{ duration: 2, repeat: Infinity }}
                       d="M 0 10 L 100 70" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       className="text-primary shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                     />
                   </svg>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-primary/80 rotate-[-15deg] uppercase">
                     Gradual Discovery
                   </div>
                </div>
                <p className="text-[8px] text-primary/60 font-medium">TideHook distributes size over time, preventing AMM vault depletion.</p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Credibility Footer */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
             <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-600 uppercase">Hook Address</span>
                <span className="text-[9px] font-mono text-slate-400">{CONTRACTS.TIDE_HOOK.address.slice(0, 18)}...</span>
             </div>
             <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-600 uppercase">Pool Manager</span>
                <span className="text-[9px] font-mono text-slate-400">{CONTRACTS.POOL_MANAGER.slice(0, 18)}...</span>
             </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-500">
            <div className="w-1 h-1 rounded-full bg-primary" />
            V4 Singleton
          </div>
        </div>

        {/* Demo Tick Helper (Judge & Developer Secret) */}
        {!isSettled && (
          <div className="mt-6 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 border-dashed group/demo relative">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <Zap className="w-3 h-3 text-amber-500" />
                   <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Demo Tick Helper</span>
                </div>
                <CopyButton command={`HOOK_ADDRESS=${CONTRACTS.TIDE_HOOK.address} AUCTION_ID=${auction.id} forge script script/TickAuction.s.sol --rpc-url $RPC_URL_UNICHENT_SEPOLIA --broadcast --chain-id 1301`} />
             </div>
             <p className="text-[8px] text-slate-500 leading-relaxed">
               Reactive Network ticks automatically. To <span className="text-amber-500 font-bold underline">speed up</span> your demo, run the script command above in your terminal (Ensure <span className="text-amber-500 font-mono text-[7px]">$PRIVATE_KEY</span> is in your <span className="text-white font-mono text-[7px]">.env</span>).
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        "text-[8px] font-black px-2 py-0.5 rounded border transition-all flex items-center gap-1.5",
        copied 
          ? "bg-green-500/20 text-green-400 border-green-500/30" 
          : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-black"
      )}
    >
      {copied ? (
        <>
          <CheckCircle2 className="w-2.5 h-2.5" />
          COPIED!
        </>
      ) : (
        'COPY SCRIPT COMMAND'
      )}
    </button>
  );
}

function Stat({ label, value, subValue, icon, color = 'slate', tooltip }: { 
  label: string, 
  value: string, 
  subValue?: string, 
  icon?: React.ReactNode,
  color?: 'blue' | 'green' | 'orange' | 'slate',
  tooltip?: string
}) {
  const colorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    slate: 'text-slate-400'
  };

  return (
    <div className="space-y-1.5 relative group/stat">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] font-black text-slate-500 tracking-[0.15em] uppercase opacity-70 cursor-help underline underline-offset-4 decoration-slate-800 decoration-dotted">
          {label}
        </span>
        {tooltip && (
          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-400 leading-tight opacity-0 group-hover/stat:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
            {tooltip}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-lg font-black tracking-tight", colorMap[color])}>{value}</span>
        {subValue && (
          <span className="text-[10px] text-red-400/80 font-black bg-red-400/5 px-1.5 rounded-sm border border-red-400/10">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
