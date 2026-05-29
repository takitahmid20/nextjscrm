"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS } from '../../utils';

interface CRMEditEntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'Lead' | 'Contact';
  entity: any;
  onSave: (updatedFields: any) => void;
}

export default function CRMEditEntitySheet({
  open,
  onOpenChange,
  entityType,
  entity,
  onSave,
}: CRMEditEntitySheetProps) {
  // Controlled fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Inbound');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState('New');
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

  // Sourcing list matches central options
  const sourceOptions = ['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership'];

  // Sync state values when sheet opens or entity changes
  useEffect(() => {
    if (entity) {
      setFirstName(entity.firstName || entity.name?.split(' ')[0] || '');
      setLastName(entity.lastName || entity.name?.split(' ').slice(1).join(' ') || '');
      setCompany(entity.company || '');
      setEmail(entity.email || '');
      setPhone(entity.phone || '');
      setSource(entity.source || 'Inbound');
      setPriority(entity.priority || 'Medium');
      setStatus(entity.status || 'New');
      setCompanyWebsite(entity.companyWebsite || entity.website || '');
      setFacebook(entity.facebook || '');
      setEmailOptOut(!!entity.emailOptOut);
      setStreet(entity.addressInfo?.street || '');
      setCity(entity.addressInfo?.city || '');
      setState(entity.addressInfo?.state || '');
      setPostalCode(entity.addressInfo?.postalCode || '');
      setCountry(entity.addressInfo?.country || '');
      setAssignedTo(entity.assignedTo || 'Sarah Jenkins');
      setNotes(entity.notes || '');
    }
  }, [entity, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    
    const payload: any = {
      name: fullName,
      firstName,
      lastName,
      company,
      email,
      phone,
      source,
      priority,
      companyWebsite,
      facebook,
      emailOptOut,
      assignedTo,
      notes,
      addressInfo: {
        street,
        city,
        state,
        postalCode,
        country,
      },
    };

    if (entityType === 'Lead') {
      payload.status = status;
    }

    onSave(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-45">
        <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
          <SheetTitle className="font-semibold text-[#111827] text-[15px]">
            Edit {entityType} Record Profile
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] crm-scrollbar">
          
          <div className="bg-[#EFF6FF] border border-[#2563EB]/15 rounded-[6px] p-3 mb-2 font-mono">
            <span className="font-bold block text-slate-800">Operational entity registry sync status: active</span>
            <span className="text-[10px] text-slate-500">ID: {entity?.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">First Name *</label>
              <Input
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Last Name *</label>
              <Input
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Corporate Account *</label>
              <Input
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Liaison Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Phone Lines</label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>

            <FormSelect
              label="Sourcing Scribe"
              value={source}
              onChange={setSource}
              options={sourceOptions.map(opt => ({ value: opt, label: opt }))}
            />

            <FormSelect
              label="Priority Weight"
              value={priority}
              onChange={val => setPriority(val as any)}
              options={[
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'Low', label: 'Low Routine' }
              ]}
            />
          </div>

          {entityType === 'Lead' && (
            <FormSelect
              label="Operational pipeline status"
              value={status}
              onChange={setStatus}
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
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Corporate Site URL</label>
              <Input
                value={companyWebsite}
                onChange={e => setCompanyWebsite(e.target.value)}
                placeholder="e.g. company.com"
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Social Profile ID</label>
              <Input
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                placeholder="e.g. facebook.com/username"
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1.5 border-t border-slate-50">
            <input
              type="checkbox"
              id="edit-emailOptOut"
              checked={emailOptOut}
              onChange={e => setEmailOptOut(e.target.checked)}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
            />
            <label htmlFor="edit-emailOptOut" className="text-xs font-semibold text-[#111827] cursor-pointer select-none">
              Exclude from Outbound Email Campaigns
            </label>
          </div>

          {/* Location Block */}
          <div className="space-y-3 pt-3 border-t border-slate-150">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block select-none">
              Physical Location Coordinates
            </span>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Street Address</label>
              <Input
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="h-10 text-xs border-[#CBD5E1]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">City</label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="h-10 text-xs border-[#CBD5E1]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">State / Province</label>
                <Input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="h-10 text-xs border-[#CBD5E1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Zip / Postal Code</label>
                <Input
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="h-10 text-xs border-[#CBD5E1]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Country</label>
                <Input
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="h-10 text-xs border-[#CBD5E1]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-150">
            <FormSelect
              label="Assigned Executive Owner"
              value={assignedTo}
              onChange={setAssignedTo}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Internal Context Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[80px] text-xs border-[#CBD5E1] outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end space-x-2 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] cursor-pointer"
            >
              Commit Updates
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
