/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  HelpCircle,
  Database
} from 'lucide-react';

export default function Navbar() {
  const { 
    globalSearch, 
    setGlobalSearch, 
    workspace, 
    setWorkspace, 
    activities 
  } = useCRM();

  const [showNotifications, setShowNotifications] = useState(false);
  const [timeStr, setTimeStr] = useState('2026-05-28 20:25:55 UTC');

  // Realistic dynamic clock showing UTC timezone matching metadata
  useEffect(() => {
    let now = new Date('2026-05-28T20:25:55Z');
    const timer = setInterval(() => {
      now = new Date(now.getTime() + 1000);
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const min = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} UTC`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const systemAlerts = [
    { id: 1, text: 'Lead "Emily Watson" was assigned to you by Sarah Jenkins.', time: '12 mins ago' },
    { id: 2, text: 'Opportunity "Enterprise ERP Integration" value upgraded to $24.5k.', time: '2h ago' },
    { id: 3, text: 'Weekly quarterly sales export prepared successfully.', time: '5h ago' }
  ];

  return (
    <header 
      id="crm-main-navbar" 
      className="sticky top-0 z-20 h-[72px] bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between"
    >
      {/* Left: Global Search Input */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            id="global-crm-search-input"
            type="text"
            placeholder="Search leads, companies, deals or tasks..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] text-[13px] rounded-[6px] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right: Clock, Workspace switcher, Alerts, Profile info */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Real-time UTC ticking clock display */}
        <div className="font-mono text-[11px] text-[#6B7280] bg-[#F5F6F8] border border-[#E5E7EB] px-2.5 py-1 rounded-[4px] select-none md:flex hidden items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          {timeStr}
        </div>

        {/* Corporate Workspace Switcher Select Dropdown */}
        <div className="relative md:block hidden">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#E5E7EB] hover:border-[#2563EB]/40 rounded-[6px] bg-white text-xs cursor-pointer text-[#111827] select-none">
            <Database className="h-3.5 w-3.5 text-[#2563EB]" />
            <select
              id="workspace-switcher-dropdown"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="bg-transparent border-none pr-6 outline-none font-medium text-[12px] cursor-pointer appearance-none"
            >
              <option value="US_EAST_PROD">US-East (Prod)</option>
              <option value="EU_WEST_PROD">EU-West (Prod)</option>
              <option value="APAC_STAGE">APAC (Test-Bed)</option>
            </select>
            <ChevronDown className="h-3 w-3 text-[#6B7280] absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Activity / Alert Bells Dropdown */}
        <div className="relative">
          <button
            id="navbar-alert-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-10 w-10 flex items-center justify-center border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#6B7280] hover:text-[#2563EB] rounded-[6px] relative transition-colors"
          >
            <Bell className="h-4.5 w-4.5" />
            {activities.length > 0 && (
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-blue-600 outline outline-2 outline-white"></span>
            )}
          </button>

          {/* Alert Popover */}
          {showNotifications && (
            <div 
              id="navbar-notifications-panel" 
              className="absolute right-0 mt-2 w-[340px] bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm z-50 text-xs text-[#111827] overflow-hidden"
            >
              <div className="p-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-between">
                <span className="font-semibold text-[13px]">Realtime Activity Center</span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase">{activities.length} new records</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto crm-scrollbar">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 border-b border-[#E5E7EB] hover:bg-[#EFF6FF]/60 transition-colors">
                    <p className="leading-normal mb-1">{alert.text}</p>
                    <span className="text-[10px] text-[#6B7280]">{alert.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-[#E5E7EB] bg-[#F5F6F8] text-center">
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-1 text-center font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Close panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Customer Service Helpline Button */}
        <button 
          onClick={() => alert("CRM Operational Knowledge Base is loaded. Contact support at +1 (800) 555-CRM-CENTRIC.")}
          className="h-10 w-10 flex items-center justify-center border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#6B7280] hover:text-[#2563EB] rounded-[6px] transition-colors"
          title="Operational Support Guide"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
