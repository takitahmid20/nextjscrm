/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Percent,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Layers,
  PhoneCall
} from 'lucide-react';
import { Lead, Deal, CRMTask, Activity } from '../types';
import { formatUSD, formatRelativeTime } from '../utils';
import { Card } from '@/components/ui/card';
import { useCRM } from '../context/CRMContext';

interface DashboardViewProps {
  leads: Lead[];
  deals: Deal[];
  tasks: CRMTask[];
  activities: Activity[];
  setTab: (tab: string) => void;
  onAddNote?: (note: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// SVG plot geometry for the revenue trend chart.
const CHART_WIDTH = 500;
const CHART_HEIGHT = 120;
const CHART_MARGIN_X = 30;
const CHART_TOP = 15;
const CHART_BOTTOM = 100;

interface TrendPoint {
  label: string;
  value: number;
}

interface TrendDelta {
  pct: number;
  direction: 'up' | 'down' | 'flat';
}

/** Returns true if `dateStr` falls within (now - endDaysAgo, now - startDaysAgo]. */
function inWindow(dateStr: string | undefined, now: number, startDaysAgo: number, endDaysAgo: number): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return t <= now - startDaysAgo * DAY_MS && t > now - endDaysAgo * DAY_MS;
}

/** Period-over-period % change. Returns null when there's no real baseline to compare against. */
function computeTrend(current: number, prior: number): TrendDelta | null {
  if (prior <= 0) return null;
  const pct = ((current - prior) / prior) * 100;
  return { pct, direction: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' };
}

/**
 * Buckets won deals by month (using expectedCloseDate as the "realized" date, falling back
 * to createdAt) and sums their value per bucket. Falls back to weekly buckets, and finally to
 * an empty series, when there isn't enough date spread in the data for a meaningful trend line.
 */
function buildRevenueTrend(deals: Deal[]): TrendPoint[] {
  const wonDeals = deals.filter((d) => d.status === 'Won');
  if (wonDeals.length === 0) return [];

  const dateFor = (d: Deal) => d.expectedCloseDate || d.createdAt;

  const monthBuckets = new Map<string, { label: string; value: number; sortKey: number }>();
  wonDeals.forEach((d) => {
    const date = new Date(dateFor(d));
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthBuckets.get(key);
    if (bucket) {
      bucket.value += d.value;
    } else {
      monthBuckets.set(key, {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        value: d.value,
        sortKey: date.getFullYear() * 12 + date.getMonth(),
      });
    }
  });

  if (monthBuckets.size >= 2) {
    return Array.from(monthBuckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ label, value }) => ({ label, value }));
  }

  // Not enough monthly spread (e.g. every won deal closed in the same month) — try weekly buckets.
  const weekBuckets = new Map<string, { label: string; value: number; sortKey: number }>();
  wonDeals.forEach((d) => {
    const date = new Date(dateFor(d));
    if (Number.isNaN(date.getTime())) return;
    const weekIndex = Math.floor(date.getTime() / (7 * DAY_MS));
    const bucket = weekBuckets.get(String(weekIndex));
    if (bucket) {
      bucket.value += d.value;
    } else {
      weekBuckets.set(String(weekIndex), {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: d.value,
        sortKey: weekIndex,
      });
    }
  });

  if (weekBuckets.size >= 2) {
    return Array.from(weekBuckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ label, value }) => ({ label, value }));
  }

  // Still just a single data point in time — not enough for a trend line.
  return [];
}

