/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  CheckSquare,
  Square,
  Trash2,
  PhoneCall,
  Mail,
  Calendar as CalendarIcon,
  Users,
  Briefcase,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CRMTask, TaskPriority } from '../types';
import { taskSchema, TaskFormValues } from '../validation';
import { CRM_USERS } from '../utils';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormInput, FormSelect, FormDatePicker } from './forms/FormControls';

interface CalendarViewProps {
  tasks: CRMTask[];
  onAddTask: (task: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

interface CalendarCell {
  key: string; // YYYY-MM-DD
  day: number;
  inCurrentMonth: boolean;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MAX_VISIBLE_CHIPS = 3;
const CATEGORIES_LIST = ['Call', 'Email', 'Meeting', 'Proposal', 'Follow-up', 'Task'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local (not UTC) YYYY-MM-DD key for a given calendar year/month/day. */
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Builds a fixed 6-row (42 cell) month grid — 7 columns Sun-Sat — including
 * grayed-out leading/trailing days from the adjacent months so the grid
 * height stays stable across every month navigated to.
 */
function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];

  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ key: dateKey(prevYear, prevMonth, day), day, inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: dateKey(year, month, day), day, inCurrentMonth: true });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let trailingDay = 1;
  while (cells.length < 42) {
    cells.push({ key: dateKey(nextYear, nextMonth, trailingDay), day: trailingDay, inCurrentMonth: false });
    trailingDay++;
  }

  return cells;
}

function priorityChipClass(priority: TaskPriority): string {
  if (priority === 'High') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (priority === 'Medium') return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
  return 'bg-muted text-muted-foreground border-border';
}

function categoryIcon(category: CRMTask['category']) {
  if (category === 'Call') return <PhoneCall className="h-3.5 w-3.5 text-primary" />;
  if (category === 'Email') return <Mail className="h-3.5 w-3.5 text-primary" />;
  if (category === 'Meeting') return <CalendarIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
  return <CheckSquare className="h-3.5 w-3.5 text-primary" />;
}

