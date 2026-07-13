"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';
import { Lead, DealStage } from '../../types';
import { convertLeadSchema } from '../../validation';

export interface ConvertLeadDealPayload {
  title: string;
  value: number;
  stage: DealStage;
  assignedTo: string;
}

interface CRMConvertLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | undefined;
  onConvert: (dealPayload: ConvertLeadDealPayload | null) => void;
}

const STAGE_OPTIONS: DealStage[] = ['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation'];

export default function CRMConvertLeadSheet({
  open,
  onOpenChange,
  lead,
  onConvert,
}: CRMConvertLeadSheetProps) {
  const [createDealChecked, setCreateDealChecked] = useState(true);
  const [dealName, setDealName] = useState('');
  const [dealAmount, setDealAmount] = useState(25000);
  const [dealStage, setDealStage] = useState<DealStage>('Lead In');
  const [rep, setRep] = useState('Sarah Jenkins');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setDealName(`${lead.company} Deal Proposal`);
      setDealAmount(lead.dealValue || 25000);
      setRep(lead.assignedTo || 'Sarah Jenkins');
      setError('');
    }
  }, [lead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!createDealChecked) {
      onConvert(null);
      onOpenChange(false);
      return;
    }

    const parsed = convertLeadSchema.safeParse({ dealTitle: dealName, dealValue: dealAmount, stage: dealStage });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the deal details.');
      return;
    }

    onConvert({ title: parsed.data.dealTitle, value: parsed.data.dealValue, stage: parsed.data.stage as DealStage, assignedTo: rep });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <SheetTitle className="font-semibold text-foreground text-[15px]">
            Convert lead to contact
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar" noValidate>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 leading-normal mb-2">
            <span className="font-bold block text-[13px] mb-1">Convert "{lead?.name}" of "{lead?.company}"</span>
            This moves the lead into the Contacts directory and marks the profile status as Qualified.
          </div>

          {error && <p role="alert" className="text-destructive font-medium">{error}</p>}

          <div className="flex items-center space-x-2 py-1 select-none">
            <input
              type="checkbox"
              id="convert-createDealChecked"
              checked={createDealChecked}
              onChange={e => setCreateDealChecked(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            />
            <label htmlFor="convert-createDealChecked" className="text-xs font-semibold cursor-pointer">
              Also create a deal opportunity
            </label>
          </div>

          {createDealChecked && (
            <div className="space-y-4 pt-3 border-t border-border">
              <div className="space-y-1.5">
                <label htmlFor="convert-deal-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Deal title *
                </label>
                <Input id="convert-deal-title" value={dealName} onChange={e => setDealName(e.target.value)} className="h-10 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="convert-deal-value" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Contract value ($) *
                  </label>
                  <Input
                    id="convert-deal-value"
                    type="number"
                    value={dealAmount}
                    onChange={e => setDealAmount(Number(e.target.value) || 0)}
                    className="h-10 text-xs"
                  />
                </div>

                <FormSelect
                  label="Initial stage"
                  value={dealStage}
                  onChange={(val) => setDealStage(val as DealStage)}
                  options={STAGE_OPTIONS.map(st => ({ value: st, label: st }))}
                />
              </div>

              <FormSelect
                label="Responsible rep"
                value={rep}
                onChange={setRep}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />
            </div>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-end space-x-2 select-none">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Convert lead
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
