'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Activity, Database, Clock } from 'lucide-react';
import { CONTRACTS } from '@/contracts';

export function HookStats() {
  const stats = [
    { label: 'Hook Address', value: CONTRACTS.TIDE_HOOK.address, icon: <Database className="w-3.5 h-3.5" /> },
    { label: 'Whale Threshold', value: '$500,000 USDC', icon: <Activity className="w-3.5 h-3.5" /> },
    { label: 'Auction Duration', value: '300 Blocks (~1h)', icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'Reactive Relay', value: '0xdee848...5d4f31', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-800/50 mb-4">
        <CardTitle className="text-sm font-bold text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Protocol Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {stat.icon}
              {stat.label}
            </div>
            <div className="text-xs font-mono text-slate-300 break-all bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
              {stat.value}
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <Badge variant="outline" className="w-full justify-center border-primary/20 bg-primary/5 text-primary text-[10px] py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-2" />
            Reactive Network Listener Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
