"use client";

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface CRMProgressBannerProps {
  value: string;
  type: 'status' | 'priority';
}

export default function CRMProgressBanner({ value, type }: CRMProgressBannerProps) {
  const getProgressStats = () => {
    if (type === 'status') {
      switch (value) {
        case 'New':
          return { percent: 15, txt: 'Pipeline Init: Qualified Profiling Stage' };
        case 'Contacted':
          return { percent: 40, txt: 'Initial Sourcing Engagement Achieved' };
        case 'Working':
          return { percent: 60, txt: 'Active Operational Dialogue & Proposal' };
        case 'Nurturing':
          return { percent: 70, txt: 'Strategic High-Touch Long Term Cultivation' };
        case 'Qualified':
          return { percent: 85, txt: 'Enterprise Pre-Offer Validation Confirmed' };
        case 'Unqualified':
          return { percent: 100, txt: 'Disqualified / Pipeline Closed File' };
        default:
          return { percent: 0, txt: 'Unknown Status Tracker Code' };
      }
    } else {
      switch (value) {
        case 'Low':
          return { percent: 35, txt: 'Baseline Partner: Profile & Intake Sourcing Achieved' };
        case 'Medium':
          return { percent: 70, txt: 'Active Synergistic Portfolio: Continuous Workflows' };
        case 'High':
          return { percent: 95, txt: 'VIP Strategic Enterprise Client Integration' };
        default:
          return { percent: 50, txt: 'Standard Unified Operational Sync' };
      }
    }
  };

  const stats = getProgressStats();

  const stages = type === 'status'
    ? ['New', 'Contacted', 'Working', 'Nurturing', 'Qualified', 'Unqualified']
    : ['Low', 'Medium', 'High'];

  const currentIndex = Math.max(0, stages.indexOf(value));

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[8px] p-3 shadow-xs select-none mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left section: Current Status display */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold bg-[#2563EB] text-white shadow-xs border border-transparent">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          {value}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">
            {type === 'status' ? 'Lead Pipeline' : 'Account Priority'}
          </span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {stats.txt}
          </span>
        </div>
      </div>

      {/* Right section: Inline horizontal stepper with all stages */}
      <div className="flex items-center gap-1.5 overflow-x-auto crm-scrollbar pb-1 lg:pb-0 scrollbar-none max-w-full">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={stage}>
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-all duration-200 shrink-0 ${
                  isCompleted 
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE] dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 shadow-xs' 
                    : isCurrent 
                      ? 'bg-[#2563EB] text-white border-transparent shadow-xs font-semibold'
                      : 'bg-[#F9FAFB] text-slate-400 border-[#E5E7EB] dark:bg-slate-900/40 dark:text-slate-500 dark:border-slate-800/50'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-[9px] w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center font-mono font-bold leading-none">
                    {idx + 1}
                  </span>
                )}
                <span>{stage}</span>
              </div>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
