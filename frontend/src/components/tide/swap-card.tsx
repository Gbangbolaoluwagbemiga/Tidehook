'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowDown, Coins, Zap, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SwapCard() {
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [classification, setClassification] = useState<'RETAIL' | 'WHALE' | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const WHALE_THRESHOLD = 500000; // $500k

  useEffect(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setClassification(null);
      return;
    }
    setClassification(val >= WHALE_THRESHOLD ? 'WHALE' : 'RETAIL');
  }, [amount]);

  const handleSwap = () => {
    if (isDemoMode) {
      setIsSimulating(true);
      // Simulation logic will be expanded
      setTimeout(() => setIsSimulating(false), 2000);
    } else {
      // Live contract call logic (to be added)
      console.log('Live swap initiated');
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
          Swap Tokens
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Demo Mode</span>
          <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token In */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus-within:border-primary/50 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">From</span>
            <span className="text-xs font-medium text-slate-500">Balance: 1.2M {tokenIn}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-slate-700"
            />
            <TokenSelector symbol={tokenIn} />
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-4 relative z-10">
          <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400">
            <ArrowDown className="w-5 h-5" />
          </Button>
        </div>

        {/* Token Out */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">To (Estimated)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-slate-600 grow">
              {amount ? (parseFloat(amount) / 2000).toFixed(4) : '0.00'}
            </div>
            <TokenSelector symbol={tokenOut} />
          </div>
        </div>

        {/* Classification Banner */}
        <AnimatePresence mode="wait">
          {classification && (
            <motion.div
              key={classification}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3 mt-4",
                classification === 'RETAIL' 
                  ? "bg-green-500/5 border-green-500/20 text-green-400" 
                  : "bg-blue-500/5 border-blue-500/20 text-blue-400"
              )}>
                {classification === 'RETAIL' ? <Zap className="w-5 h-5 mt-0.5" /> : <ShieldAlert className="w-5 h-5 mt-0.5" />}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">
                      {classification === 'RETAIL' ? 'Retail Transaction' : 'Whale Transaction Detected'}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider",
                      classification === 'RETAIL' ? "border-green-500/30 text-green-400" : "border-blue-500/30 text-blue-400"
                    )}>
                      {classification === 'RETAIL' ? 'Standard AMM' : 'Dutch Auction'}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed">
                    {classification === 'RETAIL' 
                      ? 'Executing through standard Uniswap v4 pool. Zero extra latency.' 
                      : 'Large size detected. Routing to Dutch Auction to minimize slippage and MEV impact.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
          disabled={!amount || isSimulating}
          onClick={handleSwap}
        >
          {isSimulating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {classification === 'RETAIL' ? 'Executing Swap...' : 'Initiating Auction...'}
            </>
          ) : (
            classification === 'WHALE' ? 'Initiate Whale Auction' : 'Swap Tokens'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function TokenSelector({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
        <Coins className="w-4 h-4 text-slate-400" />
      </div>
      <span className="font-bold text-sm text-white">{symbol}</span>
    </div>
  );
}
