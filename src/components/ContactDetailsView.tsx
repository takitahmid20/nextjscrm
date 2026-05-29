/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Mail, Plus, Trash2, User, Sparkles, TrendingUp, MoreVertical } from 'lucide-react';
import { Contact, CRMTask, Deal } from '../types';
import { Button } from '@/components/ui/button';
import { FormSelect } from './forms/FormControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Modular Refactored CRM components imports
import CRMProgressBanner from './details/CRMProgressBanner';
import CRMDemographicsCard from './details/CRMDemographicsCard';
import CRMAddressCard from './details/CRMAddressCard';
import CRMInteractionTabs from './details/CRMInteractionTabs';
import CRMEditEntitySheet from './sheets/CRMEditEntitySheet';
import CRMOpportunityDealSheet from './sheets/CRMOpportunityDealSheet';
import CRMOutboundEmailSheet from './sheets/CRMOutboundEmailSheet';

interface ContactDetailsViewProps {
  contactId: string;
  contacts: Contact[];
  tasks: CRMTask[];
  onUpdateContact: (id: string, updated: Partial<Contact>) => void;
  onAddTask: (taskInput: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddDeal: (dealInput: Omit<Deal, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

export default function ContactDetailsView({
  contactId,
  contacts,
  tasks,
  onUpdateContact,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddDeal,
  onBack
}: ContactDetailsViewProps) {
  
  // Find contact
  const contact = contacts.find(c => c.id === contactId);

  // Sheets Visibility state
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [showDealSheet, setShowDealSheet] = useState(false);

  // Email template values
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Load timeline notes history from contact record
  const rawHistory: Array<{ id: string; content: string; date: string; author: string }> = contact?.notes_history || [];
  const notesHistory = React.useMemo(() => {
    if (!contact) return [];
    if (rawHistory.length === 0 && contact.notes) {
      return [{
        id: 'INIT-CONTACT-NOTE',
        content: contact.notes,
        date: contact.createdAt || new Date().toISOString(),
        author: contact.assignedTo || 'System Automated'
      }];
    }
    return rawHistory;
  }, [rawHistory, contact]);

  // Tasks associated with this contact
  const relatedTasks = React.useMemo(() => {
    if (!contact) return [];
    return tasks.filter(task => 
      task.relatedToName === contact.name || 
      task.title.toLowerCase().includes(contact.name.toLowerCase()) || 
      task.title.toLowerCase().includes(contact.company.toLowerCase())
    );
  }, [tasks, contact]);

  // Fallback if not found
  if (!contact) {
    return (
      <div id="contact-not-found" className="text-center py-16 bg-white border border-[#E5E7EB] rounded-lg shadow-sm">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Contact Record Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">The customer directory record you are attempting to review may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
      </div>
    );
  }

  // Callback to persist profile mutations
  const handleProfileSave = (updatedFields: any) => {
    onUpdateContact(contact.id, updatedFields);
    setShowEditSheet(false);
    alert('Contact relationships profile successfully saved.');
  };

  // Timeline note CRUD callbacks
  const handleAddNote = (content: string) => {
    const entry = {
      id: `NOTE-${Date.now()}`,
      content,
      date: new Date().toISOString(),
      author: 'Sarah Jenkins' // Default user
    };
    onUpdateContact(contact.id, {
      notes: content,
      notes_history: [entry, ...notesHistory]
    });
    alert('Timeline note added successfully.');
  };

  const handleSaveEditedNote = (id: string, content: string) => {
    const updated = notesHistory.map(note => 
      note.id === id ? { ...note, content, date: new Date().toISOString() } : note
    );
    onUpdateContact(contact.id, {
      notes_history: updated,
      notes: updated[0]?.content || ''
    });
    alert('Timeline note entry modified.');
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notesHistory.filter(n => n.id !== id);
    onUpdateContact(contact.id, {
      notes_history: filtered,
      notes: filtered[0]?.content || ''
    });
    alert('Timeline note entry removed.');
  };

  const handleSendEmail = (subject: string, body: string) => {
    onUpdateContact(contact.id, {
      lastActivity: `Sent email regarding: "${subject}"`
    });
    alert(`Outbound message sent to <${contact.email}>.`);
  };

  const handleAddDealProxy = (dealPayload: any) => {
    onAddDeal(dealPayload);
    alert(`New deal opportunity "${dealPayload.title}" created successfully.`);
  };

  return (
    <div id="contact-details-dashboard" className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      
      {/* 1. Header and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2 border-b border-[#E5E7EB]">
        
        <div className="flex items-center space-x-3.5">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="p-2 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-[#E5E7EB] transition-colors flex items-center justify-center shadow-xs h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-[#111827] mt-0.5 tracking-tight">{contact.name}</h1>
              <span className="text-[11px] font-mono font-semibold text-[#6B7280] bg-[#E5E7EB]/55 px-1.5 py-0.5 rounded uppercase">
                {contact.id}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              Strategic business contact entity linked to {contact.company}
            </p>
          </div>
        </div>

        {/* Dynamic Action Controls */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Contact Priority:</span>
            <FormSelect
              id="contact-detail-priority-direct"
              value={contact.priority || 'Medium'}
              onChange={(val) => {
                onUpdateContact(contact.id, { priority: val as any });
              }}
              options={[
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
              ]}
              className="w-36 font-semibold"
            />
          </div>

          <div className="hidden sm:block h-6 w-[1.5px] bg-[#E5E7EB]" />

          {/* Edit Contact button */}
          <Button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="h-9 px-3.5 border border-[#D1D5DB] text-xs font-semibold text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Launch Deal */}
          <Button
            type="button"
            onClick={() => setShowDealSheet(true)}
            className="h-9 px-3.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create Deal
          </Button>

          {/* More Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 flex items-center justify-center border border-[#D1D5DB] rounded-[6px] hover:bg-slate-50 cursor-pointer"
              >
                <MoreVertical className="h-4 w-4 text-[#374151]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1 bg-white border border-[#E5E7EB] rounded-[6px] shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  setEmailSubject(`Enterprise Relationship Brief - ${contact.company}`);
                  setEmailBody(`Hi ${contact.name},\n\nI hope your week is off to an excellent start...\n\nBest regards,\n${contact.assignedTo || 'Sarah Jenkins'}`);
                  setShowEmailSheet(true);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#F3F4F6] rounded flex items-center gap-2 cursor-pointer border-0"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                Send Email
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Pipeline Integrity Banner Card */}
      <CRMProgressBanner value={contact.priority || 'Medium'} type="priority" />

      {/* 3. Core Workspace splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Demographic Metadata (1/3) */}
        <div className="space-y-6">
          <CRMDemographicsCard 
            entity={contact as any} 
            onUpdateRepresentative={(val) => onUpdateContact(contact.id, { assignedTo: val })}
            onUpdateDealValue={(val) => onUpdateContact(contact.id, { dealValue: val })}
          />

          <CRMAddressCard addressInfo={contact.addressInfo} />
        </div>

        {/* RIGHT COLUMN: Interaction Tab logs (2/3) */}
        <div className="lg:col-span-2">
          <CRMInteractionTabs 
            relatedName={contact.name}
            assignedTo={contact.assignedTo}
            notesHistory={notesHistory}
            relatedTasks={relatedTasks}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onSaveEditedNote={handleSaveEditedNote}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
          />
        </div>
      </div>

      {/* Slide-out Sidebar Forms Sheets */}
      <CRMEditEntitySheet 
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        entityType="Contact"
        entity={contact}
        onSave={handleProfileSave}
      />

      <CRMOpportunityDealSheet 
        open={showDealSheet}
        onOpenChange={setShowDealSheet}
        company={contact.company}
        assignedTo={contact.assignedTo}
        onAddDeal={handleAddDealProxy}
      />

      <CRMOutboundEmailSheet 
        open={showEmailSheet}
        onOpenChange={setShowEmailSheet}
        contactEmail={contact.email}
        initialSubject={emailSubject}
        initialBody={emailBody}
        onSendEmail={handleSendEmail}
      />

    </div>
  );
}
