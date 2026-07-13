"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';
import { Lead, Contact, LeadStatus, LeadSource } from '../../types';
import { leadSchema, contactSchema } from '../../validation';
import { toBaseEntityPatch } from '../../lib/entity-payload';

interface CRMEditEntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'Lead' | 'Contact';
  entity: Lead | Contact | undefined;
  onSave: (updatedFields: Partial<Lead> | Partial<Contact>) => void;
}

const SOURCE_OPTIONS: LeadSource[] = ['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership'];

export default function CRMEditEntitySheet({
  open,
  onOpenChange,
  entityType,
  entity,
  onSave,
}: CRMEditEntitySheetProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('Inbound');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [emailOptOut, setEmailOptOut] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [assignedTo, setAssignedTo] = useState('Sarah Jenkins');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entity) {
      setFirstName(entity.firstName || entity.name?.split(' ')[0] || '');
      setLastName(entity.lastName || entity.name?.split(' ').slice(1).join(' ') || '');
      setCompany(entity.company || '');
      setEmail(entity.email || '');
      setPhone(entity.phone || '');
      setSource(entity.source || 'Inbound');
      setPriority(entity.priority || 'Medium');
      setStatus(entityType === 'Lead' ? (entity as Lead).status || 'New' : 'New');
      setCompanyWebsite(entity.companyWebsite || '');
      setFacebook(entity.facebook || '');
      setEmailOptOut(!!entity.emailOptOut);
      setStreet(entity.addressInfo?.street || '');
      setCity(entity.addressInfo?.city || '');
      setState(entity.addressInfo?.state || '');
      setPostalCode(entity.addressInfo?.postalCode || '');
      setCountry(entity.addressInfo?.country || '');
      setAssignedTo(entity.assignedTo || 'Sarah Jenkins');
      setNotes(entity.notes || '');
      setErrors({});
    }
  }, [entity, entityType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidate = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      company,
      email,
      phone,
      source,
      priority,
      assignedTo,
      notes,
      companyWebsite,
      facebook,
      emailOptOut,
      addressStreet: street,
      addressCity: city,
      addressState: state,
      addressPostalCode: postalCode,
      addressCountry: country,
      ...(entityType === 'Lead' ? { status } : {}),
    };

    const schema = entityType === 'Lead' ? leadSchema : contactSchema;
    const parsed = schema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const base = toBaseEntityPatch(parsed.data);
    onSave(entityType === 'Lead' ? { ...base, status } : base);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <SheetTitle className="font-semibold text-foreground text-[15px]">
            Edit {entityType} profile
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-foreground crm-scrollbar" noValidate>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-first-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">First Name *</label>
              <Input id="edit-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} aria-invalid={!!errors.firstName} className="h-10 text-xs" />
              {errors.firstName && <p className="text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-last-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</label>
              <Input id="edit-last-name" value={lastName} onChange={e => setLastName(e.target.value)} aria-invalid={!!errors.lastName} className="h-10 text-xs" />
              {errors.lastName && <p className="text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-company" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Company *</label>
              <Input id="edit-company" value={company} onChange={e => setCompany(e.target.value)} aria-invalid={!!errors.company} className="h-10 text-xs" />
              {errors.company && <p className="text-destructive">{errors.company}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} className="h-10 text-xs" />
              {errors.email && <p className="text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-phone" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
              <Input id="edit-phone" value={phone} onChange={e => setPhone(e.target.value)} aria-invalid={!!errors.phone} className="h-10 text-xs" />
              {errors.phone && <p className="text-destructive">{errors.phone}</p>}
            </div>

            <FormSelect
              label="Source"
              value={source}
              onChange={(val) => setSource(val as LeadSource)}
              options={SOURCE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
            />

            <FormSelect
              label="Priority"
              value={priority}
              onChange={val => setPriority(val as 'Low' | 'Medium' | 'High')}
              options={[
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'Low', label: 'Low Priority' }
              ]}
            />
          </div>

          {entityType === 'Lead' && (
            <FormSelect
              label="Pipeline status"
              value={status}
              onChange={(val) => setStatus(val as LeadStatus)}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Working', label: 'Working' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Nurturing', label: 'Nurturing' },
                { value: 'Unqualified', label: 'Unqualified' }
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-website" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Company website</label>
              <Input id="edit-website" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="e.g. company.com" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-facebook" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Social profile</label>
              <Input id="edit-facebook" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="e.g. facebook.com/username" className="h-10 text-xs" />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1.5 border-t border-border">
            <input
              type="checkbox"
              id="edit-emailOptOut"
              checked={emailOptOut}
              onChange={e => setEmailOptOut(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            />
            <label htmlFor="edit-emailOptOut" className="text-xs font-semibold cursor-pointer select-none">
              Exclude from outbound email campaigns
            </label>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block select-none">
              Address
            </span>

            <div className="space-y-1.5">
              <label htmlFor="edit-street" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Street address</label>
              <Input id="edit-street" value={street} onChange={e => setStreet(e.target.value)} className="h-10 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-city" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                <Input id="edit-city" value={city} onChange={e => setCity(e.target.value)} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-state" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">State / Province</label>
                <Input id="edit-state" value={state} onChange={e => setState(e.target.value)} className="h-10 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-postal" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Zip / Postal code</label>
                <Input id="edit-postal" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-country" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
                <Input id="edit-country" value={country} onChange={e => setCountry(e.target.value)} className="h-10 text-xs" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <FormSelect
              label="Assigned owner"
              value={assignedTo}
              onChange={setAssignedTo}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
            />
            {errors.assignedTo && <p className="text-destructive mt-1">{errors.assignedTo}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-notes" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px] text-xs outline-none" />
            {errors.notes && <p className="text-destructive">{errors.notes}</p>}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end space-x-2 select-none">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Discard changes
            </Button>
            <Button type="submit">
              Save changes
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
