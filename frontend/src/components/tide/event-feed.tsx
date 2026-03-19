'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Terminal, ExternalLink } from 'lucide-react';

interface HookEvent {
  blockNumber: number;
  time: string;
  event: 'WhaleSwapDetected' | 'AuctionStarted' | 'AuctionTick' | 'AuctionSettled' | 'RetailSwap';
  user: string;
  size: string;
  hash: string;
}

export function EventFeed({ events }: { events: HookEvent[] }) {
  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
          <Terminal className="w-5 h-5 text-blue-400" />
          Protocol Activity Feed
        </CardTitle>
        <Badge variant="outline" className="text-[10px] animate-pulse bg-green-500/5 text-green-400 border-green-500/20">
          Live Updates
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Block</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="w-[80px] text-center">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, i) => (
                <TableRow key={i} className="group border-slate-800/50 hover:bg-slate-800/30">
                  <TableCell className="font-mono text-[10px] text-slate-500">{event.blockNumber}</TableCell>
                  <TableCell>
                    <EventBadge type={event.event} />
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-slate-400">
                    {event.user.slice(0, 6)}...{event.user.slice(-4)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-300">{event.size}</TableCell>
                  <TableCell className="text-center">
                    <a href={`https://sepolia.uniscan.xyz/tx/${event.hash}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mx-auto text-slate-500 group-hover:text-primary transition-colors" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function EventBadge({ type }: { type: HookEvent['event'] }) {
  const styles = {
    WhaleSwapDetected: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    AuctionStarted: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    AuctionTick: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    AuctionSettled: "bg-green-500/10 text-green-400 border-green-500/20",
    RetailSwap: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-wider", styles[type])}>
      {type === 'WhaleSwapDetected' ? 'Whale Detected' : type.replace(/([A-Z])/g, ' $1').trim()}
    </Badge>
  );
}

// Helper to avoid import issues
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
