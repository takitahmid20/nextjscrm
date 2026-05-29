"use client";

import React, { useState } from 'react';
import { History, PhoneCall, Calendar as CalendarIcon, Plus, Trash2, CheckCircle, Square, CheckSquare, Users, Briefcase, Mail } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '../forms/FormControls';
import { formatRelativeTime } from '../../utils';
import { CRMTask } from '../../types';

interface CRMInteractionTabsProps {
  relatedName: string;
  assignedTo: string;
  notesHistory: Array<{ id: string; content: string; date: string; author: string }>;
  relatedTasks: CRMTask[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
  onSaveEditedNote: (id: string, content: string) => void;
  onAddTask: (task: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function CRMInteractionTabs({
  relatedName,
  assignedTo,
  notesHistory,
  relatedTasks,
  onAddNote,
  onDeleteNote,
  onSaveEditedNote,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: CRMInteractionTabsProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'followup' | 'meeting'>('notes');

  // Notes state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // Follow-up form states
  const [newFollowupTitle, setNewFollowupTitle] = useState('');
  const [newFollowupPriority, setNewFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newFollowupCategory, setNewFollowupCategory] = useState<'Call' | 'Email' | 'Meeting' | 'Proposal' | 'Follow-up'>('Follow-up');
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-01');

  // Filter tasks based on category
  const checklistTasks = relatedTasks.filter(t => t.category !== 'Meeting');
  const meetingTasks = relatedTasks.filter(t => t.category === 'Meeting');

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent);
    setNewNoteContent('');
  };

  const handleSaveNote = (id: string) => {
    if (!editNoteText.trim()) return;
    onSaveEditedNote(id, editNoteText);
    setEditNoteId(null);
    setEditNoteText('');
  };

  const handleAddFollowupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowupTitle.trim()) {
      alert('Please state action title checklist brief.');
      return;
    }
    onAddTask({
      title: newFollowupTitle,
      dueDate: selectedDate,
      priority: newFollowupPriority,
      status: 'Pending',
      assignedTo: assignedTo || 'Sarah Jenkins',
      category: newFollowupCategory,
      relatedToType: 'Lead',
      relatedToName: relatedName,
    });
    setNewFollowupTitle('');
  };

