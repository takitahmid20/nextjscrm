/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Globe2,
  Phone,
  MapPin,
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
  Trophy,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Account } from '../types';
import { CRM_USERS, formatUSD } from '../utils';
import { accountsApi, AccountRollupResult } from '../lib/api/accounts';
import { ApiError } from '../lib/api/http';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormInput, FormSelect, FormTextarea } from './forms/FormControls';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, AccountFormValues } from '../validation';

interface AccountDetailsViewProps {
  accountId: string;
  onUpdateAccount: (id: string, fields: Partial<Account>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onBack: () => void;
}

export default function AccountDetailsView({ accountId, onUpdateAccount, onDeleteAccount, onBack }: AccountDetailsViewProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [rollup, setRollup] = useState<AccountRollupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
  });

  const loadRollup = () => {
    setLoading(true);
    setNotFound(false);
    accountsApi
      .rollup(accountId)
      .then((result) => setRollup(result))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          showToast(error instanceof ApiError ? error.message : 'Could not load account.', 'error');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRollup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const openEditSheet = () => {
    if (!rollup) return;
    const { account } = rollup;
    reset({
      name: account.name,
      industry: account.industry || '',
      website: account.website || '',
      phone: account.phone || '',
      description: account.description || '',
      addressStreet: account.billingAddress?.street || '',
      addressCity: account.billingAddress?.city || '',
      addressState: account.billingAddress?.state || '',
      addressPostalCode: account.billingAddress?.postalCode || '',
      addressCountry: account.billingAddress?.country || '',
      assignedTo: account.assignedTo || '',
    });
    setShowEditSheet(true);
  };

  const handleEditSubmit = async (values: AccountFormValues) => {
    await onUpdateAccount(accountId, {
      name: values.name,
      industry: values.industry || undefined,
      website: values.website || undefined,
      phone: values.phone || undefined,
      description: values.description || undefined,
      billingAddress: {
        street: values.addressStreet || undefined,
        city: values.addressCity || undefined,
        state: values.addressState || undefined,
        postalCode: values.addressPostalCode || undefined,
        country: values.addressCountry || undefined,
      },
      assignedTo: values.assignedTo,
    });
    setShowEditSheet(false);
    showToast('Account saved.', 'success');
    // A virtual account gets a brand-new real id once promoted server-side —
    // refetch by the same name-derived rollup so we pick up the new id/state.
    loadRollup();
  };

  const handleDelete = async () => {
    if (!rollup) return;
    if (rollup.account.isVirtual) {
      showToast('This is a virtual account derived from existing records — there is nothing real to delete yet.', 'info');
      return;
    }
    if (
      await confirm({
        description: `Do you want to permanently delete the account "${rollup.account.name}"? This does not delete its related leads, contacts, or deals.`,
        destructive: true,
        confirmLabel: 'Delete',
      })
    ) {
      await onDeleteAccount(rollup.account.id);
      showToast('Account removed.', 'success');
      onBack();
    }
  };

  if (loading) {
    return (
      <div id="account-loading" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground">Loading account record…</p>
      </div>
    );
  }

  if (notFound || !rollup) {
    return (
      <div id="account-not-found" className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Account Record Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">This account may have been purged or relocated.</p>
        <Button onClick={onBack} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  const { account, leads, contacts, deals, leadCount, contactCount, dealCount, openPipelineValue, wonValue } = rollup;
  const address = account.billingAddress;
  const hasAddress = address && (address.street || address.city || address.state || address.postalCode || address.country);

  return (
    <div id="account-details-viewport" className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 pb-2">
        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Back to accounts"
            className="p-2 cursor-pointer bg-card hover:bg-muted text-foreground rounded-md border border-border transition-colors flex items-center justify-center shadow-xs h-9 w-9"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{account.name}</h1>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                {account.id}
              </span>
              {account.isVirtual && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 rounded-[4px] text-[11px] font-medium">
                  <Sparkles className="h-3 w-3" />
                  Virtual
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{account.industry || 'No industry set'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={openEditSheet}
            variant="outline"
            className="h-9 px-3.5 border border-border text-xs font-semibold text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            {account.isVirtual ? 'Create record' : 'Edit'}
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            variant="outline"
            className="h-9 px-3.5 border border-border text-xs font-semibold text-destructive bg-card rounded-[6px] hover:bg-destructive/10 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: 'Leads', value: leadCount },
          { icon: <UserCheck className="h-4 w-4" />, label: 'Contacts', value: contactCount },
          { icon: <Briefcase className="h-4 w-4" />, label: 'Deals', value: dealCount },
          { icon: <DollarSign className="h-4 w-4" />, label: 'Open Pipeline', value: formatUSD(openPipelineValue) },
          { icon: <Trophy className="h-4 w-4" />, label: 'Won Value', value: formatUSD(wonValue) },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-[8px] p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              {stat.icon}
              <span className="text-[11px] uppercase tracking-wider font-semibold">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Overview + related records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Overview</h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <Globe2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{account.website || 'No website on file'}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{account.phone || 'No phone on file'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">
                  {hasAddress
                    ? [address?.street, address?.city, address?.state, address?.postalCode, address?.country].filter(Boolean).join(', ')
                    : 'No address on file'}
                </span>
              </div>
            </dl>
            {account.description && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">{account.description}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
              Owner: <span className="text-foreground font-medium">{account.assignedTo || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">Leads ({leadCount})</h3>
            {leads.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-4">No leads linked to this account yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {leads.map((lead) => (
                  <li key={lead.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <a href={`/lead-details/${lead.id}`} className="font-medium text-primary hover:underline">{lead.name}</a>
                    <span className="text-muted-foreground">{lead.status} · {formatUSD(lead.dealValue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">Contacts ({contactCount})</h3>
            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-4">No contacts linked to this account yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <a href={`/contact-details/${contact.id}`} className="font-medium text-primary hover:underline">{contact.name}</a>
                    <span className="text-muted-foreground">{contact.priority || 'Medium'} priority</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground px-4 py-3 border-b border-border">Deals ({dealCount})</h3>
            {deals.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-4">No deals linked to this account yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {deals.map((deal) => (
                  <li key={deal.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <a href={`/deal-details/${deal.id}`} className="font-medium text-primary hover:underline">{deal.title}</a>
                    <span className="text-muted-foreground">{deal.stage} · {formatUSD(deal.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Edit / promote sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">
              {account.isVirtual ? 'Create Account Record' : 'Edit Account'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleEditSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Company name" register={register('name')} error={errors.name?.message} required />
              <FormInput label="Industry" register={register('industry')} error={errors.industry?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Website" register={register('website')} error={errors.website?.message} />
              <FormInput label="Phone number" register={register('phone')} error={errors.phone?.message} />
            </div>
            <FormTextarea label="Description" register={register('description')} error={errors.description?.message} rows={3} />

            <div className="border border-border rounded-[8px] p-4 bg-muted">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Billing Address</h4>
              <div className="space-y-3">
                <FormInput label="Street address" register={register('addressStreet')} error={errors.addressStreet?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="City" register={register('addressCity')} error={errors.addressCity?.message} />
                  <FormInput label="State / Province" register={register('addressState')} error={errors.addressState?.message} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Postal Code" register={register('addressPostalCode')} error={errors.addressPostalCode?.message} />
                  <FormInput label="Country" register={register('addressCountry')} error={errors.addressCountry?.message} />
                </div>
              </div>
            </div>

            <FormSelect
              label="Assigned Owner"
              register={register('assignedTo')}
              error={errors.assignedTo?.message}
              options={CRM_USERS.map((u) => ({ value: u.name, label: u.name }))}
            />

            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditSheet(false)} className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer disabled:opacity-60">
                Save
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
