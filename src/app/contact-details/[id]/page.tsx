/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../../../context/CRMContext';
import ContactDetailsView from '../../../components/ContactDetailsView';

interface PageProps {
  params: Promise<{ id: string }>;
}

function ContactDetailsContent({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const { contacts, tasks, updateContact, addTask, toggleTask, deleteTask, addDeal } = useCRM();

  return (
    <ContactDetailsView 
      contactId={id}
      contacts={contacts}
      tasks={tasks}
      onUpdateContact={updateContact}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      onAddDeal={addDeal}
      onBack={() => {
        router.push('/contacts');
      }}
    />
  );
}

export default function ContactDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 text-xs font-semibold">Loading Contact Details Profiles...</div>}>
      <ContactDetailsContent params={params} />
    </Suspense>
  );
}
