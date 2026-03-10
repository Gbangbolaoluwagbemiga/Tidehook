'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceDecayChart } from './price-decay-chart';
import { Timer, TrendingDown, Layers, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Auction {
  id: string;
  whale: string;
  totalAmount: string;
  filledAmount: string;
  startPrice: number;
  currentPrice: number;
  remainingBlocks: number;
  status: 'ACTIVE' | 'SETTLED';
}

export function AuctionPanel({ auctions }: { auctions: Auction[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          Active Whale Auctions
        </h2>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
          {auctions.filter(a => a.status === 'ACTIVE').length} Running
        </Badge>
      </div>

      {auctions.length === 0 ? (
        <Card className="border-dashed border-slate-800 bg-transparent">
          <CardContent className="h-40 flex flex-col items-center justify-center text-slate-500">
            <Layers className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No active whale auctions detected.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const progress = (parseFloat(auction.filledAmount) / parseFloat(auction.totalAmount)) * 100;

  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold mb-1 flex items-center gap-2">
              Auction #{auction.id.slice(2, 8)}
              {auction.status === 'SETTLED' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </CardTitle>
            <p className="text-xs text-slate-500 font-mono">Whale: {auction.whale.slice(0, 6)}...{auction.whale.slice(-4)}</p>
          </div>
          <Badge className={cn(
            "uppercase text-[10px]",
            auction.status === 'ACTIVE' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
          )}>
            {auction.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total Amount" value={`${parseInt(auction.totalAmount).toLocaleString()} USDC`} />
          <Stat label="Filled" value={`${parseInt(auction.filledAmount).toLocaleString()} USDC`} />
          <Stat 
            label="Current Price" 
            value={`$${auction.currentPrice.toFixed(2)}`} 
            subValue={`-${((1 - auction.currentPrice / auction.startPrice) * 100).toFixed(1)}%`}
          />
          <Stat 
            label="Time Remaining" 
            value={`${auction.remainingBlocks} Blocks`} 
            icon={<Timer className="w-3 h-3 text-slate-500" />}
          />
        </div>

        <PriceDecayChart 
          startPrice={auction.startPrice} 
          currentPrice={auction.currentPrice} 
          duration={300} 
          elapsedBlocks={300 - auction.remainingBlocks} 
        />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, subValue, icon }: { label: string, value: string, subValue?: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-white">{value}</span>
        {subValue && <span className="text-[10px] text-red-400 font-medium">{subValue}</span>}
      </div>
    </div>
  );
}