  return (
    <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden shadow-xs">
      
      {/* Elegant tabs with matching royal blue selection line */}
      <div className="border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-1 px-4 select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
          className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'followup' 
              ? 'border-[#2563EB] text-[#2563EB]' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Action Task Checklist ({checklistTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('meeting')}
          className={`py-3 px-3.5 text-[12px] font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'meeting' 
              ? 'border-[#2563EB] text-[#2563EB]' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Booked Sync Meetings ({meetingTasks.length})
        </button>
      </div>

      <CardContent className="p-4 sm:p-6 text-xs text-[#111827]">
        
        {/* TAB 1: NOTES TIMELINE FEED */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <form onSubmit={handleAddNoteSubmit} className="space-y-3">
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Insert notes of interactions, call updates, meeting brief details..."
                className="min-h-[92px] text-xs bg-slate-50 border-[#CBD5E1] rounded-[6px] outline-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newNoteContent.trim()}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 h-8 text-xs font-semibold rounded-[6px] cursor-pointer"
                >
                  Add Timeline Note
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5 select-none">
                Historical Narrative Notes
              </span>

              {notesHistory.length === 0 ? (
                <span className="text-slate-400 italic block text-xs">No recorded logs registered.</span>
              ) : (
                <div className="space-y-4">
                  {notesHistory.map((note) => (
                    <div key={note.id} className="p-4 border border-[#E5E7EB] bg-[#F9FAFB]/50 rounded-[6px] text-xs space-y-2 relative group">
                      
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{note.author}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                          <span className="text-[11px] text-slate-400 font-mono font-medium">{formatRelativeTime(note.date)}</span>
                        </div>

                        {editNoteId !== note.id && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditNoteId(note.id);
                                setEditNoteText(note.content);
                              }}
                              className="h-7 px-2 border-0 text-blue-500 hover:text-blue-600 hover:bg-slate-100 font-semibold cursor-pointer"
                            >
                              Edit
                            </Button>
                            {note.id !== 'INIT-NOTE' && note.id !== 'INIT-CONTACT-NOTE' && (
                              <Button
                                variant="ghost"
                                onClick={() => onDeleteNote(note.id)}
                                className="h-7 px-2 border-0 text-rose-500 hover:text-rose-600 hover:bg-slate-100 font-semibold cursor-pointer"
                              >
                                Wipe
                              </Button>
                            )}
                          </div>
                        )}
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
                              className="h-8 px-2.5 text-xs text-slate-700 cursor-pointer"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSaveNote(note.id)} 
                              className="h-8 px-2.5 bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                            >
                              Commit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-650 leading-relaxed text-[12px] whitespace-pre-wrap font-sans">{note.content}</p>
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
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block select-none">
                Schedule profile task followup
              </span>
              
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
                      { value: 'High', label: 'High enterprise priority' }
                    ]}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleAddFollowupSubmit}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 h-9 text-xs font-semibold rounded-[6px] cursor-pointer"
                >
                  Allocate Follow-up Task
                </Button>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5 select-none">
                Assigned checklists and follow-ups
              </span>
              
              {checklistTasks.length === 0 ? (
                <span className="text-slate-400 italic block text-xs py-2">No pending task checklists listed.</span>
              ) : (
                <div className="space-y-3">
                  {checklistTasks.map((task) => {
                    const isDone = task.status === 'Completed';
                    let priorityClass = 'bg-gray-100 text-gray-800 border-gray-200';
                    if (task.priority === 'High') priorityClass = 'bg-red-50 text-red-800 border-red-150';
                    else if (task.priority === 'Medium') priorityClass = 'bg-amber-50 text-amber-850 border-amber-150';

                    let catIcon = <CheckSquare className="h-3.5 w-3.5 text-slate-500" />;
                    if (task.category === 'Call') catIcon = <PhoneCall className="h-3.5 w-3.5 text-blue-500" />;
                    else if (task.category === 'Email') catIcon = <Mail className="h-3.5 w-3.5 text-blue-500" />;
                    else if (task.category === 'Meeting') catIcon = <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />;

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
                            className="text-slate-400 hover:text-[#2563EB] transition cursor-pointer bg-transparent border-0 p-0"
                          >
                            {isDone ? (
                              <CheckSquare className="h-4.5 w-4.5 text-[#2563EB]" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-[#E5E7EB]" />
                            )}
                          </button>

                          <div className="flex items-center gap-2 select-all">
                            <span className="p-1 bg-[#EFF6FF] rounded">{catIcon}</span>
                            <span className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.title}
                            </span>
                            {task.relatedToType !== 'None' && (
                              <span className="text-[9px] uppercase font-mono bg-slate-100 text-slate-500 px-1 rounded">
                                {task.relatedToName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 select-none">
                          <span className="font-mono text-slate-400">{task.dueDate}</span>
                          <span className={`px-2 py-0.5 border text-[10px] rounded-[4px] font-bold ${priorityClass}`}>
                            {task.priority}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEETINGS */}
        {activeTab === 'meeting' && (
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF] block border-b border-slate-100 pb-1.5 select-none">
              Booked Sync Meetings List
            </span>

            {meetingTasks.length === 0 ? (
              <span className="text-slate-400 italic block text-xs py-2">No booked meetings listed.</span>
            ) : (
              <div className="space-y-3">
                {meetingTasks.map((task) => {
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
                          className="text-slate-400 hover:text-[#2563EB] transition cursor-pointer bg-transparent border-0 p-0"
                        >
                          {isDone ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#2563EB]" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-[#E5E7EB]" />
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-[#EFF6FF] rounded">
                            <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
                          </span>
                          <span className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400">{task.dueDate}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] rounded-[4px] font-bold">
                          HIGH
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
