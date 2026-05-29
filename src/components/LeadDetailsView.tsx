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
  Briefcase
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, CRMTask, Activity } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LeadDetailsViewProps {
  leadId: string;
  leads: Lead[];
  tasks: CRMTask[];
  onUpdateLead: (id: string, updated: Partial<Lead>) => void;
  onAddTask: (taskInput: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
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

        {/* Dynamic Action Controls for CRM Lead Status */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Pipeline Status:</span>
          <select
            id="lead-detail-status-direct"
            value={lead.status}
            onChange={(e) => {
              onUpdateLead(lead.id, { status: e.target.value as LeadStatus });
            }}
            className="h-9 px-2.5 bg-white border border-[#E5E7EB] text-xs text-[#111827] font-semibold rounded-[6px] outline-none cursor-pointer focus:border-[#2563EB] shadow-xs"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Working">Working</option>
            <option value="Qualified">Qualified</option>
            <option value="Nurturing">Nurturing</option>
            <option value="Unqualified">Unqualified</option>
          </select>
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

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Assigned Owner
                  </span>
                  <select
                    value={lead.assignedTo}
                    onChange={(e) => onUpdateLead(lead.id, { assignedTo: e.target.value })}
                    className="bg-transparent text-right font-semibold text-[#111827] outline-none border-b border-transparent hover:border-slate-300 focus:border-[#2563EB]"
                  >
                    {CRM_USERS.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
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
        </div>

        {/* RIGHT COLUMN: Interaction Timeline Stream & Followups List (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB PANEL PART 1: STRATEGIC MEMOS & FEED TIMELINE */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px]">
            <CardHeader className="py-4 border-b border-[#F5F6F8] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-[#2563EB]" />
                  Internal Memos & Historical Scriptorium
                </CardTitle>
                <CardDescription className="text-xs">Log chronological updates, operational comments, and notes</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Note Submission Form */}
              <form onSubmit={handleAddNoteSubmit} className="space-y-2 pb-2">
                <Textarea
                  placeholder="Record call summary notes, business insights, pricing context..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full text-xs min-h-[75px] border-[#E5E7EB] focus:ring-1 focus:ring-blue-500 rounded p-2outline-none"
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

                      {/* CRUD controls for Notes (Delete & Edit) */}
                      {editNotesId !== note.id && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-2 flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditNotesId(note.id);
                              setEditNotesText(note.content);
                            }}
                            className="p-1 hover:bg-slate-100 text-blue-600 rounded text-[10px]"
                            title="Edit strategic note entry"
                          >
                            Edit
                          </button>
                          {note.id !== 'INIT-NOTE' && (
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 hover:bg-slate-100 text-red-500 rounded"
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

            </CardContent>
          </Card>

          {/* TAB PANEL PART 2: FOLLOWUP ACTIONS & SHADCN CALENDAR */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px]">
            <CardHeader className="py-4 border-b border-[#F5F6F8]">
              <CardTitle className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                <CalendarIcon className="h-4.5 w-4.5 text-indigo-600" />
                Scheduled Followups & Interactive Calendar Checklist
              </CardTitle>
              <CardDescription className="text-xs">Schedule operations such as demos, outreach, and close activities.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Add Followup scheduling component */}
              <form onSubmit={handleAddFollowupSubmit} className="space-y-4 bg-slate-50 p-4 border border-[#E5E7EB] rounded-lg">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Schedule New Routine Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">Follow-up Title</label>
                    <Input
                      type="text"
                      placeholder="e.g. Present RFP feedback"
                      value={newFollowupTitle}
                      onChange={(e) => setNewFollowupTitle(e.target.value)}
                      className="h-9 text-xs bg-white border border-[#E5E7EB]"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">Booking Priority</label>
                    <select
                      value={newFollowupPriority}
                      onChange={(e) => setNewFollowupPriority(e.target.value as any)}
                      className="w-full h-9 px-2 bg-white border border-[#E5E7EB] text-xs rounded outline-none"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">Operational Category</label>
                    <select
                      value={newFollowupCategory}
                      onChange={(e) => setNewFollowupCategory(e.target.value as any)}
                      className="w-full h-9 px-2 bg-white border border-[#E5E7EB] text-xs rounded outline-none"
                    >
                      <option value="Follow-up">Follow-up Dialogue</option>
                      <option value="Meeting">Sync Meeting</option>
                      <option value="Call">Direct Outbound Call</option>
                      <option value="Email">Email Communication</option>
                      <option value="Proposal">Contract Draft Delivery</option>
                    </select>
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
                            className="text-slate-500 hover:text-[#2563EB] transition-colors"
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

                        {/* PURGE BUTTON (CRUD) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Do you wish to delete task: "${t.title}"?`)) {
                              onDeleteTask(t.id);
                            }
                          }}
                          className="p-1 hover:bg-slate-100 text-stone-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
