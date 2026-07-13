"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect, FormDatePicker } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';
import { Deal, DealStage } from '../../types';
import { opportunityDealSchema } from '../../validation';

interface CRMOpportunityDealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: string;
  assignedTo: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  onAddDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
}

const STAGE_OPTIONS: DealStage[] = ['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation'];

export default function CRMOpportunityDealSheet({
  open,
  onOpenChange,
  company,
  assignedTo,
  contactName,
  contactEmail,
  contactPhone,
  onAddDeal,
}: CRMOpportunityDealSheetProps) {
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(25000);
  const [dealStage, setDealStage] = useState<DealStage>('Lead In');
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rep, setRep] = useState('Sarah Jenkins');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDealTitle(`${company} Partnership Deal`);
      setDealValue(25000);
      setDealStage('Lead In');
      setExpectedCloseDate(new Date().toISOString().slice(0, 10));
      setRep(assignedTo || 'Sarah Jenkins');
      setErrors({});
    }
  }, [open, company, assignedTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = opportunityDealSchema.safeParse({
      title: dealTitle,
      value: dealValue,
      stage: dealStage,
      expectedCloseDate,
      assignedTo: rep,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    onAddDeal({
      title: parsed.data.title,
      company,
      value: parsed.data.value,
      stage: parsed.data.stage as DealStage,
      status: 'Open',
      contactPerson: contactName || 'Unassigned contact',
      email: contactEmail || '',
      phone: contactPhone || '',
      expectedCloseDate: parsed.data.expectedCloseDate,
      assignedTo: parsed.data.assignedTo,
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <SheetTitle className="font-semibold text-foreground text-[15px]">
            Create deal opportunity
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar" noValidate>

          <div className="space-y-1.5">
            <label htmlFor="opp-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Deal title *
            </label>
            <Input
              id="opp-title"
              value={dealTitle}
              onChange={e => setDealTitle(e.target.value)}
              placeholder="e.g. Acme ERP Integration Package"
              className="h-10 text-xs"
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="opp-company" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Associated account
              </label>
              <Input id="opp-company" disabled value={company} className="h-10 text-xs bg-muted cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="opp-value" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Contract value ($) *
              </label>
              <Input
                id="opp-value"
                type="number"
                value={dealValue}
                onChange={e => setDealValue(Number(e.target.value) || 0)}
                placeholder="e.g. 15000"
                className="h-10 text-xs"
                aria-invalid={!!errors.value}
              />
              {errors.value && <p className="text-destructive">{errors.value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormSelect
              label="Initial stage"
              value={dealStage}
              onChange={(val) => setDealStage(val as DealStage)}
              options={STAGE_OPTIONS.map(st => ({ value: st, label: st }))}
            />

            <FormDatePicker
              label="Expected close date"
              registerName="expectedCloseDate"
              setValue={(_name, val) => setExpectedCloseDate(val)}
              value={expectedCloseDate}
              error={errors.expectedCloseDate}
            />

            <FormSelect
              label="Responsible rep"
              value={rep}
              onChange={setRep}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end space-x-2 select-none">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button type="submit">
              Create deal
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
