/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  CheckSquare,
  Building2,
  BarChart3,
  CalendarDays,
  Bell,
  Settings,
  CornerDownLeft,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCRM } from '../context/CRMContext';
import { formatUSD } from '../utils';

interface PaletteEntry {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  href: string;
  group: 'Pages' | 'Leads' | 'Contacts' | 'Deals' | 'Accounts' | 'Tasks';
}

const STATIC_PAGES: PaletteEntry[] = [
  { id: 'page-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/', group: 'Pages' },
  { id: 'page-leads', label: 'Leads Directory', icon: <Users className="h-4 w-4" />, href: '/leads', group: 'Pages' },
  { id: 'page-contacts', label: 'Contacts Directory', icon: <UserCheck className="h-4 w-4" />, href: '/contacts', group: 'Pages' },
  { id: 'page-accounts', label: 'Accounts', icon: <Building2 className="h-4 w-4" />, href: '/accounts', group: 'Pages' },
  { id: 'page-deals', label: 'Deals Pipeline', icon: <Briefcase className="h-4 w-4" />, href: '/deals', group: 'Pages' },
  { id: 'page-tasks', label: 'Tasks & Activity', icon: <CheckSquare className="h-4 w-4" />, href: '/tasks', group: 'Pages' },
  { id: 'page-calendar', label: 'Calendar', icon: <CalendarDays className="h-4 w-4" />, href: '/calendar', group: 'Pages' },
  { id: 'page-reports', label: 'Reports & Analytics', icon: <BarChart3 className="h-4 w-4" />, href: '/reports', group: 'Pages' },
  { id: 'page-notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, href: '/notifications', group: 'Pages' },
  { id: 'page-settings', label: 'Company Settings', icon: <Settings className="h-4 w-4" />, href: '/settings', group: 'Pages' },
];

const MAX_ENTITY_RESULTS = 5;

export default function CommandPalette() {
  const router = useRouter();
  const { leads, contacts, deals, accounts } = useCRM();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlighted(0);
    }
  }, [open]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const needle = query.trim().toLowerCase();
    const pages = needle
      ? STATIC_PAGES.filter((p) => p.label.toLowerCase().includes(needle))
      : STATIC_PAGES;

    if (!needle) return pages;

    const leadEntries: PaletteEntry[] = leads
      .filter((l) => l.name.toLowerCase().includes(needle) || l.company.toLowerCase().includes(needle))
      .slice(0, MAX_ENTITY_RESULTS)
      .map((l) => ({ id: `lead-${l.id}`, label: l.name, sublabel: `${l.company} · Lead`, icon: <Users className="h-4 w-4" />, href: `/lead-details/${l.id}`, group: 'Leads' as const }));

    const contactEntries: PaletteEntry[] = contacts
      .filter((c) => c.name.toLowerCase().includes(needle) || c.company.toLowerCase().includes(needle))
      .slice(0, MAX_ENTITY_RESULTS)
      .map((c) => ({ id: `contact-${c.id}`, label: c.name, sublabel: `${c.company} · Contact`, icon: <UserCheck className="h-4 w-4" />, href: `/contact-details/${c.id}`, group: 'Contacts' as const }));

    const dealEntries: PaletteEntry[] = deals
      .filter((d) => d.title.toLowerCase().includes(needle) || d.company.toLowerCase().includes(needle))
      .slice(0, MAX_ENTITY_RESULTS)
      .map((d) => ({ id: `deal-${d.id}`, label: d.title, sublabel: `${d.company} · ${formatUSD(d.value)}`, icon: <Briefcase className="h-4 w-4" />, href: `/deal-details/${d.id}`, group: 'Deals' as const }));

    const accountEntries: PaletteEntry[] = accounts
      .filter((a) => a.name.toLowerCase().includes(needle))
      .slice(0, MAX_ENTITY_RESULTS)
      .map((a) => ({ id: `account-${a.id}`, label: a.name, sublabel: a.industry || 'Account', icon: <Building2 className="h-4 w-4" />, href: `/account-details/${a.id}`, group: 'Accounts' as const }));

    return [...pages, ...leadEntries, ...contactEntries, ...dealEntries, ...accountEntries];
  }, [query, leads, contacts, deals, accounts]);

  const navigate = useCallback((entry: PaletteEntry) => {
    router.push(entry.href);
    setOpen(false);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, entries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = entries[highlighted];
      if (entry) navigate(entry);
    }
  };

  let groupCursor = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] translate-y-0 max-w-xl p-0 gap-0 overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, leads, contacts, deals, accounts…"
            aria-label="Command palette search"
            className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div role="listbox" className="max-h-[360px] overflow-y-auto crm-scrollbar py-1.5">
          {entries.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No matches for "{query}".</p>
          )}
          {(['Pages', 'Leads', 'Contacts', 'Deals', 'Accounts'] as const).map((group) => {
            const groupEntries = entries.filter((e) => e.group === group);
            if (groupEntries.length === 0) return null;
            return (
              <div key={group}>
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                {groupEntries.map((entry) => {
                  groupCursor += 1;
                  const index = groupCursor;
                  const isActive = index === highlighted;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={() => navigate(entry)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="text-muted-foreground shrink-0">{entry.icon}</span>
                      <span className="flex-1 min-w-0 truncate">{entry.label}</span>
                      {entry.sublabel && <span className="text-xs text-muted-foreground truncate shrink-0 max-w-[40%]">{entry.sublabel}</span>}
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
