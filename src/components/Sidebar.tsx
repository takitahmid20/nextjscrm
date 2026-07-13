/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  CheckSquare,
  Settings,
  Building2,
  ChevronRight,
  LogOut,
  X,
  BarChart3,
  CalendarDays,
  Bell,
  Blocks,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mobile drawer open/close state.
//
// Sidebar and Navbar are rendered as siblings by MainLayoutContent, so they
// can't share plain React state without lifting it into a common ancestor.
// Since this is purely local UI/layout state (not server data, and not worth
// adding to CRMContext), it lives here as a tiny external store and Navbar
// imports the setters it needs directly from this module.
// ---------------------------------------------------------------------------
type Listener = () => void;

let mobileSidebarOpen = false;
const listeners = new Set<Listener>();

function emitMobileSidebarChange() {
  listeners.forEach((listener) => listener());
}

function subscribeMobileSidebar(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getMobileSidebarSnapshot() {
  return mobileSidebarOpen;
}

function getMobileSidebarServerSnapshot() {
  return false;
}

export function useMobileSidebarOpen(): boolean {
  return useSyncExternalStore(subscribeMobileSidebar, getMobileSidebarSnapshot, getMobileSidebarServerSnapshot);
}

export function openMobileSidebar() {
  mobileSidebarOpen = true;
  emitMobileSidebarChange();
}

export function closeMobileSidebar() {
  mobileSidebarOpen = false;
  emitMobileSidebarChange();
}

export function toggleMobileSidebar() {
  mobileSidebarOpen = !mobileSidebarOpen;
  emitMobileSidebarChange();
}

export default function Sidebar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { collapsedSidebar, setCollapsedSidebar } = useCRM();
  const { user, logout } = useAuth();
  const mobileOpen = useMobileSidebarOpen();

  // Close the mobile drawer whenever the route changes so navigating away
  // doesn't leave it open on top of the new page.
  useEffect(() => {
    closeMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Determine current active page key
  const rawTab = pathname.replace(/^\//, '').split('/')[0];
  const currentTab = pathname === '/' || pathname.startsWith('/dashboard')
    ? 'dashboard'
    : rawTab.startsWith('contact') ? 'contacts' : rawTab.startsWith('lead') ? 'leads' : rawTab;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'leads', label: 'Leads Directory', icon: Users, href: '/leads' },
    { id: 'contacts', label: 'Contacts Directory', icon: UserCheck, href: '/contacts' },
    { id: 'accounts', label: 'Accounts', icon: Building2, href: '/accounts' },
    { id: 'deals', label: 'Deals Pipeline', icon: Briefcase, href: '/deals' },
    { id: 'tasks', label: 'Tasks & Activity', icon: CheckSquare, href: '/tasks' },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, href: '/reports' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/notifications' },
  ];

  async function handleLogout() {
    await logout();
    router.push('/auth');
  }

  // Label/section visibility rule: below `md` the drawer always renders in
  // its fully expanded form (regardless of the desktop collapse toggle);
  // at `md`+ it respects `collapsedSidebar`. `md:hidden` only kicks in at
  // the `md` breakpoint and up, so appending it exactly when collapsed
  // gives us "hidden once collapsed on desktop, always visible on mobile".
  const hideWhenCollapsed = collapsedSidebar ? 'md:hidden' : '';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile backdrop — only rendered below `md`, dismisses the drawer on click */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <div
        id="crm-sidebar"
        className={`fixed top-0 left-0 h-full bg-card border-r border-border flex flex-col transition-all duration-200 z-40 md:z-30 w-[260px] ${
          collapsedSidebar ? 'md:w-[72px]' : 'md:w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo area */}
        <div className="h-[72px] border-b border-border flex items-center px-4 justify-between select-none">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-primary h-9 w-9 rounded-[6px] flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-lg">
              C
            </div>
            <div className={`flex flex-col ${hideWhenCollapsed}`}>
              <span className="font-semibold text-[15px] tracking-tight text-foreground">
                CENTRIC CRM
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Enterprise v4.2
              </span>
            </div>
          </div>

          {/* Desktop collapse/expand toggle */}
          <button
            id="toggle-sidebar-button"
            type="button"
            onClick={() => setCollapsedSidebar(!collapsedSidebar)}
            aria-label={collapsedSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsedSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors hidden md:block"
          >
            <ChevronRight className={`h-4 w-4 transform transition-transform ${collapsedSidebar ? '' : 'rotate-180'}`} />
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Signed-in user's company, when known */}
        {user?.company && (
          <div className={`mx-3 mt-4 px-3 py-2 bg-muted border border-border rounded-[6px] text-xs ${hideWhenCollapsed}`}>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-medium">Workspace</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="font-semibold text-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-primary" />
              {user.company}
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto crm-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className={`ml-3 truncate font-medium text-[13px] ${hideWhenCollapsed}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider line */}
          <div className="h-[1px] bg-border my-4" />

          <Link
            id="sidebar-tab-settings"
            href="/settings"
            onClick={closeMobileSidebar}
            className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
              currentTab === 'settings'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className={`ml-3 truncate font-medium text-[13px] ${hideWhenCollapsed}`}>Company Settings</span>
          </Link>

          <Link
            id="sidebar-tab-components"
            href="/components"
            onClick={closeMobileSidebar}
            title="Reference page for engineers — reusable UI components used across this app"
            className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
              currentTab === 'components'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Blocks className="h-5 w-5 flex-shrink-0" />
            <span className={`ml-3 truncate font-medium text-[13px] ${hideWhenCollapsed}`}>Component Library</span>
          </Link>
        </div>

        {/* User profile section */}
        <div className="p-3 border-t border-border bg-card text-xs select-none">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border border-primary/20 text-primary font-bold h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px]">
              {initials}
            </div>
            <div className={`flex-1 overflow-hidden ${hideWhenCollapsed}`}>
              <p className="font-semibold text-foreground truncate h-4 line-clamp-1">{user?.name ?? 'Guest'}</p>
              <p className="text-muted-foreground text-[10px] truncate">{user?.role ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className={`p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 ${hideWhenCollapsed}`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
