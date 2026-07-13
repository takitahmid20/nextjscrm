/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  DollarSign,
  Percent,
  BarChart3,
  Trophy,
  Users,
  Target,
  Funnel,
  XCircle,
  Crown,
} from 'lucide-react';
import { Lead, Deal, CRMTask, Activity, Account, DealStage, LeadSource } from '../types';
import { formatUSD } from '../utils';
import { Card } from '@/components/ui/card';

interface ReportsViewProps {
  leads: Lead[];
  deals: Deal[];
  tasks: CRMTask[];
  activities: Activity[];
  accounts: Account[];
  loading: boolean;
}

// Ordered funnel stages — 'Won' terminates the flow, 'Lost' is tracked
// separately as its own terminal bucket rather than folded into the funnel.
const FUNNEL_STAGES: DealStage[] = [
  'Lead In',
  'Contact Made',
  'Demo Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
];

// Simple, clearly-labeled stage → win-probability heuristic used only for the
// weighted pipeline forecast below. Not derived from historical conversion
// data (there isn't enough of it here) — just a reasonable working estimate.
const STAGE_PROBABILITY: Record<DealStage, number> = {
  'Lead In': 0.1,
  'Contact Made': 0.25,
  'Demo Scheduled': 0.4,
  'Proposal Sent': 0.6,
  Negotiation: 0.8,
  Won: 1,
  Lost: 0,
};

// A conversion-rate-between-stages figure is only meaningful once there's a
// reasonable amount of deal volume behind it; below this we just show counts.
const MIN_DEALS_FOR_CONVERSION_PCT = 8;

interface RepStats {
  name: string;
  dealsWon: number;
  wonValue: number;
  openDeals: number;
  openValue: number;
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading reports data">
      <div className="space-y-2">
        <div className="h-6 w-64 rounded bg-muted animate-pulse" />
        <div className="h-3 w-80 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[8px] bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-[260px] rounded-[8px] bg-muted animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[280px] rounded-[8px] bg-muted animate-pulse" />
        <div className="h-[280px] rounded-[8px] bg-muted animate-pulse" />
      </div>
      <div className="h-[320px] rounded-[8px] bg-muted animate-pulse" />
    </div>
  );
}

