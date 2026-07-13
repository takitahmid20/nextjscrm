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
  Play,
  Download,
  Upload,
  FolderSync,
} from 'lucide-react';
import { CRMTask, TaskPriority, TaskStatus } from '../types';
import { CRM_USERS, exportTasksToCSV, parseCSVToTasks } from '../utils';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskFormValues } from '../validation';
import { FormInput, FormSelect, FormDatePicker } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';

interface TaskImportResult {
  importedCount: number;
  errors: { row: number; message: string }[];
}

interface TasksViewProps {
  tasks: CRMTask[];
  onAddTask: (task: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onImportTasks: (rows: Record<string, unknown>[]) => Promise<TaskImportResult>;
}

export default function TasksView({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onImportTasks
}: TasksViewProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importRowErrors, setImportRowErrors] = useState<{ row: number; message: string }[]>([]);

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: '',
      dueDate: new Date().toISOString().slice(0, 10),
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

  // Upcoming pending schedules, soonest due date first — backs the sidebar
  // summary with real task data instead of fabricated calendar events.
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'Pending')
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

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
    showToast(`Task "${values.title}" scheduled.`, 'success');
  };

  const handleDeleteTask = async (task: CRMTask) => {
    const ok = await confirm({
      title: 'Delete this task?',
      description: `Do you want to permanently delete "${task.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    onDeleteTask(task.id);
    showToast('Task deleted.', 'success');
  };

  // Exports the currently visible tasks as a real, client-generated .ics
  // calendar file. There is no live sync with any external calendar provider —
  // this simply lets a user pull their CRM schedule into whatever calendar
  // app they already use.
  const handleExportICS = () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks in the current view to export.', 'info');
      return;
    }

    const toICSDate = (dueDate: string) => {
      const digitsOnly = dueDate.replace(/-/g, '');
      return /^\d{8}$/.test(digitsOnly) ? digitsOnly : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    };

    const escapeICS = (value: string) => value.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');

    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events = filteredTasks.map((task, idx) => [
      'BEGIN:VEVENT',
      `UID:${task.id}-${idx}@crm-tasks-export`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toICSDate(task.dueDate)}`,
      `SUMMARY:${escapeICS(task.title)}`,
      `DESCRIPTION:${escapeICS(`${task.category} • ${task.priority} priority • Assigned to ${task.assignedTo}`)}`,
      'END:VEVENT',
    ].join('\r\n'));

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CRM Task Schedules//Export//EN',
      'CALSCALE:GREGORIAN',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_tasks_export_${new Date().toISOString().slice(0, 10)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredTasks.length} task(s) to .ics.`, 'success');
  };

  const handleExportCSV = () => {
    const csvStr = exportTasksToCSV(tasks);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `centric_crm_tasks_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    if (!csvContent.trim()) {
      setCsvError('Please paste or load CSV text content.');
      setImportRowErrors([]);
      return;
    }
    try {
      const parsed = parseCSVToTasks(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid tasks parsed. Verify heading structure.');
        setImportRowErrors([]);
        return;
      }
      setCsvError('');
      const result = await onImportTasks(parsed);
      setImportRowErrors(result.errors);
      if (result.errors.length === 0) {
        setShowImportModal(false);
        setCsvContent('');
      } else {
        setCsvError(`${result.importedCount} row(s) imported, ${result.errors.length} row(s) failed:`);
      }
    } catch (e: any) {
      setCsvError('Failed parsing CSV lines. ' + (e?.message ?? ''));
      setImportRowErrors([]);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;

  const taskTableHeaders: UnifiedTableHeader[] = [
    { key: 'status', className: 'w-12 text-center', label: 'Status' },
    { key: 'title', label: 'Action Title' },
    { key: 'relatedTo', label: 'Workspace Context' },
    { key: 'dueDate', label: 'Schedules Due' },
    { key: 'priority', label: 'Follow-up Level' },
    { key: 'assignedTo', label: 'Assigned Specialist' },
    { key: 'delete', className: 'text-center', label: 'Delete' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-foreground tracking-tight">CRM Task & Activity Schedules</h1>
          <p className="text-sm text-muted-foreground">
            Review salesperson follow-up schedules, schedule introduction calls, and record client responses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Quick Tasks Summary counter */}
          <div className="bg-card border border-border px-3.5 py-1.5 rounded-[6px] text-xs flex items-center space-x-3 text-muted-foreground font-sans">
            <span>
              Pending: <strong className="text-amber-600 dark:text-amber-400">{pendingCount}</strong>
            </span>
            <span className="h-3 w-[1px] bg-border" />
            <span>
              Completed: <strong className="text-emerald-600 dark:text-emerald-400">{completedCount}</strong>
            </span>
          </div>

          <Button
            id="btn-import-tasks-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Import CSV
          </Button>

          <Button
            id="btn-export-tasks-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Export CSV
          </Button>

          <Button
            id="btn-add-task-modal"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-none"
          >
            <Plus className="h-4.5 w-4.5" />
            Schedule Follow-up
          </Button>
        </div>
      </div>

      {/* Grid: Main Tasks Table & Real Upcoming Schedule Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Column: Tasks spreadsheets with filters - Span 3 */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tasks filters toolbar box */}
          <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-row flex-wrap items-center gap-3.5 text-xs">

            {/* Status switcher pills */}
            <div className="bg-muted border border-border rounded-[6px] p-0.5 flex space-x-0.5">
              <Button
                id="btn-tasks-pending-filter"
                onClick={() => setStatusFilter('Pending')}
                size="sm"
                variant={statusFilter === 'Pending' ? 'default' : 'ghost'}
                aria-pressed={statusFilter === 'Pending'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'Pending'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending Focus
              </Button>
              <Button
                id="btn-tasks-completed-filter"
                onClick={() => setStatusFilter('Completed')}
                size="sm"
                variant={statusFilter === 'Completed' ? 'default' : 'ghost'}
                aria-pressed={statusFilter === 'Completed'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'Completed'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Archive logs
              </Button>
              <Button
                id="btn-tasks-all-filter"
                onClick={() => setStatusFilter('All')}
                size="sm"
                variant={statusFilter === 'All' ? 'default' : 'ghost'}
                aria-pressed={statusFilter === 'All'}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Workpacks
              </Button>
            </div>

            {/* Separator */}
            <span className="h-4 w-[1px] bg-border mx-1 md:block hidden" />

            {/* Priority Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-muted-foreground font-sans text-[11px] font-semibold uppercase tracking-wider select-none">Priority:</span>
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
              <span className="text-muted-foreground font-sans text-[11px] font-semibold uppercase tracking-wider select-none">Category:</span>
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

            <span className="ml-auto text-xs text-muted-foreground font-medium hidden sm:inline">
              Showing <strong>{filteredTasks.length}</strong> schedules
            </span>
          </Card>

          {/* Tasks Directory Table */}
          <UnifiedTable
            id="tasks-schedules-table"
            data={filteredTasks}
            headers={taskTableHeaders}
            emptyStateText="No task schedules match filter constraints."
            renderRow={(task) => {
              const isCompleted = task.status === 'Completed';

              // Fine-grain priority indicator style
              let priorityClass = 'bg-muted text-muted-foreground border-border';
              if (task.priority === 'High') priorityClass = 'bg-destructive/10 text-destructive border-destructive/20';
              else if (task.priority === 'Medium') priorityClass = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';

              // Category rendering symbols
              let catIcon = <CheckSquare className="h-3.5 w-3.5" />;
              if (task.category === 'Call') catIcon = <PhoneCall className="h-3.5 w-3.5 text-primary" />;
              else if (task.category === 'Email') catIcon = <Mail className="h-3.5 w-3.5 text-primary" />;
              else if (task.category === 'Meeting') catIcon = <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;

              return (
                <tr
                  key={task.id}
                  className={`h-12 hover:bg-muted/60 transition-colors border-b border-border ${
                    isCompleted ? 'bg-muted/40 text-muted-foreground' : ''
                  }`}
                >
                  {/* Toggle Task Complete checkbox */}
                  <td className="py-2 px-4 text-center">
                    <button
                      id={`btn-toggle-task-${task.id}`}
                      type="button"
                      onClick={() => {
                        onToggleTask(task.id);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
                      aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
                      title={isCompleted ? "Mark as pending" : "Mark as completed"}
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-border" />
                      )}
                    </button>
                  </td>

                  {/* Title */}
                  <td className="py-2 px-4">
                    <div className="flex items-center space-x-2.5 select-all">
                      <span className="p-1 bg-primary/10 rounded">{catIcon}</span>
                      <span className={`font-semibold text-xs text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                  </td>

                  {/* Related CRM entity */}
                  <td className="py-2 px-4">
                    {task.relatedToType !== 'None' ? (
                      <div className="flex items-center space-x-1 font-semibold text-[11px] text-muted-foreground">
                        {task.relatedToType === 'Lead' ? <Users className="h-3 w-3 text-primary" /> : <Briefcase className="h-3 w-3 text-indigo-500" />}
                        <span className="hover:text-primary transition-colors uppercase">{task.relatedToName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">General schedule</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-2 px-4 font-mono font-medium text-muted-foreground">
                    {task.dueDate}
                  </td>

                  {/* Priority badge */}
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 border text-[10px] rounded-[4px] font-bold ${priorityClass}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assigned Agent */}
                  <td className="py-2 px-4 font-medium text-foreground">
                    {task.assignedTo}
                  </td>

                  {/* Row delete action */}
                  <td className="py-2 px-4 text-center">
                    <button
                      id={`btn-delete-task-${task.id}`}
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                      aria-label={`Delete task "${task.title}"`}
                      title="Delete task assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            }}
          />

        </div>

        {/* Right Column: Real upcoming schedule summary & calendar export - Span 1 */}
        <div className="space-y-4">

          <div className="bg-card border border-border rounded-[8px] p-4 select-none">
            <div className="pb-3 border-b border-border mb-4 flex items-center justify-between text-foreground">
              <div className="flex items-center space-x-1.5 font-bold">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs uppercase tracking-wider">Upcoming Schedule</span>
              </div>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Live</span>
            </div>

            {/* Real upcoming pending tasks, soonest due date first */}
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">No pending tasks scheduled.</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-card border border-border rounded-[6px] text-xs">
                    <div className="flex justify-between items-center text-muted-foreground font-mono text-[10px] mb-1 font-bold">
                      <span>{task.dueDate}</span>
                      <span className={`h-2 w-2 rounded-full ${task.priority === 'High' ? 'bg-destructive' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-muted-foreground'}`}></span>
                    </div>
                    <h5 className="font-bold text-foreground">{task.title}</h5>
                    <p className="text-[11px] text-muted-foreground mt-1 pr-1 leading-normal">
                      {task.category} • Assigned to {task.assignedTo}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="h-[1px] bg-border my-4" />
            <button
              type="button"
              onClick={handleExportICS}
              className="w-full py-2 border border-border hover:bg-muted text-center font-bold text-foreground rounded-[4px] text-[11px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Visible Tasks (.ics)
            </button>
          </div>

        </div>

      </div>

      {/* SIDE PANEL: CREATE NEW TASK SCHEDULES */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">Schedule Follow-up Action</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleTaskSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar">

            <FormInput
              label="Follow-up Action Title"
              register={register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g. Schedule onboarding demo followups"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Action Category"
                register={register('category')}
                error={errors.category?.message}
                options={categoriesList.map(cat => ({ value: cat, label: cat }))}
              />

              <FormDatePicker
                label="Due date"
                registerName="dueDate"
                setValue={setValue}
                value={watch('dueDate')}
                error={errors.dueDate?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-border text-foreground bg-card rounded-[6px] hover:bg-muted font-medium cursor-pointer"
              >
                Close panel
              </Button>
              <Button
                id="btn-task-form-submit"
                type="submit"
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-[6px] cursor-pointer"
              >
                Schedule task
              </Button>
            </div>

          </form>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: IMPORT CSV CONSOLE */}
      <Sheet open={showImportModal} onOpenChange={setShowImportModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <div className="flex items-center space-x-2">
              <FolderSync className="h-4.5 w-4.5 text-primary" />
              <SheetTitle className="font-semibold text-foreground text-[15px]">Bulk CSV Task Importer</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provide a raw CSV dataset representing follow-up tasks. Your column headers should map to:
              <code className="bg-primary/10 text-primary px-1 py-0.5 rounded ml-1 font-mono font-bold text-[10px]">
                Task Title, Due Date, Priority, Category, Assigned User
              </code>.
            </p>

            <div>
              <label htmlFor="task-csv-content" className="block text-xs font-semibold text-foreground mb-1.5">Insert raw text below:</label>
              <textarea
                id="task-csv-content"
                rows={7}
                value={csvContent}
                aria-invalid={!!csvError}
                aria-describedby={csvError ? 'task-csv-error' : undefined}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                  setImportRowErrors([]);
                }}
                placeholder='Task Title,Due Date,Priority,Category,Assigned User&#10;"Follow up on proposal","2026-08-15","High","Call","Sarah Jenkins"'
                className="w-full p-3 font-mono text-[11px] border border-border rounded-[6px] outline-none focus:border-primary bg-muted crm-scrollbar"
              />

              {csvError && (
                <p id="task-csv-error" className="text-[11px] text-destructive font-medium mt-1">{csvError}</p>
              )}
              {importRowErrors.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[11px] text-destructive list-disc list-inside">
                  {importRowErrors.map((rowError, idx) => (
                    <li key={idx}>row {rowError.row}: {rowError.message}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Supports standard RFC-4180 parsing compliance</span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvContent('');
                    setCsvError('');
                    setImportRowErrors([]);
                  }}
                  className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
                >
                  Discard
                </Button>
                <Button
                  id="btn-import-tasks-submit"
                  type="button"
                  onClick={handleImportSubmit}
                  className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                >
                  Integrate Records
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
