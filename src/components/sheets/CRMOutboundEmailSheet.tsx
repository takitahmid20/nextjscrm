"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CRMOutboundEmailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactEmail: string;
  initialSubject: string;
  initialBody: string;
  onSendEmail: (subject: string, body: string) => void;
}

export default function CRMOutboundEmailSheet({
  open,
  onOpenChange,
  contactEmail,
  initialSubject,
  initialBody,
  onSendEmail,
}: CRMOutboundEmailSheetProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setBody(initialBody);
    }
  }, [open, initialSubject, initialBody]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      alert('Please compose your email message.');
      return;
    }

    onSendEmail(subject, body);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
          <SheetTitle className="font-semibold text-[#111827] text-[15px]">
            Send Outbound Business Email
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Recipient Email Address
            </label>
            <Input
              disabled
              value={contactEmail || 'No email registered'}
              className="h-10 text-xs border-[#CBD5E1] bg-slate-50 cursor-not-allowed font-semibold font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Subject Line *
            </label>
            <Input
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Follow-up regarding licensing agreements"
              className="h-10 text-xs border-[#CBD5E1]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Message Body *
            </label>
            <Textarea
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              className="min-h-[220px] text-xs border-[#CBD5E1] outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
            >
              Discard Draft
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
            >
              Send Email
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
