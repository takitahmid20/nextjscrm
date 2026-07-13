/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Bell,
  Search,
  Users,
  Trophy,
  XCircle,
  CheckSquare,
  Mail,
  PhoneCall,
  ArrowRightLeft,
  X,
  Inbox,
} from 'lucide-react';
import { Activity } from '../types';
import { formatRelativeTime, formatUSD } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NotificationsViewProps {
  activities: Activity[];
  loading: boolean;
}

type ActivityType = Activity['type'];

type FilterKey = 'all' | 'deals' | 'leads' | 'tasks' | 'communications';

interface FilterGroup {
  key: FilterKey;
  label: string;
  types: ActivityType[] | null; // null === "all"
}

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'all', label: 'All', types: null },
  { key: 'deals', label: 'Deals', types: ['deal_won', 'deal_lost', 'stage_changed'] },
  { key: 'leads', label: 'Leads', types: ['lead_created'] },
  { key: 'tasks', label: 'Tasks', types: ['task_completed'] },
  { key: 'communications', label: 'Communications', types: ['email_sent', 'call_logged'] },
];

interface ActivityMeta {
  icon: React.ElementType;
  badgeClassName: string;
}

const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  lead_created: {
    icon: Users,
    badgeClassName: 'bg-primary/10 text-primary',
  },
  deal_won: {
    icon: Trophy,
    badgeClassName: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
  },
  deal_lost: {
    icon: XCircle,
    badgeClassName: 'bg-destructive/10 text-destructive',
  },
  task_completed: {
    icon: CheckSquare,
    badgeClassName: 'bg-primary/10 text-primary',
  },
  email_sent: {
    icon: Mail,
    badgeClassName: 'bg-primary/10 text-primary',
  },
  call_logged: {
    icon: PhoneCall,
    badgeClassName: 'bg-primary/10 text-primary',
  },
  stage_changed: {
    icon: ArrowRightLeft,
    badgeClassName: 'bg-muted text-muted-foreground',
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local-calendar-day key ("2026-07-12") so grouping matches what a user sees on a wall clock, not UTC. */
function dayKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Human day-section header: "Today", "Yesterday", else an actual date. */
function dayLabel(isoString: string, now: Date): string {
  const date = new Date(isoString);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfEntryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfEntryDay) / DAY_MS);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function absoluteTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface DaySection {
  key: string;
  label: string;
  items: Activity[];
}

function groupByDay(items: Activity[], now: Date): DaySection[] {
  const sections: DaySection[] = [];
  const indexByKey = new Map<string, number>();

  for (const activity of items) {
    const key = dayKey(activity.timestamp);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, sections.length);
      sections.push({ key, label: dayLabel(activity.timestamp, now), items: [activity] });
    } else {
      sections[existingIndex].items.push(activity);
    }
  }

  return sections;
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading activity log">
      <div className="space-y-2">
        <div className="h-6 w-56 rounded bg-muted animate-pulse" />
        <div className="h-3 w-80 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-[76px] rounded-[8px] bg-muted animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-[8px] bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function NotificationsView({ activities, loading }: NotificationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // Stable "now" for this render pass — grouping and relative-time labels stay
  // internally consistent even if the component re-renders mid-computation.
  const now = useMemo(() => new Date(), []);

  const activeGroup = FILTER_GROUPS.find((g) => g.key === activeFilter) ?? FILTER_GROUPS[0];

  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesType = !activeGroup.types || (activeGroup.types as ActivityType[]).includes(activity.type);
      if (!matchesType) return false;

      if (!term) return true;
      const haystack = `${activity.description} ${activity.user} ${activity.entityName ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activities, activeGroup, searchTerm]);

  const sections = useMemo(() => groupByDay(filteredActivities, now), [filteredActivities, now]);

  const hasAnyActivities = activities.length > 0;
  const hasFiltersApplied = activeFilter !== 'all' || searchTerm.trim().length > 0;
  const hasResults = filteredActivities.length > 0;

  function clearFilters() {
    setActiveFilter('all');
    setSearchTerm('');
  }

  if (loading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 select-none">
        <div>
          <h1 id="notifications-main-title" className="text-[28px] font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Full chronological activity log across leads, deals, tasks, and communications.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-card border border-border rounded-[6px] text-muted-foreground text-xs flex items-center gap-1.5 font-medium w-fit">
          {activities.length} total event{activities.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Search + Type Filters */}
      <Card className="bg-card border border-border rounded-[8px] p-4 space-y-3.5">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            id="notifications-search-input"
            type="text"
            aria-label="Search activity by description, user, or entity"
            placeholder="Search activity by description, user, or record name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-background border border-border text-foreground placeholder-muted-foreground text-[13px] rounded-[6px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_GROUPS.map((group) => {
            const isActive = group.key === activeFilter;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveFilter(group.key)}
                aria-pressed={isActive}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                )}
              >
                {group.label}
              </button>
            );
          })}

          {hasFiltersApplied && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="h-7 text-[12px] px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold rounded-full ml-auto"
              title="Clear all filters"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Activity Feed */}
      {!hasAnyActivities ? (
        <Card className="bg-card border border-border rounded-[8px] py-16 flex flex-col items-center justify-center gap-2.5 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">No activity yet</h3>
          <p className="text-xs text-muted-foreground max-w-[320px]">
            As your team creates leads, closes deals, and completes tasks, everything will show up here.
          </p>
        </Card>
      ) : !hasResults ? (
        <Card className="bg-card border border-border rounded-[8px] py-16 flex flex-col items-center justify-center gap-2.5 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">No results match your filter</h3>
          <p className="text-xs text-muted-foreground max-w-[320px]">
            Try a different search term or switch back to "All" to see the full activity log.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="h-8 px-3 text-xs mt-1 rounded-[6px]"
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} id={`notifications-day-${section.key}`}>
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 select-none">
                {section.label}
              </h2>
              <Card className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                {section.items.map((activity) => {
                  const meta = ACTIVITY_META[activity.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 hover:bg-primary/5 transition-colors"
                    >
                      <span className={cn('h-8 w-8 shrink-0 rounded-[6px] flex items-center justify-center', meta.badgeClassName)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground leading-normal">
                          <strong className="text-foreground">{activity.user}</strong>: {activity.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                          <span title={absoluteTimestamp(activity.timestamp)}>
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                          {activity.entityName && (
                            <>
                              <span aria-hidden="true">&middot;</span>
                              <span className="font-medium text-foreground/80">{activity.entityName}</span>
                            </>
                          )}
                          {typeof activity.value === 'number' && (
                            <>
                              <span aria-hidden="true">&middot;</span>
                              <span className="font-mono">{formatUSD(activity.value)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}

          <p className="text-center text-[11px] text-muted-foreground pt-1 select-none">
            Showing {filteredActivities.length} of {activities.length} event{activities.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}
