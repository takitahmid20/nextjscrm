/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Mail, User, Sparkles, TrendingUp, MoreVertical, Briefcase } from 'lucide-react';
import { Lead, CRMTask, Deal } from '../types';
import { useCRM } from '../context/CRMContext';
import { Button } from '@/components/ui/button';
import { FormSelect } from './forms/FormControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Modular Refactored CRM components imports
import CRMProgressBanner from './details/CRMProgressBanner';
import CRMDemographicsCard from './details/CRMDemographicsCard';
import CRMAddressCard from './details/CRMAddressCard';
import CRMInteractionTabs from './details/CRMInteractionTabs';
import CRMEditEntitySheet from './sheets/CRMEditEntitySheet';
import CRMOutboundEmailSheet from './sheets/CRMOutboundEmailSheet';
import CRMConvertLeadSheet from './sheets/CRMConvertLeadSheet';

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
  const { addContact } = useCRM();

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
  const rawHistory: Array<{ id: string; content: string; date: string; author: string }> = (lead as any)?.notes_history || [];
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

  // Fallback if lead not found
  if (!lead) {
    return (
      <div id="lead-not-found" className="text-center py-16 bg-white border border-[#E5E7EB] rounded-lg shadow-sm">
        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Lead Record Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">The customer profile you are attempting to review may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
      </div>
    );
  }

  // Callback to persist profile mutations
  const handleProfileSave = (updatedFields: any) => {
    onUpdateLead(lead.id, updatedFields);
    setShowEditSheet(false);
    alert('Lead details updated successfully.');
  };

  // Timeline note CRUD callbacks
  const handleAddNote = (content: string) => {
    const entry = {
      id: `NOTE-${Date.now()}`,
      content,
      date: new Date().toISOString(),
      author: 'Sarah Jenkins' // Default user
    };
    onUpdateLead(lead.id, {
      notes: content,
      notes_history: [entry, ...notesHistory] as any
    });
    alert('Timeline note added successfully.');
  };

  const handleSaveEditedNote = (id: string, content: string) => {
    const updated = notesHistory.map(note => 
      note.id === id ? { ...note, content, date: new Date().toISOString() } : note
    );
    onUpdateLead(lead.id, {
      notes_history: updated as any,
      notes: updated[0]?.content || ''
    });
    alert('Timeline note entry modified.');
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notesHistory.filter(n => n.id !== id);
    onUpdateLead(lead.id, {
      notes_history: filtered as any,
      notes: filtered[0]?.content || ''
    });
    alert('Timeline note entry removed.');
  };

  const handleSendEmail = (subject: string, body: string) => {
    onUpdateLead(lead.id, {
      lastActivity: `Sent email regarding: "${subject}"`
    });
    alert(`Outbound message sent to <${lead.email}>.`);
  };

  const handleConvertLead = (dealPayload: any | null) => {
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
      companyWebsite: (lead as any).companyWebsite || '',
      facebook: (lead as any).facebook || '',
      emailOptOut: (lead as any).emailOptOut || false,
      priority: lead.priority || 'Medium',
      addressInfo: lead.addressInfo || {},
      dealValue: lead.dealValue,
      notes_history: notesHistory
    });

    // 2. Add deal opportunity (if dealPayload exists)
    if (dealPayload) {
      onAddDeal({
        title: dealPayload.title,
        company: lead.company,
        value: dealPayload.value,
        stage: dealPayload.stage,
        status: 'Open',
        contactPerson: lead.name,
        email: lead.email,
        phone: lead.phone,
        expectedCloseDate: '2026-06-30',
        assignedTo: dealPayload.assignedTo,
      });
    }

    // 3. Mark lead as Qualified
    onUpdateLead(lead.id, { status: 'Qualified' });
    
    alert(`Successfully converted Lead "${lead.name}" into Contact & Qualified Account.`);
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
            className="p-2 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-[#E5E7EB] transition-colors flex items-center justify-center shadow-xs h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{lead.name}</h1>
              <span className="text-[11px] font-mono font-semibold text-[#6B7280] bg-[#E5E7EB]/55 px-1.5 py-0.5 rounded uppercase">
                {lead.id}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              Strategic Account Entity linked to {lead.company}
            </p>
          </div>
        </div>

        {/* Dynamic Action Controls for CRM Lead Status */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Pipeline Status:</span>
            <FormSelect
              id="lead-detail-status-direct"
              value={lead.status}
              onChange={(val) => {
                onUpdateLead(lead.id, { status: val as any });
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

          <div className="hidden sm:block h-6 w-[1.5px] bg-[#E5E7EB]" />

          {/* Edit lead button */}
          <Button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="h-9 px-3.5 border border-[#D1D5DB] text-xs font-semibold text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Convert Lead to Contact */}
          <Button
            type="button"
            onClick={() => setShowConvertSheet(true)}
            className="h-9 px-3.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Convert
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
                  setEmailSubject(`Introductory Briefing regarding ${lead.company}`);
                  setEmailBody(`Hi ${lead.name},\n\nI hope you're having a productive week. I wanted to touch base regarding solutions we've outlined for ${lead.company}...\n\nBest regards,\n${lead.assignedTo || 'Sarah Jenkins'}`);
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
