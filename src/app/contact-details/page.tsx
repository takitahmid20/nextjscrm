/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCRM } from '../../context/CRMContext';
import ContactDetailsView from '../../components/ContactDetailsView';

function ContactDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams ? searchParams.get('id') || '' : '';
  
  const { contacts, tasks, updateContact, addTask, toggleTask, deleteTask, addDeal } = useCRM();

  return (
    <ContactDetailsView 
      contactId={contactId}
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

export default function ContactDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 text-xs font-semibold">Loading Contact Details Profiles...</div>}>
      <ContactDetailsContent />
    </Suspense>
  );
}
