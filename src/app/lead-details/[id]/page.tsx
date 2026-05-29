/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../../../context/CRMContext';
import LeadDetailsView from '../../../components/LeadDetailsView';

interface PageProps {
  params: Promise<{ id: string }>;
}

function LeadDetailsContent({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const { leads, tasks, updateLead, addTask, toggleTask, deleteTask, addDeal } = useCRM();

  return (
    <LeadDetailsView 
      leadId={id}
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

export default function LeadDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading Lead Details...</div>}>
      <LeadDetailsContent params={params} />
    </Suspense>
  );
}
