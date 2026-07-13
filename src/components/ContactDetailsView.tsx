/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Mail, Plus, Trash2, User, Sparkles, TrendingUp, MoreVertical } from 'lucide-react';
import { Contact, CRMTask, Deal } from '../types';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/button';
import { FormSelect } from './forms/FormControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Modular Refactored CRM components imports
import CRMProgressBanner from './details/CRMProgressBanner';
import CRMDemographicsCard from './details/CRMDemographicsCard';
import CRMAddressCard from './details/CRMAddressCard';
import CRMInteractionTabs from './details/CRMInteractionTabs';
import AttachmentsPanel from './AttachmentsPanel';
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
  
  const { showToast } = useToast();
  const { loading, currentUser } = useCRM();

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

  // Data is still loading (e.g. right after a full-page navigation to this
  // route) — show a loading state instead of a false "not found."
  if (!contact && loading) {
    return (
      <div id="contact-loading" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">Loading contact record…</p>
      </div>
    );
  }

  // Fallback if genuinely not found
  if (!contact) {
    return (
      <div id="contact-not-found" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Contact Record Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">The customer directory record you are attempting to review may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
      </div>
    );
  }

  // Callback to persist profile mutations
  const handleProfileSave = (updatedFields: Partial<Contact>) => {
    onUpdateContact(contact.id, updatedFields);
    setShowEditSheet(false);
    showToast('Contact profile saved.', 'success');
  };

  // Timeline note CRUD callbacks
  const handleAddNote = (content: string) => {
    const entry = {
      id: `NOTE-${Date.now()}`,
      content,
      date: new Date().toISOString(),
      author: currentUser.name
    };
    onUpdateContact(contact.id, {
      notes: content,
      notes_history: [entry, ...notesHistory]
    });
    showToast('Note added.', 'success');
  };

  const handleSaveEditedNote = (id: string, content: string) => {
    const updated = notesHistory.map(note =>
      note.id === id ? { ...note, content, date: new Date().toISOString() } : note
    );
    onUpdateContact(contact.id, {
      notes_history: updated,
      notes: updated[0]?.content || ''
    });
    showToast('Note updated.', 'success');
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notesHistory.filter(n => n.id !== id);
    onUpdateContact(contact.id, {
      notes_history: filtered,
      notes: filtered[0]?.content || ''
    });
    showToast('Note removed.', 'success');
  };

  const handleSendEmail = (subject: string, body: string) => {
    onUpdateContact(contact.id, {
      lastActivity: `Sent email regarding: "${subject}"`
    });
    showToast(`Email sent to ${contact.email}.`, 'success');
  };

  const handleAddDealProxy = (dealPayload: Omit<Deal, 'id' | 'createdAt'>) => {
    onAddDeal(dealPayload);
    showToast(`Deal "${dealPayload.title}" created.`, 'success');
  };

  return (
    <div id="contact-details-dashboard" className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      
      {/* 1. Header and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2 border-b border-border">

        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Back to contacts directory"
            className="p-2 cursor-pointer bg-card hover:bg-muted text-foreground rounded-md border border-border transition-colors flex items-center justify-center shadow-xs h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{contact.name}</h1>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                {contact.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Strategic business contact entity linked to {contact.company}
            </p>
          </div>
        </div>

        {/* Dynamic Action Controls */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-medium">Contact Priority:</span>
            <FormSelect
              id="contact-detail-priority-direct"
              value={contact.priority || 'Medium'}
              onChange={(val) => {
                onUpdateContact(contact.id, { priority: val as Contact['priority'] });
              }}
              options={[
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
              ]}
              className="w-36 font-semibold"
            />
          </div>

          <div className="hidden sm:block h-6 w-[1.5px] bg-border" />

          {/* Edit Contact button */}
          <Button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="h-9 px-3.5 border border-border text-xs font-semibold text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Launch Deal */}
          <Button
            type="button"
            onClick={() => setShowDealSheet(true)}
            className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create Deal
          </Button>

          {/* More Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                aria-label="More actions"
                className="h-9 w-9 p-0 flex items-center justify-center border border-border rounded-[6px] hover:bg-muted cursor-pointer"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1 bg-card border border-border rounded-[6px] shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  setEmailSubject(`Enterprise Relationship Brief - ${contact.company}`);
                  setEmailBody(`Hi ${contact.name},\n\nI hope your week is off to an excellent start...\n\nBest regards,\n${contact.assignedTo || currentUser.name}`);
                  setShowEmailSheet(true);
                }}
                className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted rounded flex items-center gap-2 cursor-pointer border-0"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
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

          <AttachmentsPanel entityType="Contact" entityId={contact.id} />
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
        contactName={contact.name}
        contactEmail={contact.email}
        contactPhone={contact.phone}
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
