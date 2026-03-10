'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PriceDecayChartProps {
  startPrice: number;
  currentPrice: number;
  duration: number;
  elapsedBlocks: number;
}

export function PriceDecayChart({ startPrice, currentPrice, duration, elapsedBlocks }: PriceDecayChartProps) {
  // Generate curve data
  const data = Array.from({ length: 50 }, (_, i) => {
    const block = (i / 49) * duration;
    const price = startPrice - (startPrice * 0.05 * (block / duration));
    return {
      block: Math.floor(block),
      price: price.toFixed(2),
      isCurrent: block <= elapsedBlocks,
    };
  });

  return (
    <div className="w-full h-48 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="block" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            hide 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#3b82f6' }}
            labelStyle={{ color: '#94a3b8' }}
            labelFormatter={(label) => `Block ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
