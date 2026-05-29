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
  AlertOctagon
} from 'lucide-react';
import { Deal, DealStage } from '../types';
import { CRM_USERS, formatUSD } from '../utils';
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

interface DealsViewProps {
  deals: Deal[];
  onAddDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  onUpdateDealStage: (id: string, stage: DealStage) => void;
  onUpdateDealStatus: (id: string, status: 'Open' | 'Won' | 'Lost') => void;
  onDeleteDeal: (id: string) => void;
}

export default function DealsView({ 
  deals, 
  onAddDeal, 
  onUpdateDealStage, 
  onUpdateDealStatus,
  onDeleteDeal
}: DealsViewProps) {
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
      expectedCloseDate: '2026-06-30',
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

  return (
    <div className="space-y-6">
      {/* Page Title & View Config switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-[#111827] tracking-tight">Sales Funnels & Pipelines</h1>
          <p className="text-sm text-[#6B7280]">
            Track legal agreement steps, negotiate contract values, and review monthly target close-dates.
          </p>
        </div>

        {/* View Switch / Dual modes button toggler */}
        <div id="pipeline-view-modes" className="flex items-center space-x-3 text-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-0.5 flex space-x-0.5">
            <Button
              id="deals-button-kanban-mode"
              onClick={() => setViewMode('kanban')}
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-[#2563EB] text-white' 
                  : 'text-[#6B7280] hover:text-[#111827]'
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
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'spreadsheet' 
                  ? 'bg-[#2563EB] text-white' 
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Funnel Spreadsheet
            </Button>
          </div>

          <Button
            id="btn-add-deal-modal"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-none"
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
          <Card className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 text-xs">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 select-none">
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
              <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 select-none">
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

            <span className="text-[11px] text-[#6B7280] sm:ml-auto">
              Retrieved <strong>{filteredDealsList.length}</strong> deal contracts.
            </span>
          </Card>

          <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
            <div className="overflow-x-auto crm-scrollbar">
              <Table id="deals-spreadsheet-table" className="w-full text-left text-xs border-collapse min-w-[900px]">
                <TableHeader className="bg-[#F5F6F8] text-[#6B7280] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E5E7EB]">
                  <TableRow className="h-11">
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Deal & Opportunity</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Associated Account</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Funnel Column Stage</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Status Tag</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Expected Closing Target</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-right text-xs text-[#6B7280]">Contract Valuation</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-[#6B7280]">Assigned Rep</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-center text-xs text-[#6B7280]">Config</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#E5E7EB] text-[#111827]">
                  {filteredDealsList.length === 0 ? (
                    <tr className="h-20">
                      <td colSpan={8} className="text-center text-[#6B7280]">
                        No sales pipeline records fit your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDealsList.map((deal) => (
                      <tr 
                        key={deal.id} 
                        className="h-[52px] hover:bg-slate-50 transition-all cursor-pointer"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <td className="py-2 px-4 font-semibold text-blue-600 hover:underline">{deal.title}</td>
                        <td className="py-2 px-4 font-medium">{deal.company}</td>
                        <td className="py-2 px-4">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium font-mono text-[#6B7280] border border-gray-200">
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border ${
                            deal.status === 'Won' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                            deal.status === 'Lost' ? 'bg-red-50 text-red-800 border-red-150' :
                            'bg-blue-50 text-blue-800 border-blue-150'
                          }`}>
                            {deal.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-mono text-[#6B7280]">{deal.expectedCloseDate}</td>
                        <td className="py-2 px-4 text-right font-bold text-slate-900">{formatUSD(deal.value)}</td>
                        <td className="py-2 px-4">{deal.assignedTo}</td>
                        <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedDeal(deal)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
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
                className="bg-[#F5F6F8] rounded-[6px] border border-[#E5E7EB] p-3 flex flex-col space-y-3.5 min-w-[210px] select-none"
              >
                {/* Column head */}
                <div className="pb-2 border-b border-[#E5E7EB] flex items-center justify-between text-[#111827]">
                  <div>
                    <h3 className="font-bold text-[13px] tracking-tight">{stage}</h3>
                    <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mt-0.5">
                      {stats.count} Offer{stats.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Valuation Aggregate */}
                  <span className="font-bold font-mono text-[11px] text-[#2563EB]">
                    {formatUSD(stats.value)}
                  </span>
                </div>

                {/* Cards matching stage */}
                <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-0.5 crm-scrollbar flex-1 min-h-[150px]">
                  {stageDeals.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-[#6B7280] border border-dashed border-[#E5E7EB] rounded bg-white/50">
                      Empty stage pipeline
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        id={`deal-kanban-card-${deal.id}`}
                        onClick={() => setSelectedDeal(deal)}
                        className="bg-white p-3 border border-[#E5E7EB] rounded-[6px] hover:border-[#2563EB] hover:shadow-2xs transition-all cursor-pointer space-y-2.5 relative group"
                      >
                        <div>
                          <h4 className="font-bold text-[#111827] text-xs group-hover:text-[#2563EB] transition-colors leading-normal line-clamp-2">
                            {deal.title}
                          </h4>
                          <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-[#6B7280]">
                            <Building2 className="h-3 w-3 text-[#6B7280]" />
                            <span className="truncate max-w-[130px] font-medium">{deal.company}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#F5F6F8]">
                          {/* Value */}
                          <span className="font-extrabold text-[#111827] text-[12px] font-mono">
                            {formatUSD(deal.value)}
                          </span>
                          
                          {/* Quick promote arrows for immediate UX without complex drag-drop */}
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const currentIndex = stages.indexOf(stage);
                                if (currentIndex > 0) {
                                  onUpdateDealStage(deal.id, stages[currentIndex - 1]);
                                }
                              }}
                              disabled={stages.indexOf(stage) === 0}
                              className="p-1 border border-[#E5E7EB] hover:bg-[#EFF6FF] rounded text-[#6B7280] hover:text-[#2563EB] disabled:opacity-25"
                              title="Demote block"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                const currentIndex = stages.indexOf(stage);
                                if (currentIndex < stages.length - 1) {
                                  onUpdateDealStage(deal.id, stages[currentIndex + 1]);
                                } else {
                                  // Won trigger at last stage if promoted
                                  onUpdateDealStatus(deal.id, 'Won');
                                }
                              }}
                              className="p-1 border border-[#E5E7EB] hover:bg-[#EFF6FF] rounded text-[#6B7280] hover:text-[#2563EB]"
                              title="Promote contract stage"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Assignee initials badge */}
                        <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1">
                          <span>Close: {deal.expectedCloseDate.substring(5)}</span>
                          <span className="font-medium text-[#111827] bg-[#EFF6FF] border border-blue-100 rounded px-1.5 py-0.5">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-[#E5E7EB] rounded-[8px] p-4 text-xs select-none">
        
        {/* widget Won aggregate */}
        <div className="border-r border-[#E5E7EB] pr-4 py-1">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <Check className="h-4 w-4 bg-emerald-100 text-emerald-700 rounded-full p-0.5" />
            <span className="uppercase tracking-wider text-[11px]">Total Opportunities Won</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-bold text-[#111827]">{columnStats['Won'].count} Contracts</h4>
            <span className="font-bold text-[14px] text-emerald-700 font-mono">{formatUSD(columnStats['Won'].value)}</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1.5 leading-relaxed">Completed and successfully routed sales. Fully audited.</p>
        </div>

        {/* widget Lost aggregate */}
        <div className="border-r border-[#E5E7EB] px-4 py-1">
          <div className="flex items-center space-x-2 text-red-700 font-bold">
            <AlertOctagon className="h-4 w-4 bg-red-100 text-red-700 rounded-full p-0.5" />
            <span className="uppercase tracking-wider text-[11px]">Opportunities Dropped/Lost</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-bold text-[#111827]">{columnStats['Lost'].count} Proposals</h4>
            <span className="font-semibold text-[14px] text-red-650 font-mono">{formatUSD(columnStats['Lost'].value)}</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1.5 leading-relaxed">Deals unqualified, budget frozen, or won by competitor.</p>
        </div>

        {/* widget Total Contract Funnel value */}
        <div className="pl-4 py-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#6B7280] block">Gross Forecast Value</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h4 className="text-20px font-extrabold text-[#111827]">
              {deals.filter(d=>d.status === 'Open').length} Active Open
            </h4>
            <span className="font-extrabold text-[15px] text-[#2563EB] font-mono">
              {formatUSD(deals.filter(d=>d.status === 'Open').reduce((acc,curr)=>acc+curr.value,0))}
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1.5 leading-relaxed">Estimated valuation across all stages. Subject to win margins.</p>
        </div>

      </div>

      {/* SIDE PANEL: ADD NEW PIPELINE DEAL */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">Create Deal Contract Opportunity</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleCreateDealSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs crm-scrollbar">
            
            <FormInput
              label="Deal Proposal / Contract Title"
              register={register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g. Acme ERP Integration Package"
            />

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-3">
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
                Discard Offer
              </Button>
              <Button
                id="btn-deal-form-submit"
                type="submit"
                className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
              >
                Create Deal Funnel
              </Button>
            </div>

          </form>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: EDIT/MUTATE EXISTENT PIPELINE OPPORTUNITY */}
      <Sheet open={!!selectedDeal} onOpenChange={(open) => { if (!open) setSelectedDeal(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          {selectedDeal && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
                <div>
                  <SheetTitle className="font-semibold text-[#111827] text-[15px]">Negotiate Contract Opportunity</SheetTitle>
                  <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">CONTRACT ID: {selectedDeal.id}</p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
                
                <div className="bg-[#EFF6FF] border border-[#2563EB]/15 rounded-[6px] p-3">
                  <h4 className="font-bold text-[#111827] text-14px">{selectedDeal.title}</h4>
                  <p className="font-semibold text-xs text-[#6B7280] mt-0.5">Account: {selectedDeal.company}</p>
                </div>

                <div className="space-y-3.5">
                  {/* Contract Valuation adjustment */}
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1.5">Financial Valuation ($)</label>
                    <input
                      type="number"
                      value={selectedDeal.value}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        // Instantly mutate deal value in detailed state (parent handle triggers updates safely on tab switch or simple callback props)
                        selectedDeal.value = val;
                        onAddDeal({ ...selectedDeal }); // Trick to trigger reactivity
                      }}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[6px] font-mono text-[13px] font-bold text-slate-800 outline-none"
                    />
                  </div>

                  {/* Pipeline Stage adjustment */}
                  <div>
                    <label className="block text-[#6B7280] font-bold mb-1.5 select-none">Funnel Column Stage</label>
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
                    <label className="block text-[#6B7280] font-bold mb-1.5">Outcome Status Settlement</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Open');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Open' } : null);
                        }}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Open'
                            ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]'
                            : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-slate-50'
                        }`}
                      >
                        Keep Open
                      </button>
                      
                      <button
                        id="btn-deal-outcome-won"
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Won');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Won' } : null);
                          alert(`Agreement settled! Mark ${selectedDeal.title} as CLOSED WON.`);
                        }}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Won'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-white border-[#E5E7EB] text-emerald-600 hover:bg-emerald-50/20'
                        }`}
                      >
                        WIN DEAL
                      </button>

                      <button
                        id="btn-deal-outcome-lost"
                        onClick={() => {
                          onUpdateDealStatus(selectedDeal.id, 'Lost');
                          setSelectedDeal(prev => prev ? { ...prev, status: 'Lost' } : null);
                          alert(`Deal settled! Mark ${selectedDeal.title} as CLOSED LOST.`);
                        }}
                        className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer ${
                          selectedDeal.status === 'Lost'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-white border-[#E5E7EB] text-red-650 hover:bg-red-50/20'
                        }`}
                      >
                        LOSE DEAL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F5F6F8] p-3 border border-[#E5E7EB] rounded-[6px] text-[#6B7280] leading-relaxed">
                  <span className="font-bold block text-[#111827] mb-1">Associated Contact detail:</span>
                  <p>Client Liaison: <strong>{selectedDeal.contactPerson}</strong></p>
                  <p>Corporate Email: {selectedDeal.email}</p>
                  <p>Phone Line: {selectedDeal.phone}</p>
                  <p className="mt-1">Assigned Executive Representative: <strong>{selectedDeal.assignedTo}</strong></p>
                </div>

                {/* Delete trigger */}
                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    id="btn-delete-deal-opportunity"
                    onClick={() => {
                      if (confirm(`Do you want to permanently delete proposal "${selectedDeal.title}"?`)) {
                        onDeleteDeal(selectedDeal.id);
                        setSelectedDeal(null);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer"
                  >
                    Delete Proposal
                  </button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDeal(null)}
                    className="h-9 px-4 border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111827] font-semibold rounded-[6px] cursor-pointer"
                  >
                    Save & Complete
                  </Button>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
