"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';

interface CRMOpportunityDealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: string;
  assignedTo: string;
  onAddDeal: (deal: any) => void;
}

export default function CRMOpportunityDealSheet({
  open,
  onOpenChange,
  company,
  assignedTo,
  onAddDeal,
}: CRMOpportunityDealSheetProps) {
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(25000);
  const [dealStage, setDealStage] = useState('Lead In');
  const [expectedCloseDate, setExpectedCloseDate] = useState('2026-06-30');
  const [rep, setRep] = useState('Sarah Jenkins');

  useEffect(() => {
    if (open) {
      setDealTitle(`${company} Partnership Deal`);
      setDealValue(25000);
      setDealStage('Lead In');
      setExpectedCloseDate('2026-06-30');
      setRep(assignedTo || 'Sarah Jenkins');
    }
  }, [open, company, assignedTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim()) {
      alert('Please fill out contract opportunity title.');
      return;
    }

    onAddDeal({
      title: dealTitle,
      company,
      value: dealValue,
      stage: dealStage,
      status: 'Open',
      contactPerson: 'Liaison Office',
      email: 'sales@company.com',
      phone: '+1 (555) 000-0000',
      expectedCloseDate,
      assignedTo: rep
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
          <SheetTitle className="font-semibold text-[#111827] text-[15px]">
            Create Deal Contract Opportunity
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Deal Proposal / Contract Title *
            </label>
            <Input
              required
              value={dealTitle}
              onChange={e => setDealTitle(e.target.value)}
              placeholder="e.g. Acme ERP Integration Package"
              className="h-10 text-xs border-[#CBD5E1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Associated Corporate Entity
              </label>
              <Input
                disabled
                value={company}
                className="h-10 text-xs border-[#CBD5E1] bg-slate-50 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Estimated Contract Value ($) *
              </label>
              <Input
                required
                type="number"
                value={dealValue}
                onChange={e => setDealValue(Number(e.target.value) || 0)}
                placeholder="e.g. 15000"
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormSelect
              label="Initial Funnel Stage"
              value={dealStage}
              onChange={setDealStage}
              options={[
                { value: 'Lead In', label: 'Lead In' },
                { value: 'Contact Made', label: 'Contact Made' },
                { value: 'Demo Scheduled', label: 'Demo Scheduled' },
                { value: 'Proposal Sent', label: 'Proposal Sent' },
                { value: 'Negotiation', label: 'Negotiation' }
              ]}
            />
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Expected Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={e => setExpectedCloseDate(e.target.value)}
                className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[6px] text-xs bg-white text-[#374151]"
              />
            </div>

            <FormSelect
              label="Responsible Sales Rep"
              value={rep}
              onChange={setRep}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
            >
              Discard Offer
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
            >
              Create Deal Funnel
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
