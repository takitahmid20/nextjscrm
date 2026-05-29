/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../context/CRMContext';
import DashboardView from '../components/DashboardView';

export default function DashboardPage() {
  const router = useRouter();
  const { leads, deals, tasks, activities } = useCRM();

  const handleSetTab = (tab: string) => {
    if (tab === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${tab}`);
    }
  };

  return (
    <DashboardView 
      leads={leads}
      deals={deals}
      tasks={tasks}
      activities={activities}
      setTab={handleSetTab}
    />
  );
}
