/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../context/CRMContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsedSidebar } = useCRM();

  return (
    <div id="centric-crm-frame" className="min-h-screen bg-[#F5F6F8] font-sans">
      {/* 1. Sidebar Nav Section */}
      <Sidebar />

      {/* 2. Scrollable Core Grid Spacing */}
      <div 
        id="crm-content-container"
        className="transition-all duration-200 min-h-screen flex flex-col"
        style={{ paddingLeft: collapsedSidebar ? '72px' : '260px' }}
      >
        {/* Top Navbar Component */}
        <Navbar />

        {/* Dynamic workspace page render */}
        <main 
          id="crm-viewport" 
          className="flex-1 p-6 max-w-7xl w-full mx-auto"
        >
          {children}
        </main>

        {/* Corporate Status Footer */}
        <footer className="py-4 border-t border-[#E5E7EB] bg-white text-center text-[#6B7280] text-[10px] uppercase tracking-wider select-none">
          Centric CRM Suite • Fully Audited Cluster Sync Status: Operational • v4.2.0-secure • Local cache active 
        </footer>
      </div>
    </div>
  );
}
