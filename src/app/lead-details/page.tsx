/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCRM } from '../../context/CRMContext';
import LeadDetailsView from '../../components/LeadDetailsView';

function LeadDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams ? searchParams.get('id') || '' : '';
  
  const { leads, tasks, updateLead, addTask, toggleTask, deleteTask, addDeal } = useCRM();

  return (
    <LeadDetailsView 
      leadId={leadId}
      leads={leads}
      tasks={tasks}
      onUpdateLead={updateLead}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      onAddDeal={addDeal}
      onBack={() => {
        router.push('/leads');
      }}
    />
  );
}

export default function LeadDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading Lead Details...</div>}>
      <LeadDetailsContent />
    </Suspense>
  );
}
