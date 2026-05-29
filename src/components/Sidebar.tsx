/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRM } from '../context/CRMContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Shield, 
  Settings, 
  Building2,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname() || '';
  const { 
    currentUser, 
    collapsedSidebar, 
    setCollapsedSidebar 
  } = useCRM();

  // Determine current active page key
  const currentTab = pathname === '/' || pathname.startsWith('/dashboard') 
    ? 'dashboard' 
    : pathname.replace(/^\//, '').split('/')[0];
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'leads', label: 'Leads Directory', icon: Users, href: '/leads' },
    { id: 'deals', label: 'Deals Pipeline', icon: Briefcase, href: '/deals' },
    { id: 'tasks', label: 'Tasks & Activity', icon: CheckSquare, href: '/tasks' },
  ];

  return (
    <div 
      id="crm-sidebar" 
      className={`fixed top-0 left-0 h-full bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 z-30 ${
        collapsedSidebar ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo area */}
      <div className="h-[72px] border-b border-[#E5E7EB] flex items-center px-4 justify-between select-none">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="bg-[#2563EB] h-9 w-9 rounded-[6px] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            C
          </div>
          {!collapsedSidebar && (
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] tracking-tight text-[#111827]">
                CENTRIC CRM
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-medium">
                Enterprise v4.2
              </span>
            </div>
          )}
        </div>
        
        <button 
          id="toggle-sidebar-button"
          onClick={() => setCollapsedSidebar(!collapsedSidebar)}
          className="p-1 hover:bg-[#EFF6FF] rounded text-[#6B7280] hover:text-[#2563EB] transition-colors md:block hidden"
          title={collapsedSidebar ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className={`h-4 w-4 transform transition-transform ${collapsedSidebar ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Internal business units alert bar */}
      {!collapsedSidebar && (
        <div className="mx-3 mt-4 px-3 py-2 bg-[#F5F6F8] border border-[#E5E7EB] rounded-[6px] text-xs">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="font-medium">Selected Division</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="font-semibold text-[#111827] mt-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-[#2563EB]" />
            Acme Sales Division
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
              className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
                isActive 
                  ? 'bg-[#2563EB] text-white font-medium' 
                  : 'text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`} />
              {!collapsedSidebar && (
                <span className="ml-3 truncate font-medium text-[13px]">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Divider line */}
        <div className="h-[1px] bg-[#E5E7EB] my-4" />

        {/* Auth Pages Simulator navigation */}
        <Link
          id="sidebar-tab-auth-mock"
          href="/auth"
          className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
            currentTab === 'auth'
              ? 'bg-[#2563EB] text-white font-medium'
              : 'text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
          }`}
        >
          <Shield className="h-5 w-5 flex-shrink-0" />
          {!collapsedSidebar && (
            <span className="ml-3 truncate font-medium text-[13px]">Auth Screens Preview</span>
          )}
        </Link>

        <Link
          id="sidebar-tab-settings"
          href="/settings"
          className={`w-full h-11 flex items-center px-3 rounded-[6px] text-sm text-left transition-all duration-150 ${
            currentTab === 'settings'
              ? 'bg-[#2563EB] text-white font-medium'
              : 'text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
          }`}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsedSidebar && (
            <span className="ml-3 truncate font-medium text-[13px]">Company Settings</span>
          )}
        </Link>
      </div>

      {/* User profile section */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] font-bold h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px]">
            {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'SJ'}
          </div>
          {!collapsedSidebar && (
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-[#111827] truncate h-4 line-clamp-1">{currentUser?.name}</p>
              <p className="text-[#6B7280] text-[10px] truncate">{currentUser?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