/** Linear-scales a real value series into SVG plot coordinates. */
function layoutLineChart(points: TrendPoint[]) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const n = points.length;
  const usableWidth = CHART_WIDTH - CHART_MARGIN_X * 2;

  const coords = points.map((p, i) => {
    const x = n === 1 ? CHART_WIDTH / 2 : CHART_MARGIN_X + (i / (n - 1)) * usableWidth;
    const y = range === 0
      ? (CHART_TOP + CHART_BOTTOM) / 2
      : CHART_BOTTOM - ((p.value - min) / range) * (CHART_BOTTOM - CHART_TOP);
    return { x, y, value: p.value, label: p.label };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${CHART_HEIGHT} L ${coords[0].x.toFixed(1)},${CHART_HEIGHT} Z`
    : '';

  return { coords, linePath, areaPath };
}

function TrendBadge({ trend, positiveIsGood = true }: { trend: TrendDelta | null; positiveIsGood?: boolean }) {
  if (!trend) return null;
  const isGood = positiveIsGood ? trend.direction === 'up' : trend.direction === 'down';
  const colorClass = trend.direction === 'flat'
    ? 'text-muted-foreground'
    : isGood ? 'text-emerald-600' : 'text-rose-600';
  const sign = trend.pct > 0 ? '+' : '';
  return (
    <span className={colorClass}>{sign}{trend.pct.toFixed(1)}%</span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard data">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-64 rounded bg-muted animate-pulse" />
          <div className="h-3 w-80 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[8px] bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-[280px] rounded-[8px] bg-muted animate-pulse lg:col-span-2" />
        <div className="h-[280px] rounded-[8px] bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] rounded-[8px] bg-muted animate-pulse" />
        <div className="h-[300px] rounded-[8px] bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardView({ leads, deals, tasks, activities, setTab }: DashboardViewProps) {
  // Read defensively: this only depends on an optional `loading` flag so the component
  // still compiles and renders correctly (treating data as ready) even if the CRM context
  // shape doesn't expose one yet.
  const crmState: { loading?: boolean } = useCRM();
  const loading = crmState.loading ?? false;

  // Compute true business metrics
  const totalLeads = leads.length;

  const wonDeals = deals.filter(d => d.status === 'Won');
  const totalDealsWon = wonDeals.length;

  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const tasksDue = tasks.filter(t => t.status === 'Pending').length;

  const closedDealsCount = deals.filter(d => d.status === 'Won' || d.status === 'Lost').length;
  const conversionRate = closedDealsCount > 0
    ? Math.round((totalDealsWon / closedDealsCount) * 100)
    : null;

  // Real period-over-period deltas (last 30 days vs the 30 days before that).
  const now = Date.now();

  const leadsLast30 = leads.filter(l => inWindow(l.createdAt, now, 0, 30)).length;
  const leadsPrior30 = leads.filter(l => inWindow(l.createdAt, now, 30, 60)).length;
  const leadsTrend = computeTrend(leadsLast30, leadsPrior30);

  const wonDealDate = (d: Deal) => d.expectedCloseDate || d.createdAt;
  const wonLast30 = wonDeals.filter(d => inWindow(wonDealDate(d), now, 0, 30));
  const wonPrior30 = wonDeals.filter(d => inWindow(wonDealDate(d), now, 30, 60));
  const dealsWonTrend = computeTrend(wonLast30.length, wonPrior30.length);

  const revenueLast30 = wonLast30.reduce((sum, d) => sum + d.value, 0);
  const revenuePrior30 = wonPrior30.reduce((sum, d) => sum + d.value, 0);
  const revenueTrend = computeTrend(revenueLast30, revenuePrior30);

  // Real monthly (or weekly, if not enough spread) revenue trend for the line chart.
  const revenueTrendSeries = buildRevenueTrend(deals);
  const hasChartableTrend = revenueTrendSeries.length >= 2;
  const { coords: chartCoords, linePath: chartLinePath, areaPath: chartAreaPath } = hasChartableTrend
    ? layoutLineChart(revenueTrendSeries)
    : { coords: [], linePath: '', areaPath: '' };
  const chartRangeLabel = hasChartableTrend
    ? `${revenueTrendSeries[0].label} – ${revenueTrendSeries[revenueTrendSeries.length - 1].label}`
    : null;

  // Sources count computed from Leads
  const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});
  const sourceEntries = Object.keys(sourceCounts);
  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1);
  const websiteInboundCount = leads.filter(l => l.source === 'Website' || l.source === 'Inbound').length;
  const websiteInboundPct = totalLeads > 0 ? Math.round((websiteInboundCount / totalLeads) * 100) : 0;

  const openDeals = deals.filter(d => d.status === 'Open');

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 select-none">
        <div>
          <h1 id="dashboard-main-title" className="text-[28px] font-semibold text-foreground tracking-tight">
            Executive CRM Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Operational briefing and core business metric indicators.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2.5 py-1 bg-card border border-border rounded-[6px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            All Feeds Live
          </span>
          <a
            href="/leads"
            onClick={(e) => {
              e.preventDefault();
              setTab('leads');
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm px-4 h-9 rounded-[6px] justify-center"
          >
            Manage Operations
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid - Strict Border Separations using shadcn Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* widget 1: Total Leads */}
        <Card id="kpi-card-leads" className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Total Leads</span>
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{totalLeads}</h3>
            {leadsTrend ? (
              <div className="flex items-center mt-1 space-x-1.5 text-xs font-medium">
                <TrendBadge trend={leadsTrend} />
                <span className="text-muted-foreground">last 30 days</span>
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">Not enough history to trend yet</div>
            )}
          </div>
        </Card>

        {/* widget 2: Deals Won */}
        <Card id="kpi-card-deals" className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Deals Won</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{totalDealsWon}</h3>
            {dealsWonTrend ? (
              <div className="flex items-center mt-1 space-x-1.5 text-xs font-medium">
                <TrendBadge trend={dealsWonTrend} />
                <span className="text-muted-foreground">last 30 days</span>
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">Not enough history to trend yet</div>
            )}
          </div>
        </Card>

        {/* widget 3: Revenue (won deals) */}
        <Card id="kpi-card-revenue" className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Revenue Realized</span>
            <DollarSign className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{formatUSD(totalRevenue)}</h3>
            {revenueTrend ? (
              <div className="flex items-center mt-1 space-x-1.5 text-xs font-medium">
                <TrendBadge trend={revenueTrend} />
                <span className="text-muted-foreground">last 30 days</span>
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">All-time total to date</div>
            )}
          </div>
        </Card>

        {/* widget 4: Tasks Due */}
        <Card id="kpi-card-tasks" className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Tasks Pending</span>
            <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{tasksDue}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-amber-600 font-medium">
              <span>{tasksDue > 2 ? 'Requires assignment' : 'All clear'}</span>
            </div>
          </div>
        </Card>

        {/* widget 5: Conversion Rate */}
        <Card id="kpi-card-conversion" className="bg-card border border-border rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium uppercase tracking-wider">Conversion %</span>
            <Percent className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-[24px] font-bold text-foreground">{conversionRate !== null ? `${conversionRate}%` : '—'}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-muted-foreground">
              <span>{conversionRate !== null ? 'Closed Won vs Lost' : 'No closed deals yet'}</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Line Chart: Revenue Sales Timeline */}
        <Card id="dashboard-panel-revenue-chart" className="bg-card border border-border rounded-[8px] p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4 select-none">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Company Realized Revenue Trends</h2>
              <p className="text-[11px] text-muted-foreground">Incremental aggregate closed won targets value ($)</p>
            </div>
            {chartRangeLabel && (
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-[4px] border border-primary/20">
                {chartRangeLabel}
              </span>
            )}
          </div>

          {hasChartableTrend ? (
            <>
              {/* Custom SVG Line Chart representation, computed from real won-deal data */}
              <div className="h-[200px] w-full flex items-end relative pt-4">
                {/* Grid background lines */}
                <div className="absolute inset-x-0 top-1/4 h-[1px] bg-border/60" />
                <div className="absolute inset-x-0 top-2/4 h-[1px] bg-border/60" />
                <div className="absolute inset-x-0 top-3/4 h-[1px] bg-border/60" />

                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-full overflow-visible text-primary" role="img" aria-label={`Realized revenue trend from ${chartRangeLabel}`}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shading fill below line */}
                  <path d={chartAreaPath} fill="url(#chartGradient)" />

                  {/* Main Trend Line */}
                  <path
                    d={chartLinePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Data Node Indicators + values */}
                  {chartCoords.map((c, i) => (
                    <g key={i}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={i === chartCoords.length - 1 ? 4.5 : 4}
                        fill={i === chartCoords.length - 1 ? 'currentColor' : 'var(--card)'}
                        stroke="currentColor"
                        strokeWidth={i === chartCoords.length - 1 ? 1.5 : 2}
                      />
                      <text
                        x={c.x}
                        y={Math.max(c.y - 10, 10)}
                        fontSize="8"
                        fill="currentColor"
                        fontWeight={i === chartCoords.length - 1 ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {formatUSD(c.value)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* X axis descriptions */}
              <div className="flex justify-between px-6 pt-3 text-[10px] font-mono text-muted-foreground uppercase select-none font-semibold border-t border-border">
                {revenueTrendSeries.map((d, index) => (
                  <span key={index}>{d.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] w-full flex flex-col items-center justify-center text-center gap-1 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Not enough closed-won deal history yet to chart a trend.
              </p>
              {totalRevenue > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Total realized revenue to date: <span className="font-semibold text-foreground">{formatUSD(totalRevenue)}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Bar Chart: User Lead Sources Acquisition */}
        <Card id="dashboard-panel-source-chart" className="bg-card border border-border rounded-[8px] p-5 flex flex-col justify-between">
          <div className="pb-4 border-b border-border mb-4 select-none">
            <h2 className="text-[15px] font-semibold text-foreground">MQL Sources Acquisition</h2>
            <p className="text-[11px] text-muted-foreground">Channels attributing marketing leads count</p>
          </div>

          {sourceEntries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center text-muted-foreground text-xs">
              No lead source data recorded yet.
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {sourceEntries.map((source) => {
                const count = sourceCounts[source];
                const pct = (count / maxSourceCount) * 100;
                return (
                  <div key={source} className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-foreground">{source}</span>
                      <span className="font-mono text-muted-foreground font-semibold">{count} Lead{count > 1 ? 's' : ''}</span>
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

          {totalLeads > 0 && (
            <div className="pt-3 text-[11px] text-muted-foreground text-center border-t border-border mt-3 select-none">
              Website & Inbound forms count <strong className="text-foreground">{websiteInboundPct}%</strong> of traffic
            </div>
          )}
        </Card>

      </div>

      {/* Grid: Recent Operational Feed & High-Value Open Pipelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Operations logs feed */}
        <Card id="dashboard-operations-log" className="bg-card border border-border rounded-[8px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-[15px] font-semibold text-foreground">Audit Logs & Activity</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">Real-time operational sync</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto crm-scrollbar">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No recent workspace operations recorded.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex space-x-3 text-xs">
                  <div className="pt-0.5">
                    <span className={`h-6 w-6 rounded-[4px] flex items-center justify-center ${
                      act.type === 'deal_won' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      act.type === 'lead_created' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      act.type === 'task_completed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {act.type === 'deal_won' ? <TrendingUp className="h-3.5 w-3.5" /> :
                       act.type === 'lead_created' ? <Users className="h-3.5 w-3.5" /> :
                       act.type === 'task_completed' ? <ClipboardList className="h-3.5 w-3.5" /> :
                       <PhoneCall className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-normal font-sans">
                      <strong className="text-foreground">{act.user}</strong>: {act.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{formatRelativeTime(act.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: High-Value Open Deals */}
        <Card id="dashboard-open-deals" className="bg-card border border-border rounded-[8px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-[15px] font-semibold text-foreground">Active Open Pipeline</h2>
            </div>
            <span className="text-[11px] text-primary font-medium">{openDeals.length} Open Deal{openDeals.length === 1 ? '' : 's'}</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto crm-scrollbar">
            {openDeals.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                No open deals in the pipeline right now.
              </div>
            ) : (
              openDeals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="p-3 border border-border rounded-[6px] hover:border-primary/40 transition-colors select-none flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-foreground hover:text-primary transition-colors">{deal.title}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-muted-foreground mt-1.5 font-sans">
                      <span className="font-medium text-foreground">{deal.company}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-[4px] border border-primary/20">{deal.stage}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground text-[13px] block">{formatUSD(deal.value)}</span>
                    <span className="text-[10px] text-muted-foreground">{deal.assignedTo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
