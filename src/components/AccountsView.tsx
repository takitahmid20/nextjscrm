/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Sparkles, Globe2, Building2, MapPin, Loader2 } from 'lucide-react';
import { Account } from '../types';
import { CRM_USERS, formatRelativeTime } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, AccountFormValues } from '../validation';
import { FormInput, FormSelect, FormTextarea } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';

interface AccountsViewProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAccount: (id: string, fields: Partial<Account>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  globalSearch: string;
}

const DEFAULT_FORM_VALUES: AccountFormValues = {
  name: '',
  industry: '',
  website: '',
  phone: '',
  description: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPostalCode: '',
  addressCountry: '',
  assignedTo: '',
};

export default function AccountsView({
  accounts,
  onAddAccount,
  onDeleteAccount,
  globalSearch,
}: Omit<AccountsViewProps, 'onUpdateAccount'>) {
  const { currentUser, loading } = useCRM();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Navigation & page sizing
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Local filters
  const [localSearch, setLocalSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');

  // Add Account sheet
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: { ...DEFAULT_FORM_VALUES, assignedTo: currentUser?.name || '' },
  });

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    const activeSearch = (localSearch || globalSearch).toLowerCase().trim();
    if (activeSearch) {
      result = result.filter((account) =>
        account.name.toLowerCase().includes(activeSearch) ||
        (account.industry || '').toLowerCase().includes(activeSearch) ||
        (account.website || '').toLowerCase().includes(activeSearch) ||
        account.assignedTo.toLowerCase().includes(activeSearch)
      );
    }

    if (ownerFilter !== 'All') {
      result = result.filter((account) => account.assignedTo === ownerFilter);
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [accounts, localSearch, globalSearch, ownerFilter]);

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAccounts, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / rowsPerPage) || 1;

  const handleCreateAccountSubmit = async (values: AccountFormValues) => {
    const payload: Omit<Account, 'id' | 'createdAt'> = {
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
    };

    await onAddAccount(payload);
    reset({ ...DEFAULT_FORM_VALUES, assignedTo: currentUser?.name || '' });
    setShowAddModal(false);
  };

  const handleDeleteAccount = async (account: Account) => {
    if (account.isVirtual) {
      showToast('This is a virtual account derived from existing records — there is nothing real to delete yet.', 'info');
      return;
    }
    if (await confirm({
      description: `Do you want to permanently delete the account "${account.name}"?`,
      destructive: true,
      confirmLabel: 'Delete',
    })) {
      await onDeleteAccount(account.id);
    }
  };

  const tableHeaders: UnifiedTableHeader[] = [
    { key: 'name', label: 'Account Name', className: 'min-w-[220px]' },
    { key: 'industry', label: 'Industry' },
    { key: 'website', label: 'Website' },
    { key: 'assignedTo', label: 'Assigned Owner' },
    { key: 'type', label: 'Record Type' },
    { key: 'actions', className: 'text-center', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Company-level records rolled up from leads, contacts, and deals across your pipeline.
          </p>
        </div>

        <div id="accounts-action-toolbar" className="flex items-center space-x-2.5">
          <Button
            id="btn-create-account-modal"
            onClick={() => {
              reset({ ...DEFAULT_FORM_VALUES, assignedTo: currentUser?.name || '' });
              setShowAddModal(true);
            }}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-card border border-border rounded-[8px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="accounts-toolbar-search" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Directory Filter Search
            </label>
            <Input
              id="accounts-toolbar-search"
              type="text"
              placeholder="Search by name, industry, website..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-card border border-border text-foreground text-xs rounded-[6px] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label htmlFor="accounts-owner-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Assigned Owner
            </label>
            <FormSelect
              id="accounts-owner-filter"
              value={ownerFilter}
              onChange={(val) => {
                setOwnerFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All', label: 'All Owners' },
                ...CRM_USERS.map((u) => ({ value: u.name, label: u.name })),
              ]}
              placeholder="All Owners"
            />
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <UnifiedTable
        id="accounts-directory-table"
        data={paginatedAccounts}
        headers={tableHeaders}
        hideScrollbar={true}
        loading={loading && accounts.length === 0}
        emptyStateText="No accounts matched this query. Try widening filtering parameters."
        pagination={{
          currentPage,
          totalPages,
          totalRecords: filteredAccounts.length,
          rowsPerPage,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: setRowsPerPage,
          recordTypeLabel: 'accounts',
        }}
        renderRow={(account) => (
          <tr key={account.id} className="group h-[52px] border-b border-border hover:bg-muted/50 transition-colors">
            <td className="py-2.5 px-4 min-w-[220px]">
              <div className="flex flex-col">
                <a
                  href={`/account-details/${account.id}`}
                  className="font-semibold text-primary hover:text-primary/90 hover:underline text-[13px] text-left cursor-pointer flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {account.name}
                </a>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">{account.id}</span>
              </div>
            </td>
            <td className="py-2.5 px-4 text-foreground">{account.industry || '—'}</td>
            <td className="py-2.5 px-4 text-muted-foreground">
              {account.website ? (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <Globe2 className="h-3.5 w-3.5 flex-shrink-0" />
                  {account.website}
                </span>
              ) : (
                '—'
              )}
            </td>
            <td className="py-2.5 px-4 text-foreground">
              <span className="font-medium text-[12px]">{account.assignedTo || '—'}</span>
            </td>
            <td className="py-2.5 px-4">
              {account.isVirtual ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 rounded-[4px] text-[11px] font-medium">
                  <Sparkles className="h-3 w-3" />
                  Virtual
                </span>
              ) : (
                <span className="px-2 py-0.5 border bg-muted text-foreground border-border rounded-[4px] text-[11px] font-medium">
                  Account
                </span>
              )}
            </td>
            <td className="py-2.5 px-4 text-center">
              <Button
                type="button"
                variant="ghost"
                aria-label={`Delete ${account.name}`}
                title={account.isVirtual ? 'Virtual accounts have no real record to delete yet.' : 'Delete account'}
                onClick={() => handleDeleteAccount(account)}
                className={`h-8 w-8 p-0 rounded-full flex items-center justify-center cursor-pointer mx-auto ${
                  account.isVirtual
                    ? 'text-muted-foreground/50 hover:bg-muted'
                    : 'text-destructive hover:bg-destructive/10'
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        )}
      />

      {/* SIDE PANEL: ADD NEW ACCOUNT */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">Create Account Record</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(handleCreateAccountSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Company name"
                register={register('name')}
                error={errors.name?.message}
                required
                placeholder="e.g. Stark Industries"
              />
              <FormInput
                label="Industry"
                register={register('industry')}
                error={errors.industry?.message}
                placeholder="e.g. Manufacturing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Website"
                register={register('website')}
                error={errors.website?.message}
                placeholder="e.g. https://stark.com"
              />
              <FormInput
                label="Phone number"
                register={register('phone')}
                error={errors.phone?.message}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <FormTextarea
              label="Description"
              register={register('description')}
              error={errors.description?.message}
              placeholder="Brief overview of this account..."
              rows={3}
            />

            <div className="border border-border rounded-[8px] p-4 bg-muted">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center select-none">
                <MapPin className="h-4 w-4 mr-1.5 text-slate-500" />
                Billing Address
              </h4>

              <div className="space-y-3">
                <FormInput
                  label="Street address"
                  register={register('addressStreet')}
                  error={errors.addressStreet?.message}
                  placeholder="e.g. 10880 Malibu Point"
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="City"
                    register={register('addressCity')}
                    error={errors.addressCity?.message}
                    placeholder="e.g. Malibu"
                  />
                  <FormInput
                    label="State / Province"
                    register={register('addressState')}
                    error={errors.addressState?.message}
                    placeholder="e.g. California"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Postal Code"
                    register={register('addressPostalCode')}
                    error={errors.addressPostalCode?.message}
                    placeholder="e.g. 90265"
                  />
                  <FormInput
                    label="Country"
                    register={register('addressCountry')}
                    error={errors.addressCountry?.message}
                    placeholder="e.g. United States"
                  />
                </div>
              </div>
            </div>

            <FormSelect
              label="Assigned Owner"
              register={register('assignedTo')}
              error={errors.assignedTo?.message}
              options={CRM_USERS.map((u) => ({ value: u.name, label: u.name }))}
              placeholder="Select an owner..."
            />

            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset({ ...DEFAULT_FORM_VALUES, assignedTo: currentUser?.name || '' });
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                id="btn-account-form-submit"
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create account
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Re-exported so consumers can format an account's relative creation time
// without importing utils directly in every call site.
export function formatAccountCreatedAt(createdAt: string): string {
  return formatRelativeTime(createdAt);
}
