/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** Percentage change, e.g. 12.4 or -8.1. Omit when there isn't enough history to trend. */
  trend?: number;
  trendLabel?: string;
  emptyTrendLabel?: string;
  id?: string;
  className?: string;
}

/**
 * The KPI-tile pattern used on Dashboard/Reports — pulled out as a shared
 * component so new pages don't hand-roll this card shape again. Shows a
 * real up/down trend arrow when `trend` is provided, or an honest
 * "not enough history" line instead of a fabricated number when it's not.
 */
export default function StatTile({ label, value, icon, trend, trendLabel = 'last 30 days', emptyTrendLabel = 'Not enough history to trend yet', id, className }: StatTileProps) {
  const isUp = typeof trend === 'number' && trend >= 0;

  return (
    <Card id={id} className={cn('bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[12px] font-medium uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-2.5">
        <h3 className="text-[24px] font-bold text-foreground">{value}</h3>
        {typeof trend === 'number' ? (
          <div className="flex items-center mt-1 space-x-1.5 text-xs font-medium">
            <span className={cn('inline-flex items-center gap-0.5', isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
              {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{trendLabel}</span>
          </div>
        ) : (
          <div className="mt-1 text-xs text-muted-foreground">{emptyTrendLabel}</div>
        )}
      </div>
    </Card>
  );
}
