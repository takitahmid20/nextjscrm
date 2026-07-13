"use client";

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { DealStage } from '../../types';

interface CRMProgressBannerProps {
  value: string;
  type: 'status' | 'priority' | 'stage';
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
    } else if (type === 'stage') {
      switch (value as DealStage) {
        case 'Lead In':
          return { percent: 15, txt: 'Opportunity Sourced: Initial Discovery Stage' };
        case 'Contact Made':
          return { percent: 30, txt: 'Direct Stakeholder Engagement Established' };
        case 'Demo Scheduled':
          return { percent: 50, txt: 'Product Demonstration Booked & Confirmed' };
        case 'Proposal Sent':
          return { percent: 70, txt: 'Formal Proposal Delivered To Stakeholders' };
        case 'Negotiation':
          return { percent: 85, txt: 'Contract Terms Under Active Negotiation' };
        case 'Won':
          return { percent: 100, txt: 'Agreement Settled: Closed Won Contract' };
        case 'Lost':
          return { percent: 100, txt: 'Opportunity Closed: Lost / Disqualified' };
        default:
          return { percent: 0, txt: 'Unknown Stage Tracker Code' };
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
    : type === 'stage'
      ? ['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
      : ['Low', 'Medium', 'High'];

  const currentIndex = Math.max(0, stages.indexOf(value));
  const isLostStage = type === 'stage' && value === 'Lost';

  const typeLabel = type === 'status' ? 'Lead Pipeline' : type === 'stage' ? 'Deal Pipeline' : 'Account Priority';

  return (
    <div className="w-full bg-card border border-border rounded-[8px] p-3 shadow-xs select-none mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left section: Current Status display */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold shadow-xs border ${
            isLostStage
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-primary text-primary-foreground border-transparent'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
          </span>
          {value}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none mb-0.5">
            {typeLabel}
          </span>
          <span className="text-xs font-semibold text-foreground">
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
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-xs'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground border-transparent shadow-xs font-semibold'
                      : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                ) : (
                  <span className="text-[9px] w-4 h-4 rounded-full border border-border flex items-center justify-center font-mono font-bold leading-none">
                    {idx + 1}
                  </span>
                )}
                <span>{stage}</span>
              </div>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
