/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  DollarSign,
  Mail,
  MoreVertical,
  Phone,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  XCircle,
} from 'lucide-react';
import { Deal, DealStage, CRMTask } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime } from '../utils';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useCRM } from '../context/CRMContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormSelect } from './forms/FormControls';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Modular Refactored CRM components imports
import CRMProgressBanner from './details/CRMProgressBanner';
import CRMInteractionTabs from './details/CRMInteractionTabs';
import AttachmentsPanel from './AttachmentsPanel';

interface DealDetailsViewProps {
  dealId: string;
  deals: Deal[];
  tasks: CRMTask[];
  onUpdateDeal: (id: string, patch: Partial<Deal>) => void;
  onUpdateDealStage: (id: string, stage: DealStage) => void;
  onUpdateDealStatus: (id: string, status: 'Open' | 'Won' | 'Lost') => void;
  onDeleteDeal: (id: string) => void;
  onAddTask: (taskInput: Omit<CRMTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onBack: () => void;
}

// Open funnel stages available for the quick pipeline switcher — Won/Lost are
// terminal outcomes managed separately via the status action row.
const FUNNEL_STAGES: DealStage[] = ['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation'];

export default function DealDetailsView({
  dealId,
  deals,
  tasks,
  onUpdateDeal,
  onUpdateDealStage,
  onUpdateDealStatus,
  onDeleteDeal,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onBack,
}: DealDetailsViewProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { loading } = useCRM();

  // Find the current deal
  const deal = deals.find(d => d.id === dealId);

  // Local editable draft, kept in sync whenever navigation targets a new deal
  // id, or when `deal` first becomes available after the initial async data
  // load (it's undefined on mount, before deals have been fetched). Once
  // `draft` already matches the current deal, a background refetch of the
  // same deal won't clobber in-progress local edits.
  const [draft, setDraft] = useState<Deal | undefined>(deal);

  useEffect(() => {
    if (deal && (!draft || draft.id !== deal.id)) {
      setDraft(deal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, deal]);

  // Deals don't yet carry a notes/timeline field on the backend contract, so the
  // notes tab of CRMInteractionTabs is backed by transient, in-memory state only
  // (parity with the Lead/Contact detail views' visual language, not persistence).
  const [notesHistory, setNotesHistory] = useState<Array<{ id: string; content: string; date: string; author: string }>>([]);

  // Filter tasks linked specifically to this Deal
  const relatedTasks = React.useMemo(() => {
    if (!deal) return [];
    return tasks.filter(t => t.relatedToType === 'Deal' && t.relatedToName === deal.title);
  }, [tasks, deal]);

  // Data is still loading (e.g. right after a full-page navigation to this
  // route) — show a loading state instead of a false "not found."
  if ((!deal || !draft) && loading) {
    return (
      <div id="deal-loading" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">Loading deal record…</p>
      </div>
    );
  }

  // Fallback if deal genuinely not found
  if (!deal || !draft) {
    return (
      <div id="deal-not-found" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Deal Record Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">The sales opportunity you are attempting to review may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const commitField = (fields: Partial<Deal>) => {
    onUpdateDeal(deal.id, fields);
  };

  const handleAddNote = (content: string) => {
    const entry = { id: `NOTE-${Date.now()}`, content, date: new Date().toISOString(), author: deal.assignedTo || 'Sarah Jenkins' };
    setNotesHistory(prev => [entry, ...prev]);
    showToast('Note added.', 'success');
  };

  const handleSaveEditedNote = (id: string, content: string) => {
    setNotesHistory(prev => prev.map(note => (note.id === id ? { ...note, content, date: new Date().toISOString() } : note)));
    showToast('Note updated.', 'success');
  };

  const handleDeleteNote = (id: string) => {
    setNotesHistory(prev => prev.filter(n => n.id !== id));
    showToast('Note removed.', 'success');
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this deal?',
      description: `This permanently removes "${deal.title}" and cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    onDeleteDeal(deal.id);
    showToast(`Deal "${deal.title}" deleted.`, 'success');
    onBack();
  };

  const handleWin = () => {
    onUpdateDealStatus(deal.id, 'Won');
    setDraft(prev => (prev ? { ...prev, status: 'Won' } : prev));
    showToast(`"${deal.title}" marked as Won.`, 'success');
  };

  const handleLose = () => {
    onUpdateDealStatus(deal.id, 'Lost');
    setDraft(prev => (prev ? { ...prev, status: 'Lost' } : prev));
    showToast(`"${deal.title}" marked as Lost.`, 'info');
  };

  const handleReopen = () => {
    onUpdateDealStatus(deal.id, 'Open');
    setDraft(prev => (prev ? { ...prev, status: 'Open' } : prev));
    showToast(`"${deal.title}" reopened.`, 'success');
  };

  // Progress banner reflects the same effective stage the kanban board uses:
  // open deals track their funnel stage, closed deals show the outcome status.
  const progressValue = deal.status === 'Open' ? deal.stage : deal.status;

  return (
    <div id="deal-details-viewport" className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">

      {/* 1. Header & Navigation Command Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2">
        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            onClick={onBack}
            className="p-2 cursor-pointer bg-card hover:bg-muted text-foreground rounded-md border border-border transition-colors flex items-center justify-center shadow-xs h-9 w-9"
            aria-label="Back to deals"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{deal.title}</h1>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                {deal.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Sales opportunity linked to {deal.company}
            </p>
          </div>
        </div>

        {/* Dynamic Action Controls for CRM Deal Stage */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-medium">Funnel Stage:</span>
            <FormSelect
              id="deal-detail-stage-direct"
              value={deal.stage}
              onChange={(val) => {
                onUpdateDealStage(deal.id, val as DealStage);
                setDraft(prev => (prev ? { ...prev, stage: val as DealStage } : prev));
                showToast('Deal stage updated.', 'success');
              }}
              options={FUNNEL_STAGES.map(st => ({ value: st, label: st }))}
              className="w-40 font-semibold"
            />
          </div>

          <div className="hidden sm:block h-6 w-[1.5px] bg-border" />

          {/* More Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 flex items-center justify-center border border-border rounded-[6px] hover:bg-muted cursor-pointer"
                aria-label="More deal actions"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1 bg-card border border-border rounded-[6px] shadow-lg z-50">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded flex items-center gap-2 cursor-pointer border-0"
              >
                <Trash2 className="h-4 w-4" />
                Delete Deal
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Pipeline Progress Block Tracker */}
      <CRMProgressBanner value={progressValue} type="stage" />

      {/* 3. Core Split Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Financials, contact info & outcome controls (1/3) */}
        <div className="space-y-6">
          <Card className="bg-card border border-border rounded-[8px] shadow-xs">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                Deal Financials
              </CardTitle>
              <CardDescription className="text-[11px]">Contract valuation and account touchpoints</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">

              <div className="space-y-1.5">
                <label htmlFor="deal-company" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <Building2 className="h-3.5 w-3.5" />
                  Associated Company
                </label>
                <Input
                  id="deal-company"
                  value={draft.company}
                  onChange={(e) => setDraft(prev => (prev ? { ...prev, company: e.target.value } : prev))}
                  onBlur={(e) => commitField({ company: e.target.value })}
                  className="h-9 text-xs font-semibold bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="deal-value" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  Contract Valuation (USD)
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground font-bold text-sm">$</span>
                  <Input
                    id="deal-value"
                    type="number"
                    value={draft.value}
                    onChange={(e) => setDraft(prev => (prev ? { ...prev, value: Number(e.target.value) || 0 } : prev))}
                    onBlur={(e) => commitField({ value: Math.max(0, Number(e.target.value) || 0) })}
                    className="h-9 text-xs font-bold bg-background"
                  />
                </div>
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div className="space-y-1.5">
                <label htmlFor="deal-contact-person" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <User className="h-3.5 w-3.5" />
                  Contact Person
                </label>
                <Input
                  id="deal-contact-person"
                  value={draft.contactPerson}
                  onChange={(e) => setDraft(prev => (prev ? { ...prev, contactPerson: e.target.value } : prev))}
                  onBlur={(e) => commitField({ contactPerson: e.target.value })}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="deal-email" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </label>
                <Input
                  id="deal-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft(prev => (prev ? { ...prev, email: e.target.value } : prev))}
                  onBlur={(e) => commitField({ email: e.target.value })}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="deal-phone" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </label>
                <Input
                  id="deal-phone"
                  value={draft.phone}
                  onChange={(e) => setDraft(prev => (prev ? { ...prev, phone: e.target.value } : prev))}
                  onBlur={(e) => commitField({ phone: e.target.value })}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="deal-close-date" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Expected Close Date
                </label>
                <input
                  id="deal-close-date"
                  type="date"
                  value={draft.expectedCloseDate}
                  onChange={(e) => {
                    setDraft(prev => (prev ? { ...prev, expectedCloseDate: e.target.value } : prev));
                    commitField({ expectedCloseDate: e.target.value });
                  }}
                  className="w-full h-9 px-3 border border-border rounded-[6px] text-xs bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                  <User className="h-3.5 w-3.5" />
                  Assigned Owner
                </label>
                <FormSelect
                  value={draft.assignedTo}
                  onChange={(val) => {
                    setDraft(prev => (prev ? { ...prev, assignedTo: val } : prev));
                    commitField({ assignedTo: val });
                  }}
                  options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
                  className="font-semibold"
                />
              </div>

              <div className="h-[1px] bg-border my-2" />
              <div className="text-[11px] text-muted-foreground leading-relaxed bg-muted p-2 rounded">
                <span className="font-semibold">Created:</span> {new Date(deal.createdAt).toLocaleDateString()} ({formatRelativeTime(deal.createdAt)})
              </div>
            </CardContent>
          </Card>

          {/* Outcome status action row */}
          <Card className="bg-card border border-border rounded-[8px] shadow-xs">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                Outcome Status
              </CardTitle>
              <CardDescription className="text-[11px]">Settle this opportunity as won, lost, or keep it open</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleReopen}
                  aria-pressed={deal.status === 'Open'}
                  className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer transition-colors ${
                    deal.status === 'Open'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                  }`}
                >
                  Keep Open
                </button>

                <button
                  id="btn-deal-outcome-won"
                  type="button"
                  onClick={handleWin}
                  aria-pressed={deal.status === 'Won'}
                  className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer flex items-center justify-center gap-1 transition-colors ${
                    deal.status === 'Won'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'bg-card border-border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Win
                </button>

                <button
                  id="btn-deal-outcome-lost"
                  type="button"
                  onClick={handleLose}
                  aria-pressed={deal.status === 'Lost'}
                  className={`h-9 border text-xs font-semibold rounded-[4px] cursor-pointer flex items-center justify-center gap-1 transition-colors ${
                    deal.status === 'Lost'
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : 'bg-card border-border text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Lose
                </button>
              </div>

              <button
                id="btn-delete-deal-opportunity"
                type="button"
                onClick={handleDelete}
                className="w-full mt-2 h-9 border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold rounded-[4px] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Deal Permanently
              </button>
            </CardContent>
          </Card>

          <AttachmentsPanel entityType="Deal" entityId={deal.id} />
        </div>

        {/* RIGHT COLUMN: Timeline Notes & Followups Checklist (2/3) */}
        <div className="lg:col-span-2">
          <CRMInteractionTabs
            relatedName={deal.title}
            assignedTo={deal.assignedTo}
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

    </div>
  );
}
