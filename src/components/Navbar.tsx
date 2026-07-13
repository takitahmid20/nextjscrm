/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime } from '../utils';
import { toggleMobileSidebar } from './Sidebar';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SUPPORT_EMAIL = 'support@centriccrm.example.com';
const RECENT_ACTIVITY_LIMIT = 5;

export default function Navbar() {
  const { globalSearch, setGlobalSearch, activities } = useCRM();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Real ticking clock. Starts as `null` and is only populated on the client
  // after mount so the server-rendered markup never disagrees with the
  // client's first paint (avoids a hydration mismatch on the current time).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentActivity = activities.slice(0, RECENT_ACTIVITY_LIMIT);

  function handleHelpClick() {
    showToast(`Need help? Reach out to ${SUPPORT_EMAIL}.`, 'info');
  }

  return (
    <header
      id="crm-main-navbar"
      className="sticky top-0 z-20 h-[72px] bg-card border-b border-border px-4 md:px-6 flex items-center justify-between"
    >
      {/* Mobile hamburger — opens the Sidebar drawer, hidden at md+ */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        aria-label="Open sidebar menu"
        title="Open sidebar menu"
        className="h-10 w-10 flex items-center justify-center border border-border hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-[6px] transition-colors mr-3 md:hidden flex-shrink-0"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {/* Left: Global Search Input */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            id="global-crm-search-input"
            type="text"
            aria-label="Search leads, companies, deals or tasks"
            placeholder="Search leads, companies, deals or tasks..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-background border border-border text-foreground placeholder-muted-foreground text-[13px] rounded-[6px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right: Clock, Alerts, Help */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-4">
        {/* Real-time ticking clock display */}
        {now && (
          <div className="font-mono text-[11px] text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-[4px] select-none md:flex hidden items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            {now.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        )}

        {/* Activity notifications, backed by the real activity feed */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              id="navbar-alert-bell"
              type="button"
              aria-label={`Notifications${recentActivity.length > 0 ? ` (${recentActivity.length} recent)` : ''}`}
              className="h-10 w-10 flex items-center justify-center border border-border hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-[6px] relative transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {recentActivity.length > 0 && (
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary outline outline-2 outline-card"></span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            id="navbar-notifications-panel"
            align="end"
            className="w-[340px] p-0 bg-card border border-border rounded-[8px] shadow-sm text-xs text-foreground overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-muted flex items-center justify-between">
              <span className="font-semibold text-[13px]">Recent Activity</span>
              <span className="text-[10px] text-primary font-semibold uppercase">{recentActivity.length} shown</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto crm-scrollbar">
              {recentActivity.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No recent activity yet.</div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-3 border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors">
                    <p className="leading-normal mb-1">
                      <strong className="text-foreground">{activity.user}</strong>: {activity.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="h-10 w-10 flex items-center justify-center border border-border hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-[6px] transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Support / help */}
        <button
          type="button"
          onClick={handleHelpClick}
          aria-label="Get help"
          title="Get help"
          className="h-10 w-10 flex items-center justify-center border border-border hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-[6px] transition-colors"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
