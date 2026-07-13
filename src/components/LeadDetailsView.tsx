/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Mail, User, Sparkles, TrendingUp, MoreVertical, Briefcase } from 'lucide-react';
import { Lead, CRMTask, Deal, LeadStatus } from '../types';
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
import CRMOutboundEmailSheet from './sheets/CRMOutboundEmailSheet';
import CRMConvertLeadSheet, { ConvertLeadDealPayload } from './sheets/CRMConvertLeadSheet';

interface LeadDetailsViewProps {
  leadId: string;
  leads: Lead[];
  tasks: CRMTask[];
  onUpdateLead: (id: string, updated: Partial<Lead>) => void;
  onAddTask: (taskInput: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddDeal: (dealInput: Omit<Deal, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

export default function LeadDetailsView({
  leadId,
  leads,
  tasks,
  onUpdateLead,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddDeal,
  onBack
}: LeadDetailsViewProps) {
  const { addContact, loading, currentUser } = useCRM();
  const { showToast } = useToast();

  // Find the current lead
  const lead = leads.find(l => l.id === leadId);

  // Sheets Visibility state
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [showConvertSheet, setShowConvertSheet] = useState(false);

  // Email template values
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Load timeline notes history from lead record
  const rawHistory: Array<{ id: string; content: string; date: string; author: string }> = lead?.notes_history || [];
  const notesHistory = React.useMemo(() => {
    if (!lead) return [];
    if (rawHistory.length === 0 && lead.notes) {
      return [{
        id: 'INIT-NOTE',
        content: lead.notes,
        date: lead.createdAt,
        author: lead.assignedTo || 'System Automated'
      }];
    }
    return rawHistory;
  }, [rawHistory, lead]);

  // Filter tasks linked specifically to this Lead
  const relatedTasks = React.useMemo(() => {
    if (!lead) return [];
    return tasks.filter(t => t.relatedToType === 'Lead' && t.relatedToName === lead.name);
  }, [tasks, lead]);

  // Data is still loading (e.g. right after a full-page navigation to this
  // route) — show a loading state instead of a false "not found."
  if (!lead && loading) {
    return (
      <div id="lead-loading" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">Loading lead record…</p>
      </div>
    );
  }

  // Fallback if lead genuinely not found
  if (!lead) {
    return (
      <div id="lead-not-found" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Lead Record Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">The customer profile you are attempting to review may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
      </div>
    );
  }

  // Callback to persist profile mutations
  const handleProfileSave = (updatedFields: Partial<Lead>) => {
    onUpdateLead(lead.id, updatedFields);
    setShowEditSheet(false);
    showToast('Lead details updated.', 'success');
  };

  // Timeline note CRUD callbacks
  const handleAddNote = (content: string) => {
    const entry = {
      id: `NOTE-${Date.now()}`,
      content,
      date: new Date().toISOString(),
      author: currentUser.name
    };
    onUpdateLead(lead.id, {
      notes: content,
      notes_history: [entry, ...notesHistory]
    });
    showToast('Note added.', 'success');
  };

  const handleSaveEditedNote = (id: string, content: string) => {
    const updated = notesHistory.map(note =>
      note.id === id ? { ...note, content, date: new Date().toISOString() } : note
    );
    onUpdateLead(lead.id, {
      notes_history: updated,
      notes: updated[0]?.content || ''
    });
    showToast('Note updated.', 'success');
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notesHistory.filter(n => n.id !== id);
    onUpdateLead(lead.id, {
      notes_history: filtered,
      notes: filtered[0]?.content || ''
    });
    showToast('Note removed.', 'success');
  };

  const handleSendEmail = (subject: string, body: string) => {
    onUpdateLead(lead.id, {
      lastActivity: `Sent email regarding: "${subject}"`
    });
    showToast(`Email sent to ${lead.email}.`, 'success');
  };

  const handleConvertLead = (dealPayload: ConvertLeadDealPayload | null) => {
    // 1. Add contact to contacts directory
    addContact({
      name: lead.name,
      firstName: lead.firstName || lead.name.split(' ')[0] || '',
      lastName: lead.lastName || lead.name.split(' ').slice(1).join(' ') || '',
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      assignedTo: lead.assignedTo,
      notes: lead.notes || 'Converted from Lead.',
      companyWebsite: lead.companyWebsite || '',
      facebook: lead.facebook || '',
      emailOptOut: lead.emailOptOut || false,
      priority: lead.priority || 'Medium',
      addressInfo: lead.addressInfo || {},
      dealValue: lead.dealValue,
      notes_history: notesHistory
    });

    // 2. Add deal opportunity (if dealPayload exists)
    if (dealPayload) {
      const defaultCloseDate = new Date();
      defaultCloseDate.setDate(defaultCloseDate.getDate() + 30);
      onAddDeal({
        title: dealPayload.title,
        company: lead.company,
        value: dealPayload.value,
        stage: dealPayload.stage,
        status: 'Open',
        contactPerson: lead.name,
        email: lead.email,
        phone: lead.phone,
        expectedCloseDate: defaultCloseDate.toISOString().slice(0, 10),
        assignedTo: dealPayload.assignedTo,
      });
    }

    // 3. Mark lead as Qualified
    onUpdateLead(lead.id, { status: 'Qualified' });

    showToast(`Converted "${lead.name}" into a contact.`, 'success');
    onBack();
  };

  return (
    <div id="lead-details-viewport" className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      
      {/* 1. Header & Navigation Command Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2">
        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Back to leads directory"
            className="p-2 cursor-pointer bg-card hover:bg-muted text-foreground rounded-md border border-border transition-colors flex items-center justify-center shadow-xs h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{lead.name}</h1>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                {lead.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Strategic Account Entity linked to {lead.company}
            </p>
          </div>
        </div>

        {/* Dynamic Action Controls for CRM Lead Status */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-medium">Pipeline Status:</span>
            <FormSelect
              id="lead-detail-status-direct"
              value={lead.status}
              onChange={(val) => {
                onUpdateLead(lead.id, { status: val as LeadStatus });
              }}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Working', label: 'Working' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Nurturing', label: 'Nurturing' },
                { value: 'Unqualified', label: 'Unqualified' }
              ]}
              className="w-36 font-semibold"
            />
          </div>

          <div className="hidden sm:block h-6 w-[1.5px] bg-border" />

          {/* Edit lead button */}
          <Button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="h-9 px-3.5 border border-border text-xs font-semibold text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Convert Lead to Contact */}
          <Button
            type="button"
            onClick={() => setShowConvertSheet(true)}
            className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Convert
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
                  setEmailSubject(`Introductory Briefing regarding ${lead.company}`);
                  setEmailBody(`Hi ${lead.name},\n\nI hope you're having a productive week. I wanted to touch base regarding solutions we've outlined for ${lead.company}...\n\nBest regards,\n${lead.assignedTo || currentUser.name}`);
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

      {/* 2. Pipeline Progress Block Tracker */}
      <CRMProgressBanner value={lead.status} type="status" />

      {/* 3. Core Split Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Lead Profile & Details Info Cards (1/3) */}
        <div className="space-y-6">
          <CRMDemographicsCard 
            entity={lead as any} 
            onUpdateRepresentative={(val) => onUpdateLead(lead.id, { assignedTo: val })}
            onUpdateDealValue={(val) => onUpdateLead(lead.id, { dealValue: val })}
          />

          <CRMAddressCard addressInfo={lead.addressInfo} />

          <AttachmentsPanel entityType="Lead" entityId={lead.id} />
        </div>

        {/* RIGHT COLUMN: Timeline Notes & Followups Checklist (2/3) */}
        <div className="lg:col-span-2">
          <CRMInteractionTabs 
            relatedName={lead.name}
            assignedTo={lead.assignedTo}
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

      {/* Slide-out Sidebar sheets */}
      <CRMEditEntitySheet 
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        entityType="Lead"
        entity={lead}
        onSave={handleProfileSave}
      />

      <CRMOutboundEmailSheet 
        open={showEmailSheet}
        onOpenChange={setShowEmailSheet}
        contactEmail={lead.email}
        initialSubject={emailSubject}
        initialBody={emailBody}
        onSendEmail={handleSendEmail}
      />

      <CRMConvertLeadSheet 
        open={showConvertSheet}
        onOpenChange={setShowConvertSheet}
        lead={lead}
        onConvert={handleConvertLead}
      />

    </div>
  );
}
