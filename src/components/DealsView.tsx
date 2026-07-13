/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  TrendingUp,
  FolderLock,
  ChevronRight,
  DollarSign,
  Building2,
  User,
  ArrowLeftRight,
  ChevronLeft,
  X,
  FileSpreadsheet,
  KanbanSquare,
  Check,
  AlertOctagon,
  Upload,
  Download,
  FolderSync,
} from 'lucide-react';
import { Deal, DealStage } from '../types';
import { CRM_USERS, formatUSD, exportDealsToCSV, parseCSVToDeals } from '../utils';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealSchema, DealFormValues } from '../validation';
import { FormInput, FormSelect, FormDatePicker } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';

interface DealImportResult {
  importedCount: number;
  errors: { row: number; message: string }[];
}

interface DealsViewProps {
  deals: Deal[];
  onAddDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  onUpdateDeal: (id: string, fields: Partial<Deal>) => void;
  onUpdateDealStage: (id: string, stage: DealStage) => void;
  onUpdateDealStatus: (id: string, status: 'Open' | 'Won' | 'Lost') => void;
  onDeleteDeal: (id: string) => void;
  onImportDeals: (rows: Record<string, unknown>[]) => Promise<DealImportResult>;
}

export default function DealsView({
  deals,
  onAddDeal,
  onUpdateDeal,
  onUpdateDealStage,
  onUpdateDealStatus,
  onDeleteDeal,
  onImportDeals
}: DealsViewProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importRowErrors, setImportRowErrors] = useState<{ row: number; message: string }[]>([]);

  // Toggle between Kanban board and Spreadsheet list view
  const [viewMode, setViewMode] = useState<'kanban' | 'spreadsheet'>('kanban');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Open');

  // Modal displays
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Hook Form for enterprise deals creation validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema) as any,
    defaultValues: {
      title: '',
      company: '',
      value: 0,
      stage: 'Lead In',
      contactPerson: '',
      email: '',
      phone: '',
      expectedCloseDate: new Date().toISOString().slice(0, 10),
      assignedTo: 'Sarah Jenkins',
    },
  });

  // Stages definition
  const stages: DealStage[] = [
    'Lead In',
    'Contact Made',
    'Demo Scheduled',
    'Proposal Sent',
    'Negotiation'
  ];

  // Won / Lost states are final and grouped appropriately
  const finalStages: ('Won' | 'Lost')[] = ['Won', 'Lost'];

  // Sum valuations per stage helper
  const columnStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};

    // Initialize
    [...stages, 'Won', 'Lost'].forEach(st => {
      stats[st] = { count: 0, value: 0 };
    });

    deals.forEach(deal => {
      // If deal status is open, resolve by its column stage. Otherwise resolve to Won / Lost stages directly
      const stageKey = deal.status === 'Open' ? deal.stage : deal.status;
      if (stats[stageKey]) {
        stats[stageKey].count += 1;
        stats[stageKey].value += deal.value;
      }
    });

    return stats;
  }, [deals]);

  const filteredDealsList = useMemo(() => {
    return deals.filter(deal => {
      const matchStage = stageFilter === 'All' || deal.stage === stageFilter;
      const matchStatus = statusFilter === 'All' || deal.status === statusFilter;
      return matchStage && matchStatus;
    });
  }, [deals, stageFilter, statusFilter]);

  // Submit deal constructor via React Hook Form
  const handleCreateDealSubmit = (values: DealFormValues) => {
    onAddDeal({
      title: values.title,
      company: values.company,
      value: values.value,
      stage: values.stage,
      status: 'Open',
      contactPerson: values.contactPerson || 'Unknown Contact',
      email: values.email || 'sales@company.com',
      phone: values.phone || '+1 (555) 000-0000',
      expectedCloseDate: values.expectedCloseDate,
      assignedTo: values.assignedTo
    });

    // Reset Form
    reset();
    setShowAddModal(false);
  };

  const handleDeleteDeal = async (deal: Deal) => {
    const ok = await confirm({
      title: 'Delete this deal?',
      description: `Do you want to permanently delete proposal "${deal.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    onDeleteDeal(deal.id);
    setSelectedDeal(null);
    showToast(`Deal "${deal.title}" deleted.`, 'success');
  };

  const handleExportCSV = () => {
    const csvStr = exportDealsToCSV(deals);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `centric_crm_deals_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
      const parsed = parseCSVToDeals(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid deals parsed. Verify heading structure.');
        setImportRowErrors([]);
        return;
      }
      setCsvError('');
      const result = await onImportDeals(parsed);
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

  // Headers for UnifiedTable (Deals spreadsheet mode)
  const dealTableHeaders: UnifiedTableHeader[] = [
    { key: 'title', label: 'Deal & Opportunity' },
    { key: 'company', label: 'Associated Account' },
    { key: 'stage', label: 'Funnel Column Stage' },
    { key: 'status', label: 'Status Tag' },
    { key: 'expectedCloseDate', label: 'Expected Closing Target' },
    { key: 'value', className: 'text-right', label: 'Contract Valuation' },
    { key: 'assignedTo', label: 'Assigned Rep' },
    { key: 'config', className: 'text-center', label: 'Config' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & View Config switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-foreground tracking-tight">Sales Funnels & Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Track legal agreement steps, negotiate contract values, and review monthly target close-dates.
          </p>
        </div>

        {/* View Switch / Dual modes button toggler */}
        <div id="pipeline-view-modes" className="flex items-center space-x-3 text-xs">
          <div className="bg-card border border-border rounded-[6px] p-0.5 flex space-x-0.5">
            <Button
              id="deals-button-kanban-mode"
              onClick={() => setViewMode('kanban')}
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              aria-pressed={viewMode === 'kanban'}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanSquare className="h-4 w-4" />
              Kanban Pipeline
            </Button>
            <Button
              id="deals-button-spreadsheet-mode"
              onClick={() => setViewMode('spreadsheet')}
              size="sm"
              variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
              aria-pressed={viewMode === 'spreadsheet'}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'spreadsheet'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Funnel Spreadsheet
            </Button>
          </div>

          <Button
            id="btn-import-deals-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Import CSV
          </Button>

          <Button
            id="btn-export-deals-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Data
          </Button>

          <Button
            id="btn-add-deal-modal"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-none"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Deal Offer
          </Button>
        </div>
      </div>

      {viewMode === 'spreadsheet' ? (
        /* SPREADSHEET TABLE LAYOUT */
        <div className="space-y-4">
          {/* Quick spreadsheet filter bar */}
          <Card className="bg-card border border-border rounded-[8px] p-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 text-xs">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 select-none">
                Filter Pipeline Stage
              </label>
              <FormSelect
                value={stageFilter}
                onChange={(val) => setStageFilter(val)}
                options={[
                  { value: 'All', label: 'All Open Columns' },
                  ...stages.map(st => ({ value: st, label: st }))
                ]}
                placeholder="All Open Columns"
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 select-none">
                Filter Outcome Status
              </label>
              <FormSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'All', label: 'All statuses (Open/Won/Lost)' },
                  { value: 'Open', label: 'Currently Open Funnels' },
                  { value: 'Won', label: 'Closed Won Agreements' },
                  { value: 'Lost', label: 'Closed Lost / Suspended' }
                ]}
                placeholder="All statuses (Open/Won/Lost)"
              />
            </div>

            <span className="text-[11px] text-muted-foreground sm:ml-auto">
              Retrieved <strong>{filteredDealsList.length}</strong> deal contracts.
            </span>
          </Card>

          <UnifiedTable
            id="deals-spreadsheet-table"
            data={filteredDealsList}
            headers={dealTableHeaders}
            emptyStateText="No sales pipeline records fit your filters."
            renderRow={(deal) => (
              <tr
                key={deal.id}
                className="h-[52px] hover:bg-muted/60 transition-all border-b border-border cursor-pointer"
                onClick={() => setSelectedDeal(deal)}
              >
                <td className="py-2 px-4 font-semibold">
                  <a
                    href={`/deal-details/${deal.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline"
                  >
                    {deal.title}
                  </a>
                </td>
                <td className="py-2 px-4 font-medium text-foreground">{deal.company}</td>
                <td className="py-2 px-4">
                  <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium font-mono text-muted-foreground border border-border">
                    {deal.stage}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border ${
                    deal.status === 'Won' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' :
                    deal.status === 'Lost' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {deal.status}
                  </span>
                </td>
                <td className="py-2 px-4 font-mono text-muted-foreground">{deal.expectedCloseDate}</td>
                <td className="py-2 px-4 text-right font-bold text-foreground">{formatUSD(deal.value)}</td>
                <td className="py-2 px-4 text-foreground">{deal.assignedTo}</td>
                <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedDeal(deal)}
                    className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )}
          />
        </div>
      ) : (
        /* ROBUST KANBAN PIPELINE VIEW */
        <div id="deals-kanban-stage-board" className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 crm-scrollbar">

          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage && d.status === 'Open');
            const stats = columnStats[stage] || { count: 0, value: 0 };

            return (
              <div
                key={stage}
                className="bg-muted rounded-[6px] border border-border p-3 flex flex-col space-y-3.5 min-w-[210px] select-none"
              >
                {/* Column head */}
                <div className="pb-2 border-b border-border flex items-center justify-between text-foreground">
                  <div>
                    <h3 className="font-bold text-[13px] tracking-tight">{stage}</h3>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground block mt-0.5">
                      {stats.count} Offer{stats.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Valuation Aggregate */}
                  <span className="font-bold font-mono text-[11px] text-primary">
                    {formatUSD(stats.value)}
                  </span>
                </div>

                {/* Cards matching stage */}
                <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-0.5 crm-scrollbar flex-1 min-h-[150px]">
                  {stageDeals.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-muted-foreground border border-dashed border-border rounded bg-card/50">
                      Empty stage pipeline
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        id={`deal-kanban-card-${deal.id}`}
                        onClick={() => setSelectedDeal(deal)}
                        className="bg-card p-3 border border-border rounded-[6px] hover:border-primary hover:shadow-2xs transition-all cursor-pointer space-y-2.5 relative group"
                      >
                        <div>
                          <a
                            href={`/deal-details/${deal.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-foreground text-xs group-hover:text-primary hover:underline transition-colors leading-normal line-clamp-2 block"
                          >
                            {deal.title}
                          </a>
                          <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-muted-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[130px] font-medium">{deal.company}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          {/* Value */}
                          <span className="font-extrabold text-foreground text-[12px] font-mono">
                            {formatUSD(deal.value)}
                          </span>

                          {/* Quick promote arrows for immediate UX without complex drag-drop */}
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const currentIndex = stages.indexOf(stage);
                                if (currentIndex > 0) {
                                  onUpdateDealStage(deal.id, stages[currentIndex - 1]);
                                  showToast(`Moved "${deal.title}" back to ${stages[currentIndex - 1]}.`, 'success');
                                }
                              }}
                              disabled={stages.indexOf(stage) === 0}
                              aria-label={`Demote ${deal.title} to previous stage`}
                              title="Demote block"
                              className="p-1 border border-border hover:bg-primary/10 rounded text-muted-foreground hover:text-primary disabled:opacity-25 cursor-pointer"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                const currentIndex = stages.indexOf(stage);
                                if (currentIndex < stages.length - 1) {
                                  onUpdateDealStage(deal.id, stages[currentIndex + 1]);
                                  showToast(`Promoted "${deal.title}" to ${stages[currentIndex + 1]}.`, 'success');
                                } else {
                                  // Won trigger at last stage if promoted
                                  onUpdateDealStatus(deal.id, 'Won');
                                  showToast(`"${deal.title}" marked as Won!`, 'success');
                                }
                              }}
                              aria-label={`Promote ${deal.title} to next stage`}
                              title="Promote contract stage"
                              className="p-1 border border-border hover:bg-primary/10 rounded text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Assignee initials badge */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>Close: {deal.expectedCloseDate.substring(5)}</span>
                          <span className="font-medium text-foreground bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                            {deal.assignedTo.split(' ').map(n=>n[0]).join('')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* QUICK STATS & HISTORIC WIN QUOTA SUMMARY (Pipedrive styled dashboard block) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border rounded-[8px] p-4 text-xs select-none">

        {/* widget Won aggregate */}
        <div className="md:border-r border-border md:pr-4 py-1">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
            <Check className="h-4 w-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full p-0.5" />
            <span className="uppercase tracking-wider text-[11px]">Total Opportunities Won</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-bold text-foreground">{columnStats['Won'].count} Contracts</h4>
            <span className="font-bold text-[14px] text-emerald-700 dark:text-emerald-400 font-mono">{formatUSD(columnStats['Won'].value)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Completed and successfully routed sales. Fully audited.</p>
        </div>

        {/* widget Lost aggregate */}
        <div className="md:border-r border-border md:px-4 py-1">
          <div className="flex items-center space-x-2 text-destructive font-bold">
            <AlertOctagon className="h-4 w-4 bg-destructive/10 text-destructive rounded-full p-0.5" />
            <span className="uppercase tracking-wider text-[11px]">Opportunities Dropped/Lost</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-bold text-foreground">{columnStats['Lost'].count} Proposals</h4>
            <span className="font-semibold text-[14px] text-destructive font-mono">{formatUSD(columnStats['Lost'].value)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Deals unqualified, budget frozen, or won by competitor.</p>
        </div>

        {/* widget Total Contract Funnel value */}
        <div className="md:pl-4 py-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground block">Gross Forecast Value</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-extrabold text-foreground">
              {deals.filter(d=>d.status === 'Open').length} Active Open
            </h4>
            <span className="font-extrabold text-[15px] text-primary font-mono">
              {formatUSD(deals.filter(d=>d.status === 'Open').reduce((acc,curr)=>acc+curr.value,0))}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Estimated valuation across all stages. Subject to win margins.</p>
        </div>

      </div>

      {/* SIDE PANEL: ADD NEW PIPELINE DEAL */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">Create Deal Contract Opportunity</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleCreateDealSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs crm-scrollbar">

            <FormInput
              label="Deal Proposal / Contract Title"
              register={register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g. Acme ERP Integration Package"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Associated Corporate Entity"
                register={register('company')}
                error={errors.company?.message}
                required
                placeholder="e.g. Apex Corporation"
              />

              <FormInput
                label="Estimated Contract Value ($)"
                register={register('value')}
                error={errors.value?.message}
                required
                type="number"
                placeholder="e.g. 15000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Contact Person Name"
                register={register('contactPerson')}
                error={errors.contactPerson?.message}
                placeholder="e.g. Sarah Connor"
              />

              <FormInput
                label="Contact Client Phone"
                register={register('phone')}
                error={errors.phone?.message}
                placeholder="e.g. +1 (555) 900-5000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormSelect
                label="Initial Funnel Stage"
                register={register('stage')}
                error={errors.stage?.message}
                options={stages.map(st => ({ value: st, label: st }))}
              />

              <FormDatePicker
                label="Expected Close Date"
                registerName="expectedCloseDate"
                setValue={setValue}
                value={watch('expectedCloseDate')}
                error={errors.expectedCloseDate?.message}
              />

              <FormSelect
                label="Responsible Sales Rep"
                register={register('assignedTo')}
                error={errors.assignedTo?.message}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />
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
                Discard Offer
              </Button>
              <Button
                id="btn-deal-form-submit"
                type="submit"
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-[6px] cursor-pointer"
              >
                Create Deal Funnel
              </Button>
            </div>

          </form>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: EDIT/MUTATE EXISTENT PIPELINE OPPORTUNITY */}
      <Sheet open={!!selectedDeal} onOpenChange={(open) => { if (!open) setSelectedDeal(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          {selectedDeal && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
                <div>
                  <SheetTitle className="font-semibold text-foreground text-[15px]">Negotiate Contract Opportunity</SheetTitle>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">CONTRACT ID: {selectedDeal.id}</p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar">

                <div className="bg-primary/5 border border-primary/15 rounded-[6px] p-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-foreground text-14px">{selectedDeal.title}</h4>
                    <p className="font-semibold text-xs text-muted-foreground mt-0.5">Account: {selectedDeal.company}</p>
                  </div>
                  <a
                    href={`/deal-details/${selectedDeal.id}`}
                    className="shrink-0 text-[11px] font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    Open Full Record
                  </a>
                </div>

                <div className="space-y-3.5">
                  {/* Contract Valuation adjustment */}
                  <div>
                    <label htmlFor="deal-sheet-value" className="block text-muted-foreground font-bold mb-1.5">Financial Valuation ($)</label>
                    <input
                      id="deal-sheet-value"
                      type="number"
                      value={selectedDeal.value}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setSelectedDeal(prev => prev ? { ...prev, value: val } : null);
                      }}
                      onBlur={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        onUpdateDeal(selectedDeal.id, { value: val });
                      }}
                      className="w-full h-10 px-3 border border-border rounded-[6px] font-mono text-[13px] font-bold text-foreground bg-background outline-none"
                    />
                  </div>

                  {/* Pipeline Stage adjustment */}
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5 select-none">Funnel Column Stage</label>
                    <FormSelect
                      value={selectedDeal.stage}
                      onChange={(val) => {
                        onUpdateDealStage(selectedDeal.id, val as DealStage);
                        setSelectedDeal(prev => prev ? { ...prev, stage: val as DealStage } : null);
                      }}
                      options={stages.map(st => ({ value: st, label: st }))}
                    />
                  </div>

                  {/* Outcome status triggers */}
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5">Outcome Status Settlement</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Open');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Open' } : null);
                        }}
                        aria-pressed={selectedDeal.status === 'Open'}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Open'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        Keep Open
                      </button>

                      <button
                        id="btn-deal-outcome-won"
                        type="button"
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Won');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Won' } : null);
                          showToast(`Agreement settled! "${selectedDeal.title}" marked as CLOSED WON.`, 'success');
                        }}
                        aria-pressed={selectedDeal.status === 'Won'}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Won'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                            : 'bg-card border-border text-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                        }`}
                      >
                        WIN DEAL
                      </button>

                      <button
                        id="btn-deal-outcome-lost"
                        type="button"
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Lost');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Lost' } : null);
                          showToast(`Deal settled. "${selectedDeal.title}" marked as CLOSED LOST.`, 'info');
                        }}
                        aria-pressed={selectedDeal.status === 'Lost'}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Lost'
                            ? 'bg-destructive/10 border-destructive text-destructive'
                            : 'bg-card border-border text-destructive hover:bg-destructive/10'
                        }`}
                      >
                        LOSE DEAL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 border border-border rounded-[6px] text-muted-foreground leading-relaxed">
                  <span className="font-bold block text-foreground mb-1">Associated Contact detail:</span>
                  <p>Client Liaison: <strong>{selectedDeal.contactPerson}</strong></p>
                  <p>Corporate Email: {selectedDeal.email}</p>
                  <p>Phone Line: {selectedDeal.phone}</p>
                  <p className="mt-1">Assigned Executive Representative: <strong>{selectedDeal.assignedTo}</strong></p>
                </div>

                {/* Delete trigger */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <button
                    id="btn-delete-deal-opportunity"
                    type="button"
                    onClick={() => handleDeleteDeal(selectedDeal)}
                    className="text-destructive hover:text-destructive/80 font-bold transition-colors cursor-pointer"
                  >
                    Delete Proposal
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDeal(null)}
                    className="h-9 px-4 border border-border bg-card hover:bg-muted text-foreground font-semibold rounded-[6px] cursor-pointer"
                  >
                    Save & Complete
                  </Button>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: IMPORT CSV CONSOLE */}
      <Sheet open={showImportModal} onOpenChange={setShowImportModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <div className="flex items-center space-x-2">
              <FolderSync className="h-4.5 w-4.5 text-primary" />
              <SheetTitle className="font-semibold text-foreground text-[15px]">Bulk CSV Deal Importer</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provide a raw CSV dataset representing deal records. Your column headers should map to:
              <code className="bg-primary/10 text-primary px-1 py-0.5 rounded ml-1 font-mono font-bold text-[10px]">
                Deal Title, Company, Value ($), Stage, Contact Person, Email, Phone, Expected Close Date
              </code>.
            </p>

            <div>
              <label htmlFor="deal-csv-content" className="block text-xs font-semibold text-foreground mb-1.5">Insert raw text below:</label>
              <textarea
                id="deal-csv-content"
                rows={7}
                value={csvContent}
                aria-invalid={!!csvError}
                aria-describedby={csvError ? 'deal-csv-error' : undefined}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                  setImportRowErrors([]);
                }}
                placeholder='Deal Title,Company,Value ($),Stage,Contact Person,Email,Phone,Expected Close Date&#10;"Acme ERP Rollout","Acme Corp",25000,"Lead In","Jane Doe","jane@acme.com","+1 (555) 000-0000","2026-08-01"'
                className="w-full p-3 font-mono text-[11px] border border-border rounded-[6px] outline-none focus:border-primary bg-muted crm-scrollbar"
              />

              {csvError && (
                <p id="deal-csv-error" className="text-[11px] text-destructive font-medium mt-1">{csvError}</p>
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
                  id="btn-import-deals-submit"
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
