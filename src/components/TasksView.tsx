/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  Square, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Activity, 
  PhoneCall, 
  Mail, 
  Users, 
  Briefcase,
  X,
  Play
} from 'lucide-react';
import { CRMTask, TaskPriority, TaskStatus } from '../types';
import { CRM_USERS } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskFormValues } from '../validation';
import { FormInput, FormSelect } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface TasksViewProps {
  tasks: CRMTask[];
  onAddTask: (task: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TasksView({ 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask 
}: TasksViewProps) {
  // Navigation & Page filters
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Create Task dialog controls
  const [showAddModal, setShowAddModal] = useState(false);

  // Hook Form for enterprise deals creation validation
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: '',
      dueDate: '2026-05-30',
      priority: 'Medium',
      assignedTo: 'Sarah Jenkins',
      category: 'Call',
      relatedToType: 'None',
      relatedToName: '',
    },
  });

  const relatedToType = useWatch({
    control,
    name: 'relatedToType',
    defaultValue: 'None',
  });

  // Unique categories list
  const categoriesList = ['Call', 'Email', 'Meeting', 'Proposal', 'Follow-up', 'Task'];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchCategory = categoryFilter === 'All' || task.category === categoryFilter;
      return matchPriority && matchStatus && matchCategory;
    });
  }, [tasks, priorityFilter, statusFilter, categoryFilter]);

  // Submit task constructor via React Hook Form schema validation
  const handleTaskSubmit = (values: TaskFormValues) => {
    onAddTask({
      title: values.title,
      dueDate: values.dueDate,
      priority: values.priority,
      status: 'Pending',
      assignedTo: values.assignedTo,
      category: values.category,
      relatedToType: values.relatedToType,
      relatedToName: values.relatedToName || undefined
    });

    // Reset Form
    reset();
    setShowAddModal(false);
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-[#111827] tracking-tight">CRM Task & Activity Schedules</h1>
          <p className="text-sm text-[#6B7280]">
            Review salesperson follow-up schedules, schedule introduction calls, and record client responses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Quick Tasks Summary counter */}
          <div className="bg-white border border-[#E5E7EB] px-3.5 py-1.5 rounded-[6px] text-xs flex items-center space-x-3 text-[#6B7280] font-sans">
            <span>
              Pending: <strong className="text-amber-600">{pendingCount}</strong>
            </span>
            <span className="h-3 w-[1px] bg-[#E5E7EB]" />
            <span>
              Completed: <strong className="text-emerald-600">{completedCount}</strong>
            </span>
          </div>

          <Button
            id="btn-add-task-modal"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-none"
          >
            <Plus className="h-4.5 w-4.5" />
            Schedule Follow-up
          </Button>
        </div>
      </div>

      {/* Grid: Main Tasks Table & Compact Calendars */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Tasks spreadsheets with filters - Span 3 */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tasks filters toolbar box */}
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-wrap items-center gap-3.5 text-xs">
            
            {/* Status switcher pills */}
            <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-[6px] p-0.5 flex space-x-0.5">
              <Button
                id="btn-tasks-pending-filter"
                onClick={() => setStatusFilter('Pending')}
                size="sm"
                variant={statusFilter === 'Pending' ? 'default' : 'ghost'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'Pending' 
                    ? 'bg-[#2563EB] text-white font-medium' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Pending Focus
              </Button>
              <Button
                id="btn-tasks-completed-filter"
                onClick={() => setStatusFilter('Completed')}
                size="sm"
                variant={statusFilter === 'Completed' ? 'default' : 'ghost'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'Completed' 
                    ? 'bg-[#2563EB] text-white font-medium' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Archive logs
              </Button>
              <Button
                id="btn-tasks-all-filter"
                onClick={() => setStatusFilter('All')}
                size="sm"
                variant={statusFilter === 'All' ? 'default' : 'ghost'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'All' 
                    ? 'bg-[#2563EB] text-white font-medium' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                All Workpacks
              </Button>
            </div>

            {/* Separator */}
            <span className="h-4 w-[1px] bg-[#E5E7EB] mx-1 md:block hidden" />

            {/* Priority Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[#6B7280] font-sans text-[11px] font-semibold uppercase tracking-wider select-none">Priority:</span>
              <FormSelect
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={[
                  { value: 'All', label: 'All Levels' },
                  { value: 'High', label: '🔴 High Priority' },
                  { value: 'Medium', label: '🟡 Medium Priority' },
                  { value: 'Low', label: '⚪ Low Priority' }
                ]}
                placeholder="All Levels"
                className="w-32"
              />
            </div>

            {/* Activity Category Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[#6B7280] font-sans text-[11px] font-semibold uppercase tracking-wider select-none">Category:</span>
              <FormSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { value: 'All', label: 'All Category Actions' },
                  ...categoriesList.map(cat => ({ value: cat, label: cat }))
                ]}
                placeholder="All Category Actions"
                className="w-44"
              />
            </div>
            
            <span className="ml-auto text-xs text-[#6B7280] font-medium hidden sm:inline">
              Showing <strong>{filteredTasks.length}</strong> schedules
            </span>
          </Card>

          {/* Tasks Directory Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
            <div className="overflow-x-auto crm-scrollbar">
              <Table id="tasks-schedules-table" className="w-full text-left text-xs border-collapse min-w-[750px]">
                <TableHeader className="bg-[#F5F6F8] text-[#6B7280] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E5E7EB]">
                  <TableRow className="h-11">
                    <TableHead className="py-2 px-4 w-12 text-center text-xs text-[#6B7280]">Status</TableHead>
                    <TableHead className="py-2.5 px-4 text-xs text-[#6B7280]">Action Title</TableHead>
                    <TableHead className="py-2.5 px-4 text-xs text-[#6B7280]">Workspace Context</TableHead>
                    <TableHead className="py-2.5 px-4 text-xs text-[#6B7280]">Schedules Due</TableHead>
                    <TableHead className="py-2.5 px-4 text-xs text-[#6B7280]">Follow-up Level</TableHead>
                    <TableHead className="py-2.5 px-4 text-xs text-[#6B7280]">Assigned Specialist</TableHead>
                    <TableHead className="py-2.5 px-4 text-center text-xs text-[#6B7280]">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#E5E7EB] text-[#111827]">
                  {filteredTasks.length === 0 ? (
                    <tr className="h-24">
                      <td colSpan={7} className="text-center text-[#6B7280]">
                        No task schedules match filter constraints.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isCompleted = task.status === 'Completed';

                      // Fine-grain priority indicator style
                      let priorityClass = 'bg-gray-100 text-gray-800 border-gray-200';
                      if (task.priority === 'High') priorityClass = 'bg-red-50 text-red-800 border-red-150';
                      else if (task.priority === 'Medium') priorityClass = 'bg-amber-50 text-amber-850 border-amber-150';

                      // Category rendering symbols
                      let catIcon = <CheckSquare className="h-3.5 w-3.5" />;
                      if (task.category === 'Call') catIcon = <PhoneCall className="h-3.5 w-3.5 text-[#2563EB]" />;
                      else if (task.category === 'Email') catIcon = <Mail className="h-3.5 w-3.5 text-[#2563EB]" />;
                      else if (task.category === 'Meeting') catIcon = <Calendar className="h-3.5 w-3.5 text-indigo-600" />;

                      return (
                        <tr 
                          key={task.id} 
                          className={`h-12 hover:bg-[#F5F6F8]/60 transition-colors ${
                            isCompleted ? 'bg-slate-50/70 text-[#6B7280]' : ''
                          }`}
                        >
                          {/* Toggle Task Complete checkbox */}
                          <td className="py-2 px-4 text-center">
                            <button
                              id={`btn-toggle-task-${task.id}`}
                              onClick={() => {
                                onToggleTask(task.id);
                              }}
                              className="text-[#6B7280] hover:text-[#2563EB] transition-colors p-1"
                              title={isCompleted ? "Mark as pending" : "Mark as completed"}
                            >
                              {isCompleted ? (
                                <CheckSquare className="h-4.5 w-4.5 text-[#2563EB]" />
                              ) : (
                                <Square className="h-4.5 w-4.5 text-[#E5E7EB]" />
                              )}
                            </button>
                          </td>

                          {/* Title */}
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-2.5 select-all">
                              <span className="p-1 bg-[#EFF6FF] rounded">{catIcon}</span>
                              <span className={`font-semibold text-xs text-[#111827] ${isCompleted ? 'line-through text-[#6B7280]' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                          </td>

                          {/* Related CRM entity */}
                          <td className="py-2 px-4">
                            {task.relatedToType !== 'None' ? (
                              <div className="flex items-center space-x-1 font-semibold text-[11px] text-[#6B7280]">
                                {task.relatedToType === 'Lead' ? <Users className="h-3 w-3 text-blue-500" /> : <Briefcase className="h-3 w-3 text-indigo-500" />}
                                <span className="hover:text-blue-600 transition-colors uppercase">{task.relatedToName}</span>
                              </div>
                            ) : (
                              <span className="text-[#6B7280] italic">General schedule</span>
                            )}
                          </td>

                          {/* Due Date */}
                          <td className="py-2 px-4 font-mono font-medium text-[#6B7280]">
                            {task.dueDate}
                          </td>

                          {/* Priority badge */}
                          <td className="py-2 px-4">
                            <span className={`px-2 py-0.5 border text-[10px] rounded-[4px] font-bold ${priorityClass}`}>
                              {task.priority}
                            </span>
                          </td>

                          {/* Assigned Agent */}
                          <td className="py-2 px-4 font-medium text-[#111827]">
                            {task.assignedTo}
                          </td>

                          {/* Row delete action */}
                          <td className="py-2 px-4 text-center">
                            <button
                              id={`btn-delete-task-${task.id}`}
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 hover:bg-red-50 text-[#6B7280] hover:text-red-700 rounded transition-colors cursor-pointer"
                              title="Delete task assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>

        {/* Right Column: Office Corporate Calendar & Meetings List - Span 1 */}
        <div className="space-y-4">
          
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 select-none">
            <div className="pb-3 border-b border-[#E5E7EB] mb-4 flex items-center justify-between text-[#111827]">
              <div className="flex items-center space-x-1.5 font-bold">
                <Calendar className="h-4.5 w-4.5 text-[#2563EB]" />
                <span className="text-xs uppercase tracking-wider">Corporate Agenda Sync</span>
              </div>
              <span className="text-[10px] font-mono bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-bold uppercase">QA Sync</span>
            </div>

            {/* Simple mini planner design */}
            <div className="space-y-3">
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs">
                <div className="flex justify-between items-center text-[#6B7280] font-mono text-[10px] mb-1 font-bold">
                  <span>TODAY • 14:00 UTC</span>
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                </div>
                <h5 className="font-bold text-[#111827]">Executive Demo: Apex CRM</h5>
                <p className="text-[11px] text-[#6B7280] mt-1 pr-1 leading-normal">Sarah Chen and team integration engineers to present API pipelines.</p>
              </div>

              <div className="p-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs">
                <div className="flex justify-between items-center text-[#6B7280] font-mono text-[10px] mb-1 font-bold">
                  <span>TOMORROW • 09:30 UTC</span>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                </div>
                <h5 className="font-bold text-[#111827]">Licensing Negotiation Call</h5>
                <p className="text-[11px] text-[#6B7280] mt-1 pr-1 leading-normal">Review bulk pricing brackets with VP of Global Retail Corp procurement.</p>
              </div>

              <div className="p-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs">
                <div className="flex justify-between items-center text-[#6B7280] font-mono text-[10px] mb-1 font-semibold">
                  <span>JUNE 04, 2026</span>
                </div>
                <h5 className="font-bold text-[#111827]">Acme Q2 Sales Audit</h5>
                <p className="text-[11px] text-[#6B7280] mt-1 pr-1 leading-normal">Quarterly operations report, CSV downloads audit, and pipeline cleanups.</p>
              </div>
            </div>

            <div className="h-[1px] bg-[#E5E7EB] my-4" />
            <button 
              onClick={() => alert("CRM Calendar system is verified. Sync with Microsoft Exchange/Google Workspace is operational in central workspace setting.")}
              className="w-full py-2 border border-[#E5E7EB] hover:bg-slate-50 text-center font-bold text-[#111827] rounded-[4px] text-[11px] cursor-pointer"
            >
              Export Global iCal
            </button>
          </div>

        </div>

      </div>

      {/* SIDE PANEL: CREATE NEW TASK SCHEDULES */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">Schedule Follow-up Action</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleTaskSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
            
            <FormInput
              label="Follow-up Action Title"
              register={register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g. Schedule onboarding demo followups"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Action Category"
                register={register('category')}
                error={errors.category?.message}
                options={categoriesList.map(cat => ({ value: cat, label: cat }))}
              />

              <FormInput
                label="Due date"
                register={register('dueDate')}
                error={errors.dueDate?.message}
                type="date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Task Urgency Priority"
                register={register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: 'Low', label: 'Low (Routine followups)' },
                  { value: 'Medium', label: 'Medium (Lead nurturing)' },
                  { value: 'High', label: 'High (Immediate close actions)' },
                ]}
              />

              <FormSelect
                label="Responsible Representative"
                register={register('assignedTo')}
                error={errors.assignedTo?.message}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Related Lead/Deal Context"
                register={register('relatedToType')}
                error={errors.relatedToType?.message}
                options={[
                  { value: 'None', label: 'No relationship links' },
                  { value: 'Lead', label: 'Lead directory file' },
                  { value: 'Deal', label: 'Acme Pipelines deal' },
                ]}
              />

              {relatedToType !== 'None' && (
                <FormInput
                  label="Customer / Deal Name"
                  register={register('relatedToName')}
                  error={errors.relatedToName?.message}
                  required
                  placeholder="e.g. Robert Chen"
                />
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
              >
                Close panel
              </Button>
              <Button
                id="btn-task-form-submit"
                type="submit"
                className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
              >
                Schedule task
              </Button>
            </div>

          </form>
        </SheetContent>
      </Sheet>

    </div>
  );
}
