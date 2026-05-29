/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  CheckCircle, 
  User, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  CheckSquare, 
  Square,
  Sparkles,
  Briefcase,
  MapPin,
  Globe,
  Facebook,
  Building2,
  CalendarDays,
  UserCog,
  PhoneCall,
  History,
  Info,
  TrendingUp,
  MoreVertical,
  DollarSign,
  Eye,
  Edit2
} from 'lucide-react';
import { Contact, CRMTask, Activity, Deal, DealStage } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

  // Active view states
  const [activeTab, setActiveTab] = useState<'notes' | 'followup' | 'meeting'>('notes');
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [showDealSheet, setShowDealSheet] = useState(false);

  // Profile fields state
  const [editFirstName, setEditFirstName] = useState(contact.firstName || contact.name.split(' ')[0] || '');
  const [editLastName, setEditLastName] = useState(contact.lastName || contact.name.split(' ').slice(1).join(' ') || '');
  const [editCompany, setEditCompany] = useState(contact.company || '');
  const [editEmail, setEditEmail] = useState(contact.email || '');
  const [editPhone, setEditPhone] = useState(contact.phone || '');
  const [editSource, setEditSource] = useState(contact.source || 'Inbound');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>(contact.priority || 'Medium');
  const [editWebsite, setEditWebsite] = useState(contact.companyWebsite || '');
  const [editFacebook, setEditFacebook] = useState(contact.facebook || '');
  const [editEmailOptOut, setEditEmailOptOut] = useState(!!contact.emailOptOut);
  const [editStreet, setEditStreet] = useState(contact.addressInfo?.street || '');
  const [editCity, setEditCity] = useState(contact.addressInfo?.city || '');
  const [editState, setEditState] = useState(contact.addressInfo?.state || '');
  const [editPostalCode, setEditPostalCode] = useState(contact.addressInfo?.postalCode || '');
  const [editCountry, setEditCountry] = useState(contact.addressInfo?.country || '');
  const [editAssignedTo, setEditAssignedTo] = useState(contact.assignedTo || 'Sarah Jenkins');
  const [editNotes, setEditNotes] = useState(contact.notes || '');

  // Sub action forms states
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  const [newFollowupTitle, setNewFollowupTitle] = useState('');
  const [newFollowupPriority, setNewFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newFollowupCategory, setNewFollowupCategory] = useState<'Call' | 'Email' | 'Meeting' | 'Proposal' | 'Follow-up'>('Follow-up');
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-01');

  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingPriority, setNewMeetingPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [meetingSelectedDate, setMeetingSelectedDate] = useState('2026-06-05');

  const [emailSubject, setEmailSubject] = useState(`Enterprise Account Partnership Update`);
  const [emailBody, setEmailBody] = useState(`Hi ${contact.name},\n\nI hope your week is off to an excellent start. I am reaching out to provide a quick sync update...\n\nBest regards,\n${contact.assignedTo || 'Sarah Jenkins'}`);

  // Deal creation variables
  const [newDealName, setNewDealName] = useState(`${contact.company} Partnership Deal`);
  const [newDealAmount, setNewDealAmount] = useState(25000);
  const [newDealStage, setNewDealStage] = useState<DealStage>('Lead In');

  // Load timeline notes history from contact record
  const rawHistory: Array<{ id: string; content: string; date: string; author: string }> = contact.notes_history || [];
  const notesHistory = React.useMemo(() => {
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
    return tasks.filter(task => 
      task.relatedToName === contact.name || 
      task.title.toLowerCase().includes(contact.name.toLowerCase()) || 
      task.title.toLowerCase().includes(contact.company.toLowerCase())
    );
  }, [tasks, contact]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${editFirstName} ${editLastName}`.trim();
    onUpdateContact(contact.id, {
      name: fullName,
      firstName: editFirstName,
      lastName: editLastName,
      company: editCompany,
      email: editEmail,
      phone: editPhone,
      source: editSource,
      priority: editPriority,
      companyWebsite: editWebsite,
      facebook: editFacebook,
      emailOptOut: editEmailOptOut,
      assignedTo: editAssignedTo,
      notes: editNotes,
      addressInfo: {
        street: editStreet,
        city: editCity,
        state: editState,
        postalCode: editPostalCode,
        country: editCountry
      }
    });
    alert('Contact relationships profile successfully saved.');
    setShowEditSheet(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    const entry = {
      id: `NOTE-${Date.now()}`,
      content: newNoteContent,
      date: new Date().toISOString(),
      author: 'Sarah Jenkins' // Default system actor
    };
    onUpdateContact(contact.id, {
      notes: newNoteContent,
      notes_history: [entry, ...notesHistory]
    });
    setNewNoteContent('');
    alert('Timeline note added successfully.');
  };

  const handleSaveEditedNote = (id: string) => {
    if (!editNoteText.trim()) return;
    const updated = notesHistory.map(note => 
      note.id === id ? { ...note, content: editNoteText, date: new Date().toISOString() } : note
    );
    onUpdateContact(contact.id, {
      notes_history: updated,
      notes: updated[0]?.content || ''
    });
    setEditNoteId(null);
    setEditNoteText('');
    alert('Relationship timeline note customized.');
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Delete this historical note entry? This is irreversible.')) return;
    const filtered = notesHistory.filter(n => n.id !== id);
    onUpdateContact(contact.id, {
      notes_history: filtered,
      notes: filtered[0]?.content || ''
    });
    alert('Timeline note entry removed.');
  };

  // Status mapping progress config matches lead details style perfectly
  const getRelationshipProgress = (priority: 'Low' | 'Medium' | 'High') => {
    switch (priority) {
      case 'Low': return { percent: 35, color: 'bg-slate-400', banner: 'bg-slate-50 border-slate-200 text-slate-800', txt: 'Baseline Partner: Profile & Intake Sourcing Achieved' };
      case 'Medium': return { percent: 70, color: 'bg-indigo-500', banner: 'bg-indigo-50 border-indigo-200 text-indigo-800', txt: 'Active Synergistic Portfolio: Continuous Workflows' };
      case 'High': return { percent: 95, color: 'bg-emerald-500', banner: 'bg-emerald-50 border-emerald-200 text-emerald-800', txt: 'VIP Strategic Enterprise Client: Exceptional Account Integration' };
      default: return { percent: 50, color: 'bg-blue-500', banner: 'bg-blue-50 border-blue-200 text-blue-800', txt: 'Standard Unified Operational Sync' };
    }
  };

  const relationshipProgress = getRelationshipProgress(contact.priority || 'Medium');

  return (
    <div id="contact-details-dashboard" className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      
      {/* 1. Header and Actions Row - Matches lead layout exactly */}
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

        {/* Dynamic Action Controls with brand-matching styles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium select-none">Contact Priority:</span>
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
            onClick={() => {
              // Preload edit states
              setEditFirstName(contact.firstName || contact.name.split(' ')[0] || '');
              setEditLastName(contact.lastName || contact.name.split(' ').slice(1).join(' ') || '');
              setEditCompany(contact.company || '');
              setEditEmail(contact.email || '');
              setEditPhone(contact.phone || '');
              setEditSource(contact.source || 'Inbound');
              setEditPriority(contact.priority || 'Medium');
              setEditWebsite(contact.companyWebsite || '');
              setEditFacebook(contact.facebook || '');
              setEditEmailOptOut(!!contact.emailOptOut);
              setEditStreet(contact.addressInfo?.street || '');
              setEditCity(contact.addressInfo?.city || '');
              setEditState(contact.addressInfo?.state || '');
              setEditPostalCode(contact.addressInfo?.postalCode || '');
              setEditCountry(contact.addressInfo?.country || '');
              setEditAssignedTo(contact.assignedTo || 'Sarah Jenkins');
              setEditNotes(contact.notes || '');
              setShowEditSheet(true);
            }}
            className="h-9 px-3.5 border border-[#D1D5DB] text-xs font-semibold text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Launch Deal */}
          <Button
            type="button"
            onClick={() => {
              setNewDealName(`${contact.company} Opportunity Proposal`);
              setNewDealAmount(25000);
              setShowDealSheet(true);
            }}
            className="h-9 px-3.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5 animate-none"
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
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#F3F4F6] rounded flex items-center gap-2 cursor-pointer border-0 w-full"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                Send Email
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Pipeline Integrity Banner Card */}
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 border rounded-[4px] text-xs font-semibold ${relationshipProgress.banner}`}>
              {contact.priority} Account Stage
            </span>
            <span className="text-xs font-semibold text-slate-700">{relationshipProgress.txt}</span>
          </div>
          <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded">
            Stage Weight {relationshipProgress.percent}%
          </span>
        </div>
        <div className="p-4 bg-white">
          <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${relationshipProgress.color} transition-all duration-300 ease-out`}
              style={{ width: `${relationshipProgress.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>DISCOVERY (25%)</span>
            <span>PROFILE INTEGRATED (50%)</span>
            <span>SYNERGY (70%)</span>
            <span>STRATEGIC CORE (95%)</span>
            <span>FULLY ENGAGED (100%)</span>
          </div>
        </div>
      </Card>

      {/* 3. Core Workspace splits - Matches CRM leads structural constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Demographic Metadata (1/3) */}
        <div className="space-y-6">
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px]">
            <CardHeader className="py-4 border-b border-[#F5F6F8]">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500">
                Contact Demographics
              </CardTitle>
              <CardDescription className="text-[11px]">Primary operational business indicators</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs font-sans">
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </span>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px] select-all">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">None listed</span>
                )}
              </div>

              <div className="flex items-center justify-between font-sans">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Direct Phone lines
                </span>
                <span className="font-semibold text-slate-800">{contact.phone || 'None listed'}</span>
              </div>

              <div className="flex items-center justify-between font-sans">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Acquisition Channel
                </span>
                <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                  {contact.source}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Assigned Owner
                </span>
                <FormSelect
                  value={contact.assignedTo}
                  onChange={(val) => onUpdateContact(contact.id, { assignedTo: val })}
                  options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
                  className="w-36 text-right font-semibold text-[#111827]"
                />
              </div>

              {/* Web links */}
              {contact.companyWebsite && (
                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Company Web
                  </span>
                  <a 
                    href={contact.companyWebsite.startsWith('http') ? contact.companyWebsite : `https://${contact.companyWebsite}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-semibold text-[#2563EB] hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              {contact.facebook && (
                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Facebook className="h-3.5 w-3.5" />
                    Social Profile
                  </span>
                  <a 
                    href={contact.facebook.startsWith('http') ? contact.facebook : `https://${contact.facebook}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    View Facebook
                  </a>
                </div>
              )}

              {/* Email Opt Out / Marketing Sub status */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Marketing Mail
                </span>
                {contact.emailOptOut ? (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    Opted Out
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Subscribed
                  </span>
                )}
              </div>

              <div className="h-[1px] bg-slate-100 my-2" />

              {/* Deal Valuation mutation form */}
              <div className="space-y-2.5">
                <label className="text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  Calculated Deal Size (USD)
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 font-bold text-sm">$</span>
                  <Input
                    type="number"
                    value={contact.dealValue || 0}
                    onChange={(e) => onUpdateContact(contact.id, { dealValue: Number(e.target.value) || 0 })}
                    className="h-8 py-1 px-2 border border-[#E5E7EB] text-xs font-bold text-slate-800 bg-[#F9FAFB] rounded"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Adjust contact deal value estimate to sync forecasting models.</p>
              </div>

            </CardContent>
          </Card>

          {/* Locations */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px]">
            <CardHeader className="py-4 border-b border-[#F5F6F8]">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500">
                Geography Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-slate-650 font-sans space-y-1">
              {contact.addressInfo?.street || contact.addressInfo?.city ? (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">{contact.addressInfo.street || 'Address N/A'}</span>
                  <div className="text-slate-400 space-x-1 font-medium text-[11px]">
                    <span>{contact.addressInfo.city || 'City N/A'},</span>
                    <span>{contact.addressInfo.state || 'Region N/A'},</span>
                    <span>{contact.addressInfo.postalCode || 'Zip N/A'}</span>
                  </div>
                  <span className="text-[#6B7280] font-bold block pt-1">{contact.addressInfo.country || 'USA'}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic block">No physical work site registered.</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE & RIGHT COMBINED WORKSPACE (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden shadow-xs">
            
            {/* Elegant tabs with matching royal blue selection line */}
            <div className="border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-1 px-4 select-none">
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notes' 
                    ? 'border-[#2563EB] text-[#2563EB]' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Timeline interaction notes ({notesHistory.length})
              </button>

              <button
                onClick={() => setActiveTab('followup')}
                className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'followup' 
                    ? 'border-[#2563EB] text-[#2563EB]' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Action Task Checklist ({relatedTasks.filter(t => t.category !== 'Meeting').length})
              </button>

              <button
                onClick={() => setActiveTab('meeting')}
                className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'meeting' 
                    ? 'border-[#2563EB] text-[#2563EB]' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Booked Sync Meetings ({relatedTasks.filter(t => t.category === 'Meeting').length})
              </button>
            </div>

            <CardContent className="p-4 sm:p-6">
              
              {/* TAB 1: NOTES TIMELINE FEED */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <Textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Insert notes of interactions, call updates, meeting brief details..."
                      className="min-h-[92px] text-xs bg-slate-50 border-[#CBD5E1] rounded-[6px] outline-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 h-8 text-xs font-semibold rounded-[6px]"
                      >
                        Add Timeline Note
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5">Historical Narrative Notes</span>

                    {notesHistory.length === 0 ? (
                      <span className="text-slate-400 italic block text-xs">No recorded logs registered.</span>
                    ) : (
                      <div className="space-y-4">
                        {notesHistory.map((note) => (
                          <div key={note.id} className="p-4 border border-[#E5E7EB] bg-[#F9FAFB]/50 rounded-[6px] text-xs space-y-2 relative">
                            
                            <div className="flex items-center justify-between select-none">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{note.author}</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                <span className="text-[11px] text-slate-400 font-mono font-medium">{formatRelativeTime(note.date)}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setEditNoteId(note.id);
                                    setEditNoteText(note.content);
                                  }}
                                  className="h-7 px-2 border-0 text-blue-500 hover:text-blue-600 hover:bg-slate-100 font-semibold"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-7 px-2 border-0 text-rose-500 hover:text-rose-600 hover:bg-slate-100 font-semibold"
                                >
                                  Wipe
                                </Button>
                              </div>
                            </div>

                            {editNoteId === note.id ? (
                              <div className="space-y-2 pt-2">
                                <Textarea
                                  value={editNoteText}
                                  onChange={(e) => setEditNoteText(e.target.value)}
                                  className="text-xs min-h-[70px] bg-white border border-[#CBD5E1]"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEditNoteId(null)} 
                                    className="h-8 px-2.5 text-xs text-slate-700"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleSaveEditedNote(note.id)} 
                                    className="h-8 px-2.5 bg-[#2563EB] text-white text-xs font-semibold"
                                  >
                                    Commit
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-650 leading-relaxed text-[12px] whitespace-pre-wrap">{note.content}</p>
                            )}

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS CHECKLISTS */}
              {activeTab === 'followup' && (
                <div className="space-y-6">
                  
                  {/* Task Allocator Form */}
                  <div className="p-4 border border-[#E5E7EB] bg-slate-50/50 rounded-[6px] space-y-4">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-none select-none">Schedule profile task followup</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Action Subject</label>
                        <Input
                          type="text"
                          value={newFollowupTitle}
                          onChange={(e) => setNewFollowupTitle(e.target.value)}
                          placeholder="e.g. Schedule corporate brief, follow-up on service model..."
                          className="h-9 text-xs bg-white border-[#CBD5E1] rounded-[6px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Target Date</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full h-9 px-3 border border-[#CBD5E1] rounded-[6px] text-xs bg-white text-[#374151]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Action Class</label>
                        <FormSelect
                          value={newFollowupCategory}
                          onChange={(val) => setNewFollowupCategory(val as any)}
                          options={[
                            { value: 'Call', label: 'Call Action' },
                            { value: 'Email', label: 'Email Interaction' },
                            { value: 'Meeting', label: 'Business Sync Session' },
                            { value: 'Proposal', label: 'SLA Proposal Sent' },
                            { value: 'Follow-up', label: 'Routine account brief follow-up' }
                          ]}
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Action Priority</label>
                        <FormSelect
                          value={newFollowupPriority}
                          onChange={(val) => setNewFollowupPriority(val as any)}
                          options={[
                            { value: 'Low', label: 'Low weight' },
                            { value: 'Medium', label: 'Medium priority' },
                            { value: 'High', label: '🔥 High enterprise priority' }
                          ]}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={() => {
                          if (!newFollowupTitle.trim()) {
                            alert('Please state action title checklist brief.');
                            return;
                          }
                          onAddTask({
                            title: newFollowupTitle,
                            dueDate: selectedDate,
                            priority: newFollowupPriority,
                            status: 'Pending',
                            assignedTo: contact.assignedTo || 'Sarah Jenkins',
                            category: newFollowupCategory,
                            relatedToType: 'None',
                            relatedToName: contact.name
                          });
                          setNewFollowupTitle('');
                          alert('Interaction task checklist item established.');
                        }}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 h-9 text-xs font-semibold rounded-[6px] cursor-pointer"
                      >
                        Allocate Follow-up Task
                      </Button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3 font-sans">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5">Assigned checklists and follow-ups</span>
                    
                    {relatedTasks.filter(task => task.category !== 'Meeting').length === 0 ? (
                      <span className="text-slate-400 italic block text-xs py-2">No pending task checklists listed for this contact.</span>
                    ) : (
                      <div className="space-y-3">
                        {relatedTasks.filter(task => task.category !== 'Meeting').map((task) => {
                          const isDone = task.status === 'Completed';
                          return (
                            <div 
                              key={task.id} 
                              className={`p-3.5 border rounded-[6px] text-xs flex items-center justify-between ${
                                isDone ? 'bg-slate-50/50 border-slate-200 text-slate-400' : 'bg-white border-[#E5E7EB]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(task.id)}
                                  className="text-slate-450 hover:text-[#2563EB] transition cursor-pointer bg-transparent border-0 p-0"
                                >
                                  {isDone ? (
                                    <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-50 shrink-0" />
                                  ) : (
                                    <Square className="h-5 w-5 text-slate-300 hover:border-slate-500 shrink-0" />
                                  )}
                                </button>

                                <div className="space-y-0.5">
                                  <span className={`block text-[13px] font-bold ${isDone ? 'line-through text-slate-400 font-medium' : 'text-slate-700'}`}>
                                    {task.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5 select-none">
                                    <span className="font-semibold uppercase bg-slate-100 px-1 py-0.5 text-slate-600 rounded">{task.category}</span>
                                    <span>•</span>
                                    <span>Due: {task.dueDate}</span>
                                    <span>•</span>
                                    <span className="font-semibold">{task.priority} Weight</span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm('Delete this checklist item?')) {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-500 rounded-full border-0 cursor-pointer flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: BOOKED SYNC MEETINGS */}
              {activeTab === 'meeting' && (
                <div className="space-y-6">
                  
                  {/* Sync Meeting scheduling Form */}
                  <div className="p-4 border border-[#E5E7EB] bg-slate-50/50 rounded-[6px] space-y-4">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-none select-none">Schedule New Sync Meeting</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Meeting Subject / Agenda</label>
                        <Input
                          type="text"
                          value={newMeetingTitle}
                          onChange={(e) => setNewMeetingTitle(e.target.value)}
                          placeholder="e.g. Solution demo presentation, pricing feedback review..."
                          className="h-9 text-xs bg-white border border-[#E5E7EB] rounded-[6px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Scheduled Date</label>
                        <input
                          type="date"
                          value={meetingSelectedDate}
                          onChange={(e) => setMeetingSelectedDate(e.target.value)}
                          className="w-full h-9 px-3 border border-[#E5E7EB] rounded-[6px] text-xs bg-white text-[#374151]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-500">Meeting Priority Weight</label>
                        <FormSelect
                          value={newMeetingPriority}
                          onChange={(val) => setNewMeetingPriority(val as any)}
                          options={[
                            { value: 'Low', label: 'Low priority' },
                            { value: 'Medium', label: 'Medium default priority' },
                            { value: 'High', label: '🔥 Urgent decision maker meeting' }
                          ]}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={() => {
                          if (!newMeetingTitle.trim()) {
                            alert('Please state meeting brief subject.');
                            return;
                          }
                          onAddTask({
                            title: newMeetingTitle,
                            dueDate: meetingSelectedDate,
                            priority: newMeetingPriority,
                            status: 'Pending',
                            assignedTo: contact.assignedTo || 'Sarah Jenkins',
                            category: 'Meeting',
                            relatedToType: 'None',
                            relatedToName: contact.name
                          });
                          setNewMeetingTitle('');
                          alert(`Sync meeting scheduled successfully under date "${meetingSelectedDate}".`);
                        }}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 h-9 text-xs font-semibold rounded-[6px] cursor-pointer"
                      >
                        Book Sync Meeting
                      </Button>
                    </div>
                  </div>

                  {/* Meetings lists */}
                  <div className="space-y-3 font-sans">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5">Scheduled Sync Briefs</span>
                    
                    {relatedTasks.filter(t => t.category === 'Meeting').length === 0 ? (
                      <span className="text-slate-400 italic block text-xs py-2">No booked meetings listed for this contact.</span>
                    ) : (
                      <div className="space-y-3">
                        {relatedTasks.filter(t => t.category === 'Meeting').map((task) => {
                          const isDone = task.status === 'Completed';
                          return (
                            <div 
                              key={task.id} 
                              className={`p-3.5 border rounded-[6px] text-xs flex items-center justify-between ${
                                isDone ? 'bg-slate-50/50 border-slate-200 text-slate-400' : 'bg-white border-[#E5E7EB]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(task.id)}
                                  className="text-slate-450 hover:text-[#2563EB] transition cursor-pointer bg-transparent border-0 p-0"
                                >
                                  {isDone ? (
                                    <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-50 shrink-0" />
                                  ) : (
                                    <Square className="h-5 w-5 text-slate-300 hover:border-slate-500 shrink-0" />
                                  )}
                                </button>

                                <div className="space-y-0.5">
                                  <span className={`block text-[13px] font-bold ${isDone ? 'line-through text-slate-400 font-medium' : 'text-slate-700'}`}>
                                    {task.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5 select-none">
                                    <span className="font-semibold uppercase bg-slate-105 px-1 py-0.5 text-slate-600 rounded font-mono">{task.category}</span>
                                    <span>•</span>
                                    <span>Due: {task.dueDate}</span>
                                    <span>•</span>
                                    <span className="font-semibold">{task.priority} Weight</span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm('Delete this scheduled meeting brief?')) {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-500 rounded-full border-0 cursor-pointer flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

      {/* 4. SHEET OVERLAYS FOR CONTACT OPERATIONS */}

      {/* SIDE PANEL: EDIT RELATIONSHIP MASTER RECORD */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Edit Customer Profile Settings
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Ref ID / Identifier: {contact.id}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 crm-scrollbar text-xs">
            {/* 1. Name section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. Robert"
                />
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. Downey"
                />
              </div>
            </div>

            {/* 2. Company section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. Stark Industries"
                />
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Company Website URL
                </label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. starkindustries.com"
                />
              </div>
            </div>

            {/* 3. Communication section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="robert@stark.com"
                />
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. +1 (555) 019-2834"
                />
              </div>
            </div>

            {/* 4. Social & Opt-Out */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Facebook Profile URL
                </label>
                <input
                  type="text"
                  value={editFacebook}
                  onChange={(e) => setEditFacebook(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div className="flex flex-col justify-end pb-1">
                <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-[6px] px-3 h-10">
                  <input
                    type="checkbox"
                    id="edit-email-opt-out-cb-contact"
                    checked={editEmailOptOut}
                    onChange={(e) => setEditEmailOptOut(e.target.checked)}
                    className="rounded border-[#E5E7EB] text-[#2563EB] focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="edit-email-opt-out-cb-contact" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                    Opt-out Communications
                  </label>
                </div>
              </div>
            </div>

            {/* 5. Address Geography Sections */}
            <div className="border border-slate-100 rounded-lg p-3.5 space-y-3 bg-[#F8FAFC]">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500 shadow-none scale-100 border-none" />
                Office Location Data
              </h3>
              
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                  Street Address
                </label>
                <input
                  type="text"
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="e.g. 10880 Malibu Point"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="e.g. Malibu"
                  />
                </div>

                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="e.g. CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="e.g. 90265"
                  />
                </div>

                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="e.g. United States"
                  />
                </div>
              </div>
            </div>

            {/* 6. Classification settings drop-downs */}
            <div className="grid grid-cols-3 gap-3">
              <FormSelect
                label="Acquisition Source"
                value={editSource}
                onChange={(val) => setEditSource(val as any)}
                options={[
                  { value: 'Website', label: 'Website' },
                  { value: 'Referral', label: 'Referral' },
                  { value: 'Cold Call', label: 'Cold Call' },
                  { value: 'Inbound', label: 'Inbound' },
                  { value: 'LinkedIn', label: 'LinkedIn' },
                  { value: 'Ad Campaign', label: 'Ad Campaign' },
                  { value: 'Partnership', label: 'Partnership' }
                ]}
              />

              <FormSelect
                label="Account Handler"
                value={editAssignedTo}
                onChange={(val) => setEditAssignedTo(val)}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />

              <FormSelect
                label="Priority"
                value={editPriority}
                onChange={(val) => setEditPriority(val as any)}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' }
                ]}
              />
            </div>

            {/* 7. Internal Narrative Note */}
            <div className="flex flex-col space-y-1.5 w-full">
              <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
                Internal notes & relationship brief
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] min-h-[82px]"
                placeholder="Insert any relevant context from calls, introductions..."
                rows={3}
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-end gap-3 font-semibold">
            <Button
              type="button"
              onClick={() => setShowEditSheet(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editFirstName || !editLastName || !editCompany) {
                  alert('First name, last name, and Associated company name are required fields.');
                  return;
                }
                onUpdateContact(contact.id, {
                  firstName: editFirstName,
                  lastName: editLastName,
                  name: `${editFirstName} ${editLastName}`,
                  company: editCompany,
                  email: editEmail,
                  phone: editPhone,
                  source: editSource,
                  priority: editPriority,
                  companyWebsite: editWebsite,
                  facebook: editFacebook,
                  emailOptOut: editEmailOptOut,
                  assignedTo: editAssignedTo,
                  notes: editNotes,
                  addressInfo: {
                    street: editStreet,
                    city: editCity,
                    state: editState,
                    postalCode: editPostalCode,
                    country: editCountry
                  }
                });
                alert('Relationship contact settings updated.');
                setShowEditSheet(false);
              }}
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Save Profile Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: EMAIL OUTBOUND DISPATCH */}
      <Sheet open={showEmailSheet} onOpenChange={setShowEmailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Dispatch Corporate Email Message
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Recipient address: {contact.email || 'N/A'}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">Recipient Contact Email</label>
              <Input type="text" value={contact.email || ''} disabled className="h-9 text-xs bg-[#F3F4F6] text-slate-500 cursor-not-allowed" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">Subject Heading</label>
              <Input type="text" value={emailSubject} onChange={(e)=>setEmailSubject(e.target.value)} className="h-9 text-xs bg-white" placeholder="Priority update heading..." />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">Narrative message content</label>
              <Textarea value={emailBody} onChange={(e)=>setEmailBody(e.target.value)} className="min-h-[170px] text-xs font-sans whitespace-pre-wrap" />
            </div>

            <Button
              onClick={() => {
                if (!emailBody.trim() || !emailSubject.trim()) {
                  alert('Subject and Message content are required.');
                  return;
                }
                onUpdateContact(contact.id, {
                  lastActivity: `Sent email regarding: "${emailSubject}"`
                });
                alert(`Corporate outbound email successfully dispatched to ${contact.email}.`);
                setShowEmailSheet(false);
              }}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 mt-1.5 font-semibold shrink-0 cursor-pointer text-xs rounded-[6px]"
            >
              Send Outbound Message
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: CREATE DEAL OPPORTUNITY */}
      <Sheet open={showDealSheet} onOpenChange={setShowDealSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Launch Deal Opportunity
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Client account: {contact.company}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide block">Deal Title / Opportunity Name</label>
              <Input type="text" value={newDealName} onChange={(e)=>setNewDealName(e.target.value)} className="h-9 text-xs" placeholder="MI6 Logistics Supply SLA" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide block">Contract Value Opportunity ($)</label>
              <Input type="number" value={newDealAmount} onChange={(e)=>setNewDealAmount(Number(e.target.value))} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide block">Initial Deal Pipeline Stage</label>
              <FormSelect
                value={newDealStage}
                onChange={(val)=>setNewDealStage(val as DealStage)}
                options={[
                  { value: 'Lead In', label: 'Lead In' },
                  { value: 'Contact Made', label: 'Contact Made' },
                  { value: 'Demo Scheduled', label: 'Demo Scheduled' },
                  { value: 'Proposal Sent', label: 'Proposal Sent' },
                  { value: 'Negotiation', label: 'Negotiation' },
                  { value: 'Won', label: 'Won' },
                  { value: 'Lost', label: 'Lost' }
                ]}
              />
            </div>

            <Button
              onClick={() => {
                if (!newDealName.trim() || !newDealAmount) {
                  alert('Deal name and Contract opportunity values are required.');
                  return;
                }
                onAddDeal({
                  title: newDealName,
                  company: contact.company,
                  contactPerson: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  value: newDealAmount,
                  stage: newDealStage,
                  status: (newDealStage === 'Won' ? 'Won' : newDealStage === 'Lost' ? 'Lost' : 'Open') as 'Open' | 'Won' | 'Lost',
                  expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  assignedTo: contact.assignedTo || 'Sarah Jenkins'
                });
                alert('CRM Deal established successfully. Go to Deals pipeline.');
                setShowDealSheet(false);
              }}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 mt-1.5 font-semibold text-xs rounded-[6px] cursor-pointer shrink-0"
            >
              Launch Deal Transaction Opportunity
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
