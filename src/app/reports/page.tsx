/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import ReportsView from '../../components/ReportsView';

export default function ReportsPage() {
  const { leads, deals, tasks, activities, accounts, loading } = useCRM();

  return (
    <ReportsView
      leads={leads}
      deals={deals}
      tasks={tasks}
      activities={activities}
      accounts={accounts}
      loading={loading}
    />
  );
}
