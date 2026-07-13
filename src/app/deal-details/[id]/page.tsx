/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../../../context/CRMContext';
import DealDetailsView from '../../../components/DealDetailsView';

interface PageProps {
  params: Promise<{ id: string }>;
}

function DealDetailsContent({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);

  const { deals, tasks, updateDeal, updateDealStage, updateDealStatus, deleteDeal, addTask, toggleTask, deleteTask } = useCRM();

  return (
    <DealDetailsView
      dealId={id}
      deals={deals}
      tasks={tasks}
      onUpdateDeal={updateDeal}
      onUpdateDealStage={updateDealStage}
      onUpdateDealStatus={updateDealStatus}
      onDeleteDeal={deleteDeal}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      onBack={() => {
        router.push('/deals');
      }}
    />
  );
}

export default function DealDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading Deal Details...</div>}>
      <DealDetailsContent params={params} />
    </Suspense>
  );
}
