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
  Calendar,
  Layers,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { Lead, Deal, CRMTask, Activity } from '../types';
import { formatUSD, formatRelativeTime } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  leads: Lead[];
  deals: Deal[];
  tasks: CRMTask[];
  activities: Activity[];
  setTab: (tab: string) => void;
  onAddNote?: (note: string) => void;
}

export default function DashboardView({ leads, deals, tasks, activities, setTab }: DashboardViewProps) {
  // Compute true business metrics
  const totalLeads = leads.length;
  
  const wonDeals = deals.filter(d => d.status === 'Won');
  const totalDealsWon = wonDeals.length;
  
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  
  const tasksDue = tasks.filter(t => t.status === 'Pending').length;
  
  const closedDealsCount = deals.filter(d => d.status === 'Won' || d.status === 'Lost').length;
  const conversionRate = closedDealsCount > 0 
    ? Math.round((totalDealsWon / closedDealsCount) * 100) 
    : 71; // Default fallbacks based on realistic static values

  // Hardcoded monthly sales analytics data for line chart
  const lineChartData = [
    { label: 'Jan', value: 28000 },
    { label: 'Feb', value: 34000 },
    { label: 'Mar', value: 45000 },
    { label: 'Apr', value: 52000 },
    { label: 'May', value: 89000 }, // Current high point in simulated May
    { label: 'Jun', value: 97000 }
  ];

  // Sources count computed from Leads
  const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1);

  return (
    <div className="space-y-6">
      {/* Page Title & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 select-none">
        <div>
          <h1 id="dashboard-main-title" className="text-28px font-semibold text-[#111827] tracking-tight">
            Executive CRM Monitor
          </h1>
          <p className="text-sm text-[#6B7280]">
            Operational briefing and core business metric indicators.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-[6px] text-[#6B7280] flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            All Feeds Live
          </span>
          <a 
            href="/leads"
            onClick={(e) => {
              e.preventDefault();
              setTab('leads');
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm px-4 h-9 rounded-[6px] justify-center"
          >
            Manage Operations
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid - Strict Border Separations using shadcn Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* widget 1: Total Leads */}
        <Card id="kpi-card-leads" className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[12px] font-medium uppercase tracking-wider">Total Leads</span>
            <Users className="h-4.5 w-4.5 text-[#2563EB]" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-24px font-bold text-[#111827]">{totalLeads}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-emerald-600 font-medium">
              <span>+14.2%</span>
              <span className="text-[#6B7280]">this quarter</span>
            </div>
          </div>
        </Card>

        {/* widget 2: Deals Won */}
        <Card id="kpi-card-deals" className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[12px] font-medium uppercase tracking-wider">Deals Won</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-24px font-bold text-[#111827]">{totalDealsWon}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-emerald-600 font-medium">
              <span>+8.3%</span>
              <span className="text-[#6B7280]">vs target quota</span>
            </div>
          </div>
        </Card>

        {/* widget 3: Revenue (won deals) */}
        <Card id="kpi-card-revenue" className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[12px] font-medium uppercase tracking-wider">Revenue Realized</span>
            <DollarSign className="h-4.5 w-4.5 text-[#2563EB]" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-24px font-bold text-[#111827]">{formatUSD(totalRevenue)}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-indigo-600 font-medium">
              <span>SaaS Integrations</span>
            </div>
          </div>
        </Card>

        {/* widget 4: Tasks Due */}
        <Card id="kpi-card-tasks" className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[12px] font-medium uppercase tracking-wider">Tasks Pending</span>
            <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-24px font-bold text-[#111827]">{tasksDue}</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-amber-600 font-medium">
              <span>{tasksDue > 2 ? 'Requires assignment' : 'All clear'}</span>
            </div>
          </div>
        </Card>

        {/* widget 5: Conversion Rate */}
        <Card id="kpi-card-conversion" className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[12px] font-medium uppercase tracking-wider">Conversion %</span>
            <Percent className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-24px font-bold text-[#111827]">{conversionRate}%</h3>
            <div className="flex items-center mt-1 space-x-1.5 text-xs text-[#6B7280]">
              <span>Closed Won vs Lost</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Revenue Sales Timeline */}
        <Card id="dashboard-panel-revenue-chart" className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-4 select-none">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111827]">Company Realized Revenue Trends</h2>
              <p className="text-[11px] text-[#6B7280]">Incremental aggregate closed won targets value ($)</p>
            </div>
            <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-[4px] border border-[#2563EB]/10">
              Q1-Q2 Aggregates
            </span>
          </div>
          
          {/* Custom SVG Line Chart representation - Pixel perfect, non-fragile */}
          <div className="h-[200px] w-full flex items-end relative pt-4">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-1/4 h-[1px] bg-gray-100" />
            <div className="absolute inset-x-0 top-2/4 h-[1px] bg-gray-100" />
            <div className="absolute inset-x-0 top-3/4 h-[1px] bg-gray-100" />

            <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
              {/* Definition for smooth fill gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Main Trend Line Area */}
              <path
                d="M 50,100 L 120,90 L 190,75 L 260,65 L 330,25 L 420,15"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              
              {/* Shading fill below line */}
              <path
                d="M 50,100 L 120,90 L 190,75 L 260,65 L 330,25 L 420,15 L 420,110 L 50,110 Z"
                fill="url(#chartGradient)"
              />
              
              {/* Data Node Indicators */}
              <circle cx="50" cy="100" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <circle cx="120" cy="90" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <circle cx="190" cy="75" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <circle cx="260" cy="65" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <circle cx="330" cy="25" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <circle cx="420" cy="15" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
              
              {/* Coordinate Values hover values representation */}
              <text x="50" y="85" fontSize="8" fill="#6B7280" textAnchor="middle" fontFamily="monospace">$28k</text>
              <text x="190" y="60" fontSize="8" fill="#6B7280" textAnchor="middle" fontFamily="monospace">$45k</text>
              <text x="330" y="12" fontSize="8" fill="#2563EB" fontWeight="bold" textAnchor="middle" fontFamily="monospace">$89k</text>
              <text x="420" y="5" fontSize="8" fill="#2563EB" fontWeight="bold" textAnchor="middle" fontFamily="monospace">$97k</text>
            </svg>
          </div>
          
          {/* X axis descriptions */}
          <div className="flex justify-between px-6 pt-3 text-[10px] font-mono text-[#6B7280] uppercase select-none font-semibold border-t border-[#E5E7EB]">
            {lineChartData.map((d, index) => (
              <span key={index}>{d.label}</span>
            ))}
          </div>
        </Card>

        {/* Bar Chart: User Lead Sources Acquisition */}
        <Card id="dashboard-panel-source-chart" className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 flex flex-col justify-between">
          <div className="pb-4 border-b border-[#E5E7EB] mb-4 select-none">
            <h2 className="text-[15px] font-semibold text-[#111827]">MQL Sources Acquisition</h2>
            <p className="text-[11px] text-[#6B7280]">Channels attributing marketing leads count</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {Object.keys(sourceCounts).map((source) => {
              const count = sourceCounts[source];
              const pct = (count / maxSourceCount) * 100;
              return (
                <div key={source} className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-[#111827]">{source}</span>
                    <span className="font-mono text-[#6B7280] font-semibold">{count} Lead{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-[#F5F6F8] h-2.5 rounded-[4px] overflow-hidden">
                    <div 
                      className="bg-[#2563EB] h-full rounded-[4px] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 text-[11px] text-[#6B7280] text-center border-t border-[#E5E7EB] mt-3 select-none">
            Website & Inbound forms count <strong>51%</strong> of traffic
          </div>
        </Card>

      </div>

      {/* Grid: Recent Operational Feed & High-Value Open Pipelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Operations logs feed */}
        <Card id="dashboard-operations-log" className="bg-white border border-[#E5E7EB] rounded-[8px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#2563EB]" />
              <h2 className="text-[15px] font-semibold text-[#111827]">Audit Logs & Activity</h2>
            </div>
            <span className="text-[11px] text-[#6B7280]">Real-time operational sync</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto crm-scrollbar">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-[#6B7280] text-xs">
                No recent workspace operations recorded.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex space-x-3 text-xs">
                  <div className="pt-0.5">
                    <span className={`h-6 w-6 rounded-[4px] flex items-center justify-center ${
                      act.type === 'deal_won' ? 'bg-emerald-50 text-emerald-600 border border-emerald-120' :
                      act.type === 'lead_created' ? 'bg-blue-50 text-blue-600 border border-blue-120' :
                      act.type === 'task_completed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-120' :
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {act.type === 'deal_won' ? <TrendingUp className="h-3.5 w-3.5" /> : 
                       act.type === 'lead_created' ? <Users className="h-3.5 w-3.5" /> :
                       act.type === 'task_completed' ? <ClipboardList className="h-3.5 w-3.5" /> :
                       <PhoneCall className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#111827] leading-normal font-sans">
                      <strong className="text-[#111827]">{act.user}</strong>: {act.description}
                    </p>
                    <span className="text-[10px] text-[#6B7280] mt-0.5 block">{formatRelativeTime(act.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: High-Value Open Deals */}
        <Card id="dashboard-open-deals" className="bg-white border border-[#E5E7EB] rounded-[8px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4.5 w-4.5 text-[#2563EB]" />
              <h2 className="text-[15px] font-semibold text-[#111827]">Active Open Pipeline</h2>
            </div>
            <span className="text-[11px] text-[#2563EB] font-medium">Expected Q2 Deals</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto crm-scrollbar">
            {deals.filter(d => d.status === 'Open').slice(0, 5).map((deal) => (
              <div key={deal.id} className="p-3 border border-[#E5E7EB] rounded-[6px] hover:border-[#2563EB]/40 transition-colors select-none flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-semibold text-[#111827] hover:text-[#2563EB] transition-colors">{deal.title}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-[#6B7280] mt-1.5 font-sans">
                    <span className="font-medium text-[#111827]">{deal.company}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-[#2563EB] rounded-[4px] border border-blue-100">{deal.stage}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#111827] text-[13px] block">{formatUSD(deal.value)}</span>
                  <span className="text-[10px] text-[#6B7280]">{deal.assignedTo}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
