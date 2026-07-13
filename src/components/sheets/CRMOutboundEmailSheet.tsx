"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { outboundEmailSchema } from '../../validation';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setBody(initialBody);
      setErrors({});
    }
  }, [open, initialSubject, initialBody]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = outboundEmailSchema.safeParse({ subject, body });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSendEmail(parsed.data.subject, parsed.data.body);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <SheetTitle className="font-semibold text-foreground text-[15px]">
            Compose email
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar" noValidate>

          <div className="space-y-1.5">
            <label htmlFor="email-recipient" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Recipient
            </label>
            <Input id="email-recipient" disabled value={contactEmail || 'No email on file'} className="h-10 text-xs bg-muted cursor-not-allowed font-mono" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email-subject" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Subject *
            </label>
            <Input
              id="email-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Follow-up regarding licensing agreements"
              className="h-10 text-xs"
              aria-invalid={!!errors.subject}
            />
            {errors.subject && <p className="text-destructive">{errors.subject}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email-body" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Message *
            </label>
            <Textarea
              id="email-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              className="min-h-[220px] text-xs outline-none"
              aria-invalid={!!errors.body}
            />
            {errors.body && <p className="text-destructive">{errors.body}</p>}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end space-x-2 select-none">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button type="submit">
              Send email
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
