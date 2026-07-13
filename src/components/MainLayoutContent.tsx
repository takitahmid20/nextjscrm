/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCRM } from '../context/CRMContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandPalette from './CommandPalette';

export default function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsedSidebar } = useCRM();
  const pathname = usePathname();

  // The auth screen is a standalone flow — it shouldn't render inside the
  // signed-in app chrome (sidebar/navbar/footer).
  if (pathname === '/auth') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div id="centric-crm-frame" className="min-h-screen bg-background font-sans">
      {/* 1. Sidebar Nav Section */}
      <Sidebar />

      {/* 2. Scrollable Core Grid Spacing */}
      <div
        id="crm-content-container"
        className="transition-all duration-200 min-h-screen flex flex-col md:[padding-left:var(--crm-sidebar-w)] [--crm-sidebar-w:0px]"
        style={{ ['--crm-sidebar-w' as string]: collapsedSidebar ? '72px' : '260px' }}
      >
        {/* Top Navbar Component */}
        <Navbar />

        {/* Dynamic workspace page render */}
        <main
          id="crm-viewport"
          className="flex-1 w-full p-4 md:p-6"
        >
          {children}
        </main>

        {/* Status Footer */}
        <footer className="py-4 border-t border-border bg-card text-center text-muted-foreground text-[10px] uppercase tracking-wider select-none">
          Centric CRM Suite • v4.2.0
        </footer>
      </div>

      <CommandPalette />
    </div>
  );
}