export default function ReportsView({ deals, leads, loading }: ReportsViewProps) {
  if (loading) {
    return <ReportsSkeleton />;
  }

  const openDeals = deals.filter((d) => d.status === 'Open');
  const wonDeals = deals.filter((d) => d.status === 'Won');
  const lostDeals = deals.filter((d) => d.status === 'Lost');

  // ---------------------------------------------------------------------
  // 1. Pipeline funnel — deal count + value at each stage in flow order.
  //    'Lost' deals are excluded from the funnel and shown as a separate
  //    terminal bucket further down (Win/Loss section).
  // ---------------------------------------------------------------------
  const funnelData = FUNNEL_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });
  const maxFunnelCount = Math.max(...funnelData.map((f) => f.count), 1);
  const totalFunnelDeals = funnelData.reduce((sum, f) => sum + f.count, 0);
  const hasEnoughForConversionPct = deals.length >= MIN_DEALS_FOR_CONVERSION_PCT;

  // ---------------------------------------------------------------------
  // 2. Win / Loss breakdown
  // ---------------------------------------------------------------------
  const totalWonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const totalLostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? (wonDeals.length / closedCount) * 100 : null;

  // ---------------------------------------------------------------------
  // 3. Rep leaderboard — grouped by assignedTo, sorted by won value desc.
  // ---------------------------------------------------------------------
  const repMap = new Map<string, RepStats>();
  deals.forEach((deal) => {
    const name = deal.assignedTo || 'Unassigned';
    const existing = repMap.get(name) ?? { name, dealsWon: 0, wonValue: 0, openDeals: 0, openValue: 0 };
    if (deal.status === 'Won') {
      existing.dealsWon += 1;
      existing.wonValue += deal.value;
    } else if (deal.status === 'Open') {
      existing.openDeals += 1;
      existing.openValue += deal.value;
    }
    repMap.set(name, existing);
  });
  const repLeaderboard = Array.from(repMap.values()).sort((a, b) => b.wonValue - a.wonValue);
  const repsWithOpenPipeline = repLeaderboard.filter((r) => r.openDeals > 0).length;

  // ---------------------------------------------------------------------
  // 4. Simple weighted pipeline forecast — an estimate, not a guarantee.
  // ---------------------------------------------------------------------
  const weightedForecast = openDeals.reduce(
    (sum, d) => sum + d.value * (STAGE_PROBABILITY[d.stage] ?? 0),
    0
  );
  const openPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);

  // ---------------------------------------------------------------------
  // 5. Lead source performance — lead count per source. A conversion signal
  //    would require joining leads -> deals by company name, which is a
  //    fragile string match (no real foreign key in the data model), so we
  //    report the honest, directly-computed metric instead: lead volume.
  // ---------------------------------------------------------------------
  const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<LeadSource, number>);
  const sourceEntries = Object.entries(sourceCounts) as [LeadSource, number][];
  const maxSourceCount = Math.max(...sourceEntries.map(([, c]) => c), 1);

  // KPI tiles
  const avgDealSize = wonDeals.length > 0 ? totalWonValue / wonDeals.length : null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="select-none">
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
          Reports &amp; Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Pipeline health, win/loss trends, rep performance, and forecasted revenue.
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Open Pipeline Value</span>
            <DollarSign className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{formatUSD(openPipelineValue)}</h3>
            <div className="mt-1 text-xs text-muted-foreground">{openDeals.length} open deal{openDeals.length === 1 ? '' : 's'}</div>
          </div>
        </Card>

        <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Win Rate</span>
            <Percent className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{winRate !== null ? `${winRate.toFixed(0)}%` : '—'}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {closedCount > 0 ? `${wonDeals.length} won of ${closedCount} closed` : 'No closed deals yet'}
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Avg Deal Size (Won)</span>
            <Target className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{avgDealSize !== null ? formatUSD(avgDealSize) : '—'}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {avgDealSize !== null ? `Across ${wonDeals.length} won deal${wonDeals.length === 1 ? '' : 's'}` : 'No won deals yet'}
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Reps w/ Open Pipeline</span>
            <Users className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{repsWithOpenPipeline}</h3>
            <div className="mt-1 text-xs text-muted-foreground">of {repLeaderboard.length} rep{repLeaderboard.length === 1 ? '' : 's'} with assigned deals</div>
          </div>
        </Card>
      </div>

      {/* 1. Pipeline Funnel */}
      <Card className="bg-card border border-border rounded-[8px] p-5">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4 select-none">
          <div className="flex items-center gap-2">
            <Funnel className="h-4.5 w-4.5 text-primary" />
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Pipeline Funnel</h2>
              <p className="text-[11px] text-muted-foreground">Open deal flow by stage, in progression order</p>
            </div>
          </div>
          {lostDeals.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              {lostDeals.length} lost deal{lostDeals.length === 1 ? '' : 's'} tracked separately below
            </span>
          )}
        </div>

        {totalFunnelDeals === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No deals recorded yet to build a pipeline funnel.
          </div>
        ) : (
          <div className="space-y-3">
            {funnelData.map((stageInfo, i) => {
              const widthPct = (stageInfo.count / maxFunnelCount) * 100;
              const prevCount = i > 0 ? funnelData[i - 1].count : null;
              const conversionFromPrev =
                hasEnoughForConversionPct && prevCount && prevCount > 0
                  ? (stageInfo.count / prevCount) * 100
                  : null;
              return (
                <div key={stageInfo.stage} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <span className="font-medium text-foreground">{stageInfo.stage}</span>
                    <span className="font-mono text-muted-foreground font-semibold flex items-center gap-2">
                      {conversionFromPrev !== null && (
                        <span className="text-primary">{conversionFromPrev.toFixed(0)}% from prior</span>
                      )}
                      <span>{stageInfo.count} deal{stageInfo.count === 1 ? '' : 's'} · {formatUSD(stageInfo.value)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-[4px] overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-[4px] transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!hasEnoughForConversionPct && (
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                Not enough deal volume yet ({deals.length} total) for a reliable stage-to-stage conversion percentage — showing raw counts and values instead.
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Win / Loss Breakdown */}
        <Card className="bg-card border border-border rounded-[8px] p-5">
          <div className="flex items-center gap-2 pb-4 border-b border-border mb-4 select-none">
            <Trophy className="h-4.5 w-4.5 text-primary" />
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Win / Loss Breakdown</h2>
              <p className="text-[11px] text-muted-foreground">Closed deal outcomes, count and value</p>
            </div>
          </div>

          {closedCount === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No deals have closed (won or lost) yet — nothing to compare.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-[6px] border border-border bg-emerald-500/5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Won</div>
                  <div className="text-[20px] font-bold text-foreground mt-1">{wonDeals.length}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-0.5">{formatUSD(totalWonValue)}</div>
                </div>
                <div className="p-3 rounded-[6px] border border-border bg-rose-500/5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Lost</div>
                  <div className="text-[20px] font-bold text-foreground mt-1">{lostDeals.length}</div>
                  <div className="text-xs text-rose-600 font-medium mt-0.5">{formatUSD(totalLostValue)}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">Win Rate</span>
                  <span className="font-mono text-muted-foreground font-semibold">{winRate?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-rose-500/20 h-2.5 rounded-[4px] overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-[4px] transition-all duration-500"
                    style={{ width: `${winRate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 4. Simple Forecast */}
        <Card className="bg-card border border-border rounded-[8px] p-5">
          <div className="flex items-center gap-2 pb-4 border-b border-border mb-4 select-none">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Weighted Pipeline Forecast</h2>
              <p className="text-[11px] text-muted-foreground">Open deal value × stage-probability heuristic</p>
            </div>
          </div>

          {openDeals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No open deals in the pipeline to forecast.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-[24px] font-bold text-foreground">{formatUSD(weightedForecast)}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Estimated, not guaranteed — of {formatUSD(openPipelineValue)} total open pipeline value.
                </p>
              </div>
              <div className="space-y-1.5">
                {FUNNEL_STAGES.filter((s) => s !== 'Won').map((stage) => (
                  <div key={stage} className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{stage}</span>
                    <span className="font-mono">{Math.round(STAGE_PROBABILITY[stage] * 100)}% win probability</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Rep Leaderboard */}
      <Card className="bg-card border border-border rounded-[8px] p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-border mb-4 select-none">
          <Crown className="h-4.5 w-4.5 text-primary" />
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Rep Leaderboard</h2>
            <p className="text-[11px] text-muted-foreground">Ranked by total won value</p>
          </div>
        </div>

        {repLeaderboard.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No deals have been assigned to a rep yet.
          </div>
        ) : (
          <div className="overflow-x-auto crm-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Rep</th>
                  <th className="py-2 pr-4 font-medium text-right">Deals Won</th>
                  <th className="py-2 pr-4 font-medium text-right">Won Value</th>
                  <th className="py-2 pr-4 font-medium text-right">Open Deals</th>
                  <th className="py-2 font-medium text-right">Open Pipeline Value</th>
                </tr>
              </thead>
              <tbody>
                {repLeaderboard.map((rep, i) => (
                  <tr key={rep.name} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-foreground flex items-center gap-1.5">
                      {i === 0 && rep.wonValue > 0 && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      {rep.name}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-foreground">{rep.dealsWon}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-emerald-600">{formatUSD(rep.wonValue)}</td>
                    <td className="py-2.5 pr-4 text-right text-foreground">{rep.openDeals}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{formatUSD(rep.openValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. Lead Source Performance */}
      <Card className="bg-card border border-border rounded-[8px] p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-border mb-4 select-none">
          <Users className="h-4.5 w-4.5 text-primary" />
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Lead Source Performance</h2>
            <p className="text-[11px] text-muted-foreground">
              Lead volume by acquisition channel — leads and deals are only linked by company name in this
              data model, so a reliable per-source conversion rate can&apos;t be joined; shown as raw counts instead.
            </p>
          </div>
        </div>

        {sourceEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No lead source data recorded yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {sourceEntries
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const pct = (count / maxSourceCount) * 100;
                return (
                  <div key={source} className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-foreground">{source}</span>
                      <span className="font-mono text-muted-foreground font-semibold">{count} lead{count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-[4px] overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-[4px] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>
    </div>
  );
}

export { ReportsSkeleton };
