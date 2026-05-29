"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';

interface CRMConvertLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onConvert: (dealPayload: any | null) => void;
}

export default function CRMConvertLeadSheet({
  open,
  onOpenChange,
  lead,
  onConvert,
}: CRMConvertLeadSheetProps) {
  const [createDealChecked, setCreateDealChecked] = useState(true);
  const [dealName, setDealName] = useState('');
  const [dealAmount, setDealAmount] = useState(25000);
  const [dealStage, setDealStage] = useState('Lead In');
  const [rep, setRep] = useState('Sarah Jenkins');

  useEffect(() => {
    if (lead) {
      setDealName(`${lead.company} Deal Proposal`);
      setDealAmount(lead.dealValue || 25000);
      setRep(lead.assignedTo || 'Sarah Jenkins');
    }
  }, [lead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let dealPayload = null;
    if (createDealChecked) {
      if (!dealName.trim()) {
        alert('Please fill out proposal title.');
        return;
      }
      dealPayload = {
        title: dealName,
        value: dealAmount,
        stage: dealStage,
        assignedTo: rep,
      };
    }

    onConvert(dealPayload);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
          <SheetTitle className="font-semibold text-[#111827] text-[15px]">
            Convert Lead to Qualified Account
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
          
          <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-[6px] text-emerald-800 leading-normal mb-2">
            <span className="font-bold block text-[13px] mb-1">Convert "{lead?.name}" of "{lead?.company}"</span>
            This action migrates this lead record to the Unified Contacts Directory and marks the profile status as **Qualified**.
          </div>

          <div className="flex items-center space-x-2 py-1 select-none">
            <input
              type="checkbox"
              id="convert-createDealChecked"
              checked={createDealChecked}
              onChange={e => setCreateDealChecked(e.target.checked)}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
            />
            <label htmlFor="convert-createDealChecked" className="text-xs font-semibold text-[#111827] cursor-pointer">
              Launch a Deal Contract Opportunity simultaneously
            </label>
          </div>

          {createDealChecked && (
            <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Opportunity Proposal Title *
                </label>
                <Input
                  required={createDealChecked}
                  value={dealName}
                  onChange={e => setDealName(e.target.value)}
                  className="h-10 text-xs border-[#CBD5E1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    Contract Valuation ($) *
                  </label>
                  <Input
                    required={createDealChecked}
                    type="number"
                    value={dealAmount}
                    onChange={e => setDealAmount(Number(e.target.value) || 0)}
                    className="h-10 text-xs border-[#CBD5E1]"
                  />
                </div>

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
              </div>

              <FormSelect
                label="Responsible Representative"
                value={rep}
                onChange={setRep}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />

            </div>
          )}

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end space-x-2 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel Conversion
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
            >
              Verify & Convert Lead
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