function formatDayHeading(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CalendarView({ tasks, onAddTask, onToggleTask, onDeleteTask }: CalendarViewProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewDate, setViewDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDefaultDate, setAddModalDefaultDate] = useState<string>(todayKey);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CRMTask[]> = {};
    tasks.forEach((task) => {
      if (!map[task.dueDate]) map[task.dueDate] = [];
      map[task.dueDate].push(task);
    });
    return map;
  }, [tasks]);

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const openDayPanel = (key: string) => setSelectedDayKey(key);

  const openAddModal = (defaultDate: string) => {
    setSelectedDayKey(null);
    setAddModalDefaultDate(defaultDate);
    setAddModalOpen(true);
  };

  const handleToggleTask = (id: string) => {
    onToggleTask(id);
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      dueDate: addModalDefaultDate,
      priority: 'Medium',
      assignedTo: CRM_USERS[0]?.name ?? '',
      category: 'Task',
      relatedToType: 'None',
      relatedToName: '',
    },
  });

  // Re-seed the quick-add form every time the sheet opens, so the due date
  // reflects whichever day cell (or the header "+ Add Task" affordance)
  // triggered it.
  useEffect(() => {
    if (addModalOpen) {
      reset({
        title: '',
        dueDate: addModalDefaultDate,
        priority: 'Medium',
        assignedTo: CRM_USERS[0]?.name ?? '',
        category: 'Task',
        relatedToType: 'None',
        relatedToName: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addModalOpen, addModalDefaultDate]);

  const handleAddTaskSubmit = (values: TaskFormValues) => {
    onAddTask({
      title: values.title,
      dueDate: values.dueDate,
      priority: values.priority,
      status: 'Pending',
      assignedTo: values.assignedTo,
      category: values.category,
      relatedToType: 'None',
    });
    reset();
    setAddModalOpen(false);
    showToast(`Task "${values.title}" scheduled.`, 'success');
  };

  const selectedDayTasks = selectedDayKey ? (tasksByDate[selectedDayKey] || []) : [];

  return (
    <div className="space-y-6">
      {/* Page Title & Month Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Visual month view of every scheduled follow-up, call, and task.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="bg-card border border-border rounded-[6px] p-0.5 flex items-center space-x-0.5">
            <button
              id="btn-calendar-prev-month"
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="h-9 w-9 flex items-center justify-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-bold text-foreground w-32 text-center select-none">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              id="btn-calendar-next-month"
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="h-9 w-9 flex items-center justify-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            id="btn-calendar-today"
            onClick={goToday}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors cursor-pointer"
          >
            Today
          </Button>

          <Button
            id="btn-calendar-add-task"
            onClick={() => openAddModal(todayKey)}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-card border border-border rounded-[8px] overflow-hidden">
        {/* Weekday header row */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {grid.map((cell) => {
            const isToday = cell.key === todayKey;
            const dayTasks = tasksByDate[cell.key] || [];
            const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_CHIPS);
            const hiddenCount = dayTasks.length - visibleTasks.length;

            return (
              <div
                key={cell.key}
                role="button"
                tabIndex={0}
                onClick={() => openDayPanel(cell.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDayPanel(cell.key);
                  }
                }}
                aria-label={`View schedules for ${cell.key}${dayTasks.length ? `, ${dayTasks.length} task(s)` : ''}`}
                className={[
                  'min-h-[104px] p-1.5 border-r border-b border-border flex flex-col gap-1 text-left cursor-pointer transition-colors overflow-hidden',
                  isToday ? 'bg-primary/10 ring-1 ring-inset ring-primary' : cell.inCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/20 hover:bg-muted/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      'text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full',
                      isToday ? 'bg-primary text-primary-foreground' : cell.inCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                    ].join(' ')}
                  >
                    {cell.day}
                  </span>
                </div>

                <div className="flex flex-col gap-1 flex-1 min-h-0">
                  {visibleTasks.map((task) => (
                    <div
                      key={task.id}
                      className={[
                        'text-[10px] leading-tight px-1.5 py-0.5 rounded-[4px] border font-medium truncate',
                        priorityChipClass(task.priority),
                        task.status === 'Completed' ? 'line-through opacity-60' : '',
                      ].join(' ')}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground px-1.5">
                      +{hiddenCount} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL: Day detail */}
      <Sheet open={selectedDayKey !== null} onOpenChange={(open) => { if (!open) setSelectedDayKey(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between bg-muted">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4.5 w-4.5 text-primary" />
              <SheetTitle className="font-semibold text-foreground text-[15px]">
                {selectedDayKey ? formatDayHeading(selectedDayKey) : ''}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs text-foreground crm-scrollbar">
            <button
              id="btn-day-panel-add-task"
              type="button"
              onClick={() => selectedDayKey && openAddModal(selectedDayKey)}
              className="w-full py-2 border border-dashed border-border hover:border-primary hover:bg-primary/5 text-center font-semibold text-muted-foreground hover:text-primary rounded-[6px] text-[11px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task for this day
            </button>

            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 text-center">
                No tasks scheduled for this day.
              </p>
            ) : (
              selectedDayTasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                return (
                  <div
                    key={task.id}
                    className={[
                      'p-3 bg-card border border-border rounded-[6px] flex items-start gap-2.5',
                      isCompleted ? 'bg-muted/40' : '',
                    ].join(' ')}
                  >
                    <button
                      id={`btn-day-panel-toggle-${task.id}`}
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
                      title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-border" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 bg-primary/10 rounded">{categoryIcon(task.category)}</span>
                        <h5 className={`font-bold text-foreground truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h5>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={`px-2 py-0.5 border text-[10px] rounded-[4px] font-bold ${priorityChipClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Assigned to {task.assignedTo}</span>
                      </div>

                      {task.relatedToType !== 'None' && (
                        <div className="flex items-center space-x-1 text-[11px] font-semibold text-muted-foreground">
                          {task.relatedToType === 'Lead' ? <Users className="h-3 w-3 text-primary" /> : <Briefcase className="h-3 w-3 text-indigo-500" />}
                          <span className="uppercase">{task.relatedToName}</span>
                        </div>
                      )}
                    </div>

                    <button
                      id={`btn-day-panel-delete-${task.id}`}
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                      aria-label={`Delete task "${task.title}"`}
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: Quick-add task */}
      <Sheet open={addModalOpen} onOpenChange={setAddModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">Schedule Task</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleAddTaskSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar">
            <input type="hidden" {...register('relatedToType')} />

            <FormInput
              label="Task Title"
              register={register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g. Follow up on proposal"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Category"
                register={register('category')}
                error={errors.category?.message}
                options={CATEGORIES_LIST.map((cat) => ({ value: cat, label: cat }))}
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
                label="Priority"
                register={register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                ]}
              />

              <FormSelect
                label="Assigned To"
                register={register('assignedTo')}
                error={errors.assignedTo?.message}
                options={CRM_USERS.map((u) => ({ value: u.name, label: u.name }))}
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setAddModalOpen(false);
                }}
                className="h-9 px-4 border border-border text-foreground bg-card rounded-[6px] hover:bg-muted font-medium cursor-pointer"
              >
                Close panel
              </Button>
              <Button
                id="btn-calendar-task-form-submit"
                type="submit"
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-[6px] cursor-pointer"
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
