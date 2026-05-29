/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  DollarSign, 
  Activity as ActivityIcon, 
  Plus, 
  Trash2, 
  CheckCircle, 
  User, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  CheckSquare, 
  Square,
  Sparkles,
  TrendingUp,
  Briefcase,
  MapPin,
  MoreVertical,
  Globe,
  Facebook
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, CRMTask, Activity, Deal } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormSelect } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  // Find the current lead
  const lead = leads.find(l => l.id === leadId);

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

  // Local state for edits & new inputs
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showConvertSheet, setShowConvertSheet] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);

  // Edit Lead fields with defaults mapped securely
  const [editFirstName, setEditFirstName] = useState(lead.firstName || lead.name.split(' ')[0] || '');
  const [editLastName, setEditLastName] = useState(lead.lastName || lead.name.split(' ').slice(1).join(' ') || '');
  const [editCompany, setEditCompany] = useState(lead.company || '');
  const [editEmail, setEditEmail] = useState(lead.email || '');
  const [editPhone, setEditPhone] = useState(lead.phone || '');
  const [editStatus, setEditStatus] = useState<LeadStatus>(lead.status || 'New');
  const [editSource, setEditSource] = useState<LeadSource>(lead.source || 'Website');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>(lead.priority || 'Medium');
  const [editWebsite, setEditWebsite] = useState((lead as any).companyWebsite || (lead as any).website || '');
  const [editFacebook, setEditFacebook] = useState((lead as any).facebook || '');
  const [editEmailOptOut, setEditEmailOptOut] = useState(!!(lead as any).emailOptOut);
  const [editStreet, setEditStreet] = useState(lead.addressInfo?.street || '');
  const [editCity, setEditCity] = useState(lead.addressInfo?.city || '');
  const [editState, setEditState] = useState(lead.addressInfo?.state || '');
  const [editPostalCode, setEditPostalCode] = useState(lead.addressInfo?.postalCode || '');
  const [editCountry, setEditCountry] = useState(lead.addressInfo?.country || '');

  // Send Email states
  const [emailSubject, setEmailSubject] = useState(`Introductory Briefing regarding ${lead.company}`);
  const [emailBody, setEmailBody] = useState(`Hi ${lead.name},\n\nI hope you're having a productive week. I wanted to touch base regarding solutions we've outlined for ${lead.company}...\n\nBest regards,\n${lead.assignedTo || 'Sarah Jenkins'}`);

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  
  // Follow-up form states
  const [newFollowupTitle, setNewFollowupTitle] = useState('');
  const [newFollowupPriority, setNewFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newFollowupCategory, setNewFollowupCategory] = useState<'Call' | 'Email' | 'Meeting' | 'Proposal' | 'Follow-up'>('Follow-up');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Initialize and get timeline notes history
  const rawHistory: Array<{ id: string; content: string; date: string; author: string }> = (lead as any).notes_history || [];
  const notesHistory = React.useMemo(() => {
    if (rawHistory.length === 0 && lead.notes) {
      // Seed default notes into history if history is empty
      return [{
        id: 'INIT-NOTE',
        content: lead.notes,
        date: lead.createdAt,
        author: lead.assignedTo || 'System Automated'
      }];
    }
    return rawHistory;
  }, [rawHistory, lead.notes, lead.createdAt, lead.assignedTo]);

  // Filter tasks linked specifically to this Lead
  const relatedTasks = tasks.filter(t => t.relatedToType === 'Lead' && t.relatedToName === lead.name);

  // Status mapping progress config
  const getStatusProgress = (status: LeadStatus) => {
    switch (status) {
      case 'New': return { percent: 15, color: 'bg-slate-400', banner: 'bg-slate-50 border-slate-200 text-slate-800', txt: 'Pipeline Init: Qualified Profiling Stage' };
      case 'Contacted': return { percent: 40, color: 'bg-blue-500', banner: 'bg-blue-50 border-blue-200 text-blue-800', txt: 'Initial Sourcing Engagement Achieved' };
      case 'Working': return { percent: 60, color: 'bg-indigo-500', banner: 'bg-indigo-50 border-indigo-200 text-indigo-800', txt: 'Active Operational Dialogue & Scribing Proposal' };
      case 'Qualified': return { percent: 85, color: 'bg-emerald-500', banner: 'bg-emerald-50 border-emerald-200 text-emerald-800', txt: 'Enterprise Pre-Offer Validation Confirmed' };
      case 'Nurturing': return { percent: 70, color: 'bg-fuchsia-500', banner: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800', txt: 'Strategic High-Touch Long Term Cultivation' };
      case 'Unqualified': return { percent: 100, color: 'bg-red-500', banner: 'bg-rose-50 border-rose-200 text-rose-800', txt: 'Disqualified / Pipeline Closed File' };
      default: return { percent: 0, color: 'bg-gray-300', banner: 'bg-gray-50 border-gray-200 text-gray-800', txt: 'Unknown Status Tracker Code' };
    }
  };

  const statusProgress = getStatusProgress(lead.status);

  // Handle saving new note CRUD
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote = {
      id: `NOTE-${Date.now()}`,
      content: newNoteContent,
      date: new Date().toISOString(),
      author: 'Sarah Jenkins' // Default user
    };

    const updatedHistory = [newNote, ...notesHistory];
    onUpdateLead(lead.id, {
      notes: newNoteContent, // save last note
      notes_history: updatedHistory as any
    });
    setNewNoteContent('');
  };

  // handleDeleteNote CRUD
  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this strategic note?')) {
      const updatedHistory = notesHistory.filter(n => n.id !== id);
      const lastNote = updatedHistory[0]?.content || '';
      onUpdateLead(lead.id, {
        notes: lastNote,
        notes_history: updatedHistory as any
      });
    }
  };

  // handleEditNote save CRUD
  const handleSaveEditNote = (id: string) => {
    if (!editNotesText.trim()) return;
    const updatedHistory = notesHistory.map(n => {
      if (n.id === id) {
        return { ...n, content: editNotesText, date: new Date().toISOString() };
      }
      return n;
    });
    onUpdateLead(lead.id, {
      notes_history: updatedHistory as any
    });
    setEditNotesId(null);
    setEditNotesText('');
  };

  // Handle scheduling new followup action CRUD
  const handleAddFollowupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowupTitle.trim()) return;

    const formattedDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    onAddTask({
      title: newFollowupTitle,
      dueDate: formattedDate,
      priority: newFollowupPriority,
      status: 'Pending',
      assignedTo: lead.assignedTo || 'Sarah Jenkins',
      category: newFollowupCategory,
      relatedToType: 'Lead',
      relatedToName: lead.name
    });

    setNewFollowupTitle('');
    setNewFollowupPriority('Medium');
    setNewFollowupCategory('Follow-up');
    alert(`Scheduled follow-up action booked under "${formattedDate}".`);
  };

  return (
    <div id="lead-details-viewport" className="space-y-6">
      
      {/* 1. Header & Navigation Command Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2">
        <div className="flex items-center space-x-3.5">
          <button
            id="btn-lead-detail-back"
            onClick={onBack}
            className="p-2 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-[#E5E7EB] transition-colors flex items-center justify-center shadow-xs"
            title="Return to operational lead accounts list"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
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

        {/* Dynamic Action Controls for CRM Lead Status and Top Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium select-none">Pipeline Status:</span>
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

          <div className="hidden sm:block h-6 w-[1.5px] bg-[#E5E7EB]" />

          {/* TOP BUTTONS: Edit lead */}
          <Button
            type="button"
            onClick={() => {
              // Pre-populate actual current values
              setEditFirstName(lead.firstName || lead.name.split(' ')[0] || '');
              setEditLastName(lead.lastName || lead.name.split(' ').slice(1).join(' ') || '');
              setEditCompany(lead.company || '');
              setEditEmail(lead.email || '');
              setEditPhone(lead.phone || '');
              setEditStatus(lead.status || 'New');
              setEditSource(lead.source || 'Website');
              setEditPriority(lead.priority || 'Medium');
              setEditWebsite((lead as any).companyWebsite || (lead as any).website || '');
              setEditFacebook((lead as any).facebook || '');
              setEditEmailOptOut(!!(lead as any).emailOptOut);
              setEditStreet(lead.addressInfo?.street || '');
              setEditCity(lead.addressInfo?.city || '');
              setEditState(lead.addressInfo?.state || '');
              setEditPostalCode(lead.addressInfo?.postalCode || '');
              setEditCountry(lead.addressInfo?.country || '');
              setShowEditSheet(true);
            }}
            className="h-9 px-3.5 border border-[#D1D5DB] text-xs font-semibold text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            Edit
          </Button>

          {/* Convert Lead to Opportunity */}
          <Button
            type="button"
            onClick={() => setShowConvertSheet(true)}
            className="h-9 px-3.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Convert
          </Button>

          {/* 3-Dot Popover Menu (Send Mail option) */}
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
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 border rounded-[4px] text-xs font-semibold ${statusProgress.banner}`}>
              {lead.status}
            </span>
            <span className="text-xs font-semibold text-slate-700">{statusProgress.txt}</span>
          </div>
          <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded">
            Stage Integrity {statusProgress.percent}%
          </span>
        </div>
        <div className="p-4 bg-white">
          <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${statusProgress.color} transition-all duration-300 ease-out`}
              style={{ width: `${statusProgress.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>INIT (15%)</span>
            <span>ENGAGED (40%)</span>
            <span>ACTIVE OPS (60%)</span>
            <span>NURTURE (70%)</span>
            <span>QUALIFIED (85%)</span>
            <span>CLOSED (100%)</span>
          </div>
        </div>
      </Card>

      {/* 3. Core Split Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Lead Profile & Details Info Cards (1/3) */}
        <div className="space-y-6">
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-xs">
            <CardHeader className="py-4 border-b border-[#F5F6F8]">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500">
                Account Demographics
              </CardTitle>
              <CardDescription className="text-[11px]">Primary operational touchpoints in CRM filesystem</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              
              {/* Contact Information Elements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </span>
                  <a href={`mailto:${lead.email}`} className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px]">
                    {lead.email}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </span>
                  <span className="font-semibold text-slate-800">{lead.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Lead Sourcing
                  </span>
                  <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {lead.source}
                  </span>
                </div>

                {/* Company Website */}
                {lead.companyWebsite && (
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      Website
                    </span>
                    <a 
                      href={lead.companyWebsite.startsWith('http') ? lead.companyWebsite : `https://${lead.companyWebsite}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px]"
                    >
                      {lead.companyWebsite.replace(/https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Facebook profile */}
                {lead.facebook && (
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      Facebook
                    </span>
                    <a 
                      href={lead.facebook.startsWith('http') ? lead.facebook : `https://${lead.facebook}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px]"
                    >
                      View Profile
                    </a>
                  </div>
                )}

                {/* Email Opt Out */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Marketing Mail
                  </span>
                  {lead.emailOptOut ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      Opted Out
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Subscribed
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Assigned Owner
                  </span>
                  <FormSelect
                    value={lead.assignedTo}
                    onChange={(val) => onUpdateLead(lead.id, { assignedTo: val })}
                    options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
                    className="w-36 text-right font-semibold text-[#111827]"
                  />
                </div>
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
                    value={lead.dealValue}
                    onChange={(e) => onUpdateLead(lead.id, { dealValue: Number(e.target.value) || 0 })}
                    className="h-8 py-1 px-2 border border-[#E5E7EB] text-xs font-bold text-slate-800 bg-[#F9FAFB] rounded"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Adjust lead value estimate to sync forecasting models.</p>
              </div>

              <div className="h-[1px] bg-slate-100 my-2" />

              {/* Additional timestamps */}
              <div className="text-[11px] text-slate-500 space-y-1 block leading-relaxed bg-[#F8FAFC] p-2 rounded">
                <div>
                  <span className="font-semibold">Registered:</span> {new Date(lead.createdAt).toLocaleDateString()} ({formatRelativeTime(lead.createdAt)})
                </div>
                <div>
                  <span className="font-semibold">Last Audited:</span> {new Date(lead.lastActivity).toLocaleDateString()}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Address Information Card */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-xs">
            <CardHeader className="py-4 border-b border-[#F5F6F8]">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1.5 select-none">
                <MapPin className="h-4 w-4 text-slate-500" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              {lead.addressInfo?.street || lead.addressInfo?.city || lead.addressInfo?.state || lead.addressInfo?.postalCode || lead.addressInfo?.country ? (
                <div className="space-y-3">
                  {lead.addressInfo.street && (
                    <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-2">
                      <span className="text-slate-400">Street</span>
                      <span className="font-semibold text-right text-slate-800 break-words max-w-[160px]">
                        {lead.addressInfo.street}
                      </span>
                    </div>
                  )}
                  {lead.addressInfo.city && (
                    <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                      <span className="text-slate-400">City</span>
                      <span className="font-semibold text-right text-slate-800">
                        {lead.addressInfo.city}
                      </span>
                    </div>
                  )}
                  {lead.addressInfo.state && (
                    <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                      <span className="text-slate-400">State / Province</span>
                      <span className="font-semibold text-right text-slate-800">
                        {lead.addressInfo.state}
                      </span>
                    </div>
                  )}
                  {lead.addressInfo.postalCode && (
                    <div className="flex justify-between items-center gap-2 border-b border-[#E5E7EB] pb-2">
                      <span className="text-slate-400">Postal Code</span>
                      <span className="font-semibold text-right text-slate-800 font-mono">
                        {lead.addressInfo.postalCode}
                      </span>
                    </div>
                  )}
                  {lead.addressInfo.country && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Country</span>
                      <span className="font-semibold text-right text-[#111827]">
                        {lead.addressInfo.country}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-3 italic select-none">
                  No address information loaded for this lead file.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interaction Timeline Stream & Followups List (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* UBIQUITOUS TABS PANEL */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex border-b border-transparent -mb-[11px] space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 font-semibold text-xs tracking-wide transition-all border-b-2 -mb-[1px] select-none cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-[#2563EB] text-[#2563EB] bg-white rounded-t-md font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Notes & Internal Memos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 font-semibold text-xs tracking-wide transition-all border-b-2 -mb-[1px] select-none cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'border-[#2563EB] text-[#2563EB] bg-white rounded-t-md font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-855'
                  }`}
                >
                  Schedule Tasks, Follow-ups, and Meetings
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5 select-none text-xs">
              
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Note Submission Form */}
                  <form onSubmit={handleAddNoteSubmit} className="space-y-2 pb-2">
                    <Textarea
                      placeholder="Record call summary notes, business insights, pricing context..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full text-xs min-h-[75px] border-[#E5E7EB] focus:ring-1 focus:ring-blue-500 rounded p-2 outline-none bg-slate-50"
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!newNoteContent.trim()}
                        className="h-8.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Append Note
                      </Button>
                    </div>
                  </form>

                  <div className="h-[1px] bg-slate-100 my-2" />

                  {/* Note Timeline Output */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto crm-scrollbar pr-1">
                    {notesHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 italic">No timeline entries found. Start by lodging a note.</p>
                    ) : (
                      notesHistory.map((note) => (
                        <div 
                          key={note.id} 
                          className="border-l-2 border-[#2563EB] pl-3.5 py-1.5 space-y-1 hover:bg-slate-50/50 rounded-r-md transition-colors relative group"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-[#6B7280]">
                            <span className="font-semibold text-slate-700">{note.author}</span>
                            <span>{new Date(note.date).toLocaleString()}</span>
                          </div>

                          {editNotesId === note.id ? (
                            <div className="space-y-2 mt-1">
                              <Textarea
                                value={editNotesText}
                                onChange={(e) => setEditNotesText(e.target.value)}
                                className="w-full text-xs p-1.5 border border-[#2563EB]"
                              />
                              <div className="flex justify-end space-x-1.5">
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditNotesId(null)}
                                  className="h-7 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px]"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEditNote(note.id)}
                                  className="h-7 px-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px]"
                                >
                                  Save Checkpoint
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-800 font-normal leading-relaxed">{note.content}</p>
                          )}

                          {/* CRUD controls for Notes */}
                          {editNotesId !== note.id && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-2 flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setEditNotesId(note.id);
                                  setEditNotesText(note.content);
                                }}
                                className="p-1 hover:bg-slate-100 text-blue-600 rounded text-[10px] cursor-pointer"
                                title="Edit strategic note entry"
                              >
                                Edit
                              </button>
                              {note.id !== 'INIT-NOTE' && (
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 hover:bg-slate-100 text-red-500 rounded cursor-pointer"
                                  title="Delete note permanently"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-5">
                  {/* Add Followup scheduling component */}
                  <form onSubmit={handleAddFollowupSubmit} className="space-y-4 bg-slate-50 p-4 border border-[#E5E7EB] rounded-lg">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Schedule New Routine Task or Meeting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-500 uppercase">Task Title / Agenda</label>
                        <Input
                          type="text"
                          placeholder="e.g. Present RFP feedback"
                          value={newFollowupTitle}
                          onChange={(e) => setNewFollowupTitle(e.target.value)}
                          className="h-9 text-xs bg-white border border-[#E5E7EB] pb-1.5 pt-1.5"
                        />
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-500 uppercase select-none">Booking Priority</label>
                        <FormSelect
                          value={newFollowupPriority}
                          onChange={(val) => setNewFollowupPriority(val as any)}
                          options={[
                            { value: 'Low', label: 'Low Priority' },
                            { value: 'Medium', label: 'Medium Priority' },
                            { value: 'High', label: 'High Priority' }
                          ]}
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-500 uppercase select-none font-semibold">Operational Category</label>
                        <FormSelect
                          value={newFollowupCategory}
                          onChange={(val) => setNewFollowupCategory(val as any)}
                          options={[
                            { value: 'Follow-up', label: 'Follow-up Dialogue' },
                            { value: 'Meeting', label: 'Sync Meeting' },
                            { value: 'Call', label: 'Direct Outbound Call' },
                            { value: 'Email', label: 'Email Communication' },
                            { value: 'Proposal', label: 'Contract Draft Delivery' }
                          ]}
                        />
                      </div>

                      {/* Date - Calendar Picker Inside Popover */}
                      <div className="space-y-1 flex flex-col">
                        <label className="text-[10px] font-medium text-slate-500 uppercase">Due Date Selector</label>
                        <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                          <PopoverTrigger asChild>
                            <Button
                              id="lead-date-picker-trigger"
                              variant="outline"
                              type="button"
                              className="h-9 px-3 bg-white border border-[#E5E7EB] text-xs hover:bg-[#F3F4F6] text-slate-700 flex justify-between items-center text-left w-full rounded"
                            >
                              <span className="truncate">
                                {selectedDate ? selectedDate.toLocaleDateString() : 'Choose Deadline'}
                              </span>
                              <CalendarIcon className="h-4 w-4 ml-1 text-[#6B7280]" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-[#E5E7EB] z-50">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                setOpenDatePicker(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={!newFollowupTitle.trim()}
                        className="h-8.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
                      >
                        Schedule Action Item
                      </Button>
                    </div>
                  </form>

                  {/* Scheduled Agenda Items Checklist */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Active Scheduled Agenda</h3>
                    {relatedTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded text-center italic">No pending follow-ups scheduled for this executive profile.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-[#E5E7EB] rounded bg-white overflow-hidden text-xs">
                        {relatedTasks.map((t) => (
                          <div 
                            key={t.id} 
                            className={`flex justify-between items-center p-3 transition-colors ${
                              t.status === 'Completed' ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              {/* Checked Checkbox vs Unchecked */}
                              <button
                                type="button"
                                onClick={() => onToggleTask(t.id)}
                                className="text-slate-500 hover:text-[#2563EB] transition-colors cursor-pointer"
                                title={t.status === 'Completed' ? 'Mark Task Pending' : 'Mark Task Completed'}
                              >
                                {t.status === 'Completed' ? (
                                  <CheckSquare className="h-4.5 w-4.5 text-emerald-600 font-bold" />
                                ) : (
                                  <Square className="h-4.5 w-4.5 text-slate-400" />
                                )}
                              </button>
                              
                              <div>
                                <span className={`font-semibold text-slate-800 ${t.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                                  {t.title}
                                </span>
                                <div className="flex items-center space-x-2.5 text-[10px] text-slate-400 mt-1 font-mono">
                                  <span className="bg-slate-100 text-slate-600 px-1 rounded uppercase tracking-wider">{t.category}</span>
                                  <span className="flex items-center gap-0.5">
                                    <CalendarIcon className="h-3 w-3" />
                                    {t.dueDate}
                                  </span>
                                  <span>•</span>
                                  <span className={`font-semibold ${
                                    t.priority === 'High' ? 'text-red-500' : t.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                  }`}>
                                    {t.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* PURGE BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Do you wish to delete task: "${t.title}"?`)) {
                                  onDeleteTask(t.id);
                                }
                              }}
                              className="p-1 hover:bg-slate-100 text-stone-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>

      {/* 4. SHEET OVERLAYS FOR LEAD OPERATIONS */}

      {/* SIDE PANEL: EDIT CUSTOMER PROFILE */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Edit Customer Profile
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Ref: {lead.id}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  First Name
                </label>
                <Input 
                  type="text" 
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)} 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Last Name
                </label>
                <Input 
                  type="text" 
                  value={editLastName} 
                  onChange={(e) => setEditLastName(e.target.value)} 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                Company Name
              </label>
              <Input 
                type="text" 
                value={editCompany} 
                onChange={(e) => setEditCompany(e.target.value)} 
                className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Company Website
                </label>
                <Input 
                  type="text" 
                  value={editWebsite} 
                  onChange={(e) => setEditWebsite(e.target.value)} 
                  placeholder="https://example.com" 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Facebook Link
                </label>
                <Input 
                  type="text" 
                  value={editFacebook} 
                  onChange={(e) => setEditFacebook(e.target.value)} 
                  placeholder="https://facebook.com/handle" 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Email Address
                </label>
                <Input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Phone Number
                </label>
                <Input 
                  type="text" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 p-2.5 border border-slate-200 rounded-[6px]">
              <input 
                type="checkbox" 
                id="edit-email-opt-out-checkbox-de"
                checked={editEmailOptOut} 
                onChange={(e) => setEditEmailOptOut(e.target.checked)} 
                className="rounded border-[#E5E7EB] text-[#2563EB] focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="edit-email-opt-out-checkbox-de" className="text-[11px] font-medium text-slate-700 select-none cursor-pointer">
                Opt-out from marketing emails
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Lead Status
                </label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value as any)} 
                  className="w-full h-8.5 px-2 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Working">Working</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Nurturing">Nurturing</option>
                  <option value="Unqualified">Unqualified</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Source
                </label>
                <select 
                  value={editSource} 
                  onChange={(e) => setEditSource(e.target.value as any)} 
                  className="w-full h-8.5 px-2 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Inbound">Inbound</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Ad Campaign">Ad Campaign</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Priority
                </label>
                <select 
                  value={editPriority} 
                  onChange={(e) => setEditPriority(e.target.value as any)} 
                  className="w-full h-8.5 px-2 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-3.5 space-y-3">
              <h3 className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider">Address Information</h3>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                  Street
                </label>
                <Input 
                  type="text" 
                  value={editStreet} 
                  onChange={(e) => setEditStreet(e.target.value)} 
                  className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                    City
                  </label>
                  <Input 
                    type="text" 
                    value={editCity} 
                    onChange={(e) => setEditCity(e.target.value)} 
                    className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                    State / Province
                  </label>
                  <Input 
                    type="text" 
                    value={editState} 
                    onChange={(e) => setEditState(e.target.value)} 
                    className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                    Postal Code
                  </label>
                  <Input 
                    type="text" 
                    value={editPostalCode} 
                    onChange={(e) => setEditPostalCode(e.target.value)} 
                    className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1 select-none">
                    Country
                  </label>
                  <Input 
                    type="text" 
                    value={editCountry} 
                    onChange={(e) => setEditCountry(e.target.value)} 
                    className="h-8.5 text-xs bg-[#F5F6F8] pb-1 pt-1" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-end gap-3 font-semibold">
            <Button
              type="button"
              onClick={() => setShowEditSheet(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editFirstName || !editLastName || !editCompany) {
                  alert('First Name, Last Name and Company are required.');
                  return;
                }
                onUpdateLead(lead.id, {
                  firstName: editFirstName,
                  lastName: editLastName,
                  name: `${editFirstName} ${editLastName}`,
                  company: editCompany,
                  email: editEmail,
                  phone: editPhone,
                  status: editStatus,
                  source: editSource,
                  priority: editPriority,
                  companyWebsite: editWebsite,
                  facebook: editFacebook,
                  emailOptOut: editEmailOptOut,
                  addressInfo: {
                    street: editStreet,
                    city: editCity,
                    state: editState,
                    postalCode: editPostalCode,
                    country: editCountry
                  }
                });
                alert('Customer profile settings saved.');
                setShowEditSheet(false);
              }}
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Save Profile Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: CONVERT LEAD TO OPPORTUNITY */}
      <Sheet open={showConvertSheet} onOpenChange={setShowConvertSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Convert Lead Opportunity
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Protocol: Lead Conversion
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-4 rounded-[6px] space-y-2">
              <h4 className="font-semibold text-[#1E40AF] text-[13px]">Lead Profile Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-sans mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Contact Name</span>
                  <span className="font-bold text-[12px]">{lead.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Company Name</span>
                  <span className="font-bold text-[12px]">{lead.company}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[#4B5563] leading-relaxed">
                Converting this lead will automatically qualify the account profile and generate an active CRM business transaction **Deal Opportunity**.
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-[6px] text-[11px] text-amber-800 space-y-1">
                <span className="font-bold">✨ Transition Actions Executed:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Pipeline status changes to **Qualified**</li>
                  <li>A Deal Opportunity valued at $25,000 is opened</li>
                  <li>Internal history log is fully retained</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-end gap-3 font-semibold">
            <Button
              type="button"
              onClick={() => setShowConvertSheet(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onUpdateLead(lead.id, { status: 'Qualified' as LeadStatus });
                
                onAddDeal({
                  title: `${lead.company} Deal Proposal`,
                  company: lead.company,
                  contactPerson: lead.name,
                  email: lead.email,
                  phone: lead.phone,
                  value: 25000,
                  stage: 'Lead In',
                  status: 'Open',
                  expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  assignedTo: lead.assignedTo || 'Sarah Jenkins'
                });

                alert(`Lead profile successfully converted! Check your active CRM Deals directory.`);
                setShowConvertSheet(false);
              }}
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Convert
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: SEND OUTBOUND EMAIL */}
      <Sheet open={showEmailSheet} onOpenChange={setShowEmailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              Dispatch Corporate Email Message
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Recipient: {lead.email}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                Recipient
              </label>
              <Input 
                type="text" 
                disabled 
                value={lead.email} 
                className="h-9 text-xs bg-slate-100 text-slate-500 cursor-not-allowed pb-1.5 pt-1.5" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none font-semibold">
                Email Subject
              </label>
              <Input 
                type="text" 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)} 
                className="h-9 text-xs bg-[#F5F6F8] pb-1.5 pt-1.5" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                Email Message Body
              </label>
              <Textarea 
                rows={10} 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)} 
                className="w-full font-sans text-xs border border-[#E5E7EB] rounded-[6px] outline-none bg-[#F5F6F8] p-3 crm-scrollbar" 
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-end gap-3 font-semibold">
            <Button
              type="button"
              onClick={() => setShowEmailSheet(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#374151] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!emailSubject || !emailBody) {
                  alert("Subject and Body are required.");
                  return;
                }
                const currentHistory = notesHistory || [];
                const emailNote = {
                  id: `EMAIL-NOTE-${Date.now()}`,
                  content: `[Outbound Email] Subject: "${emailSubject}"\n\n${emailBody}`,
                  date: new Date().toISOString(),
                  author: 'Sarah Jenkins'
                };
                const updatedHistory = [emailNote, ...currentHistory];
                onUpdateLead(lead.id, {
                  notes: `Outbound email: "${emailSubject}"`,
                  notes_history: updatedHistory as any,
                  lastActivity: `Sent corporate email regarding "${emailSubject}"`
                });
                alert(`Corporate email message sent successfully to ${lead.email}.`);
                setShowEmailSheet(false);
              }}
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Send Message
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
