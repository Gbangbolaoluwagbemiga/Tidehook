'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function LiquidityImpactChart() {
  // Mock data for impact comparison
  const data = Array.from({ length: 40 }, (_, i) => {
    const x = i;
    // Standard AMM: Sharp drop then flat
    const standardAMM = x < 5 ? 1 - (x * 0.05) : 0.75;
    // TideHook: Gradual decay then settlement
    const tideHook = 1 - (x * 0.005);
    
    return {
      time: i,
      standardAMM: (standardAMM * 100).toFixed(2),
      tideHook: (tideHook * 100).toFixed(2),
    };
  });

  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Price Impact Comparison
        </CardTitle>
        <p className="text-xs text-slate-500">Comparing execution quality for a $1M swap (USDC/ETH)</p>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[70, 105]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              labelStyle={{ display: 'none' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
            <Line 
              name="Standard AMM (Severe Impact)" 
              type="stepAfter" 
              dataKey="standardAMM" 
              stroke="#ef4444" 
              strokeWidth={2} 
              dot={false}
              strokeDasharray="5 5"
            />
            <Line 
              name="TideHook (Smooth Discovery)" 
              type="monotone" 
              dataKey="tideHook" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={false}
              animationDuration={2000}
            />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
