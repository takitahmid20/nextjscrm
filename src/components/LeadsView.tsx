/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  X,
  FileCheck,
  CheckCircle,
  MoreVertical,
  SlidersHorizontal,
  FolderSync,
  MapPin,
  MessageSquare,
  CalendarDays,
  UserCog,
  Edit2,
  Mail,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime, exportLeadsToCSV, parseCSVToLeads, computeLeadScore, leadScoreTier } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, LeadFormValues } from '../validation';
import { FormInput, FormSelect, FormTextarea, FormCheckbox, FormDatePicker } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';

interface LeadImportResult {
  importedCount: number;
  errors: { row: number; message: string }[];
}

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => void;
  onUpdateLead: (id: string, updated: Partial<Lead>) => void;
  onDeleteLeads: (ids: string[]) => void;
  onImportLeads: (imported: Partial<Lead>[]) => Promise<LeadImportResult>;
  globalSearch: string;
}

export default function LeadsView({ 
  leads, 
  onAddLead, 
  onUpdateLead, 
  onDeleteLeads,
  onImportLeads,
  globalSearch 
}: LeadsViewProps) {
  const { addTask, currentUser } = useCRM();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Navigation & Page sizes
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Row actions modals / sub-sheets
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [activeActionLead, setActiveActionLead] = useState<Lead | null>(null);
  const [activeActionType, setActiveActionType] = useState<'notes' | 'followup' | 'meeting' | 'assignee' | 'email' | null>(null);

  // Row action forms values
  const [noteContent, setNoteContent] = useState('');
  const [followupTitle, setFollowupTitle] = useState('');
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().slice(0, 10));
  const [followupPriority, setFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');



  // Sorting
  const [sortField, setSortField] = useState<'name' | 'company' | 'dealValue' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-Filter Dropdowns
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [userFilter, setUserFilter] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState('');

  // Row Selections
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Interactive Modal Overlays
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Lead | null>(null);

  // Deal value isn't part of leadSchema (which is shared with the Contact
  // edit sheet), so it's tracked as its own field rather than folded into
  // react-hook-form — keeps this form honest about a real value instead of
  // the random placeholder this used to silently generate.
  const [dealValueInput, setDealValueInput] = useState(0);
  const [dealValueError, setDealValueError] = useState('');

  // Hook Form for enterprise lead creation validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'New',
      source: 'Website',
      assignedTo: currentUser?.name || 'Unassigned',
      notes: '',
      companyWebsite: '',
      facebook: '',
      emailOptOut: false,
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressPostalCode: '',
      addressCountry: '',
      priority: 'Medium',
    },
  });

  const [csvContent, setCsvContent] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importRowErrors, setImportRowErrors] = useState<{ row: number; message: string }[]>([]);

  // Clear selections helper
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map(lead => lead.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(prev => prev.filter(selId => selId !== id));
    } else {
      setSelectedLeadIds(prev => [...prev, id]);
    }
  };

  // Status lists
  const statusOptions: LeadStatus[] = ['New', 'Contacted', 'Working', 'Qualified', 'Nurturing', 'Unqualified'];
  const sourceOptions: LeadSource[] = ['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership'];

  // Sorting and filtering leads logic
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Combine global search from top navbar and local search
    const activeSearch = (localSearch || globalSearch).toLowerCase().trim();
    if (activeSearch) {
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(activeSearch) ||
        lead.company.toLowerCase().includes(activeSearch) ||
        lead.email.toLowerCase().includes(activeSearch) ||
        lead.phone.toLowerCase().includes(activeSearch) ||
        lead.id.toLowerCase().includes(activeSearch)
      );
    }

    // Dropdown filters
    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }
    if (sourceFilter !== 'All') {
      result = result.filter(l => l.source === sourceFilter);
    }
    if (userFilter !== 'All') {
      result = result.filter(l => l.assignedTo === userFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, globalSearch, localSearch, statusFilter, sourceFilter, userFilter, sortField, sortOrder]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLeads.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLeads, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (await confirm({
      description: `Do you want to permanently delete these ${selectedLeadIds.length} leads from operations?`,
      destructive: true,
      confirmLabel: 'Delete',
    })) {
      onDeleteLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    }
  };

  const handleBulkStatusChange = (status: LeadStatus) => {
    selectedLeadIds.forEach(id => {
      onUpdateLead(id, { status, lastActivity: new Date().toISOString() });
    });
    showToast(`Bulk operations executed. Updated ${selectedLeadIds.length} records.`, 'success');
    setSelectedLeadIds([]);
  };

  const handleBulkAssign = (userName: string) => {
    selectedLeadIds.forEach(id => {
      onUpdateLead(id, { assignedTo: userName, lastActivity: new Date().toISOString() });
    });
    showToast(`Bulk assignment executed. ${selectedLeadIds.length} leads assigned to ${userName}.`, 'success');
    setSelectedLeadIds([]);
  };

  // Submit new lead form via React Hook Form schema validation
  const handleCreateLeadSubmit = async (values: LeadFormValues) => {
    if (dealValueInput < 0) {
      setDealValueError('Deal value cannot be negative.');
      return;
    }
    setDealValueError('');

    const computedName = `${values.firstName} ${values.lastName}`;
    const payload = {
      name: computedName,
      firstName: values.firstName,
      lastName: values.lastName,
      company: values.company,
      email: values.email || 'info@' + values.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
      phone: values.phone || '+1 (555) 000-0000',
      status: values.status,
      source: values.source,
      assignedTo: values.assignedTo,
      notes: values.notes,
      companyWebsite: values.companyWebsite,
      facebook: values.facebook,
      emailOptOut: values.emailOptOut,
      addressInfo: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        postalCode: values.addressPostalCode,
        country: values.addressCountry,
      },
      priority: values.priority || 'Medium',
      dealValue: dealValueInput,
    };

    if (editingLeadId) {
      await onUpdateLead(editingLeadId, {
        ...payload,
        lastActivity: `Lead details updated via unified form`
      });
      showToast(`Lead details for "${computedName}" updated successfully.`, 'success');
    } else {
      const duplicate = values.email && leads.find(l => l.email.toLowerCase() === values.email.toLowerCase());
      if (duplicate) {
        showToast(`Heads up: "${duplicate.name}" already uses this email address.`, 'info');
      }
      await onAddLead(payload);
      showToast(`New lead "${computedName}" created successfully.`, 'success');
    }

    // Reset Form & Close
    reset();
    setEditingLeadId(null);
    setShowAddModal(false);
  };

  // Export CSV action
  const handleExportCSV = () => {
    const csvStr = exportLeadsToCSV(leads);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `centric_crm_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    if (!csvContent.trim()) {
      setCsvError('Please paste or load CSV text content.');
      setImportRowErrors([]);
      return;
    }
    try {
      const parsed = parseCSVToLeads(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid leads parsed. Verify headings structure.');
        setImportRowErrors([]);
        return;
      }
      setCsvError('');
      const result = await onImportLeads(parsed);
      setImportRowErrors(result.errors);
      if (result.errors.length === 0) {
        setShowImportModal(false);
        setCsvContent('');
      } else {
        setCsvError(`${result.importedCount} row(s) imported, ${result.errors.length} row(s) failed:`);
      }
    } catch (e: any) {
      setCsvError('Failed parsing CSV lines. Code: ' + e?.message);
      setImportRowErrors([]);
    }
  };

  // Headers for UnifiedTable
  const tableHeaders: UnifiedTableHeader[] = [
    {
      key: 'select',
      className: 'w-12 text-center sticky left-0 bg-muted z-20 shadow-[1px_0_0_var(--border)] border-r border-border',
      label: (
        <input
          type="checkbox"
          aria-label="Select all leads on this page"
          checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
          onChange={handleToggleSelectAll}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      className: 'sticky left-12 bg-muted z-20 border-r border-border shadow-[1px_0_0_var(--border)] min-w-[200px]',
      label: (
        <div className="flex items-center space-x-1 select-none">
          <span>Lead Name & ID</span>
          {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />)}
        </div>
      ),
      onClick: () => {
        setSortField('name');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1);
      }
    },
    {
      key: 'company',
      label: (
        <div className="flex items-center space-x-1 select-none">
          <span>Company / Domain</span>
          {sortField === 'company' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />)}
        </div>
      ),
      onClick: () => {
        setSortField('company');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1);
      }
    },
    { key: 'contactInfo', label: 'Contact Info (Email/Phone)' },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score' },
    { key: 'source', label: 'Acquisition' },
    { key: 'assignedTo', label: 'Assigned Manager' },
    {
      key: 'dealValue',
      className: 'text-right',
      label: (
        <div className="flex items-center justify-end space-x-1 select-none">
          <span>Deal Value</span>
          {sortField === 'dealValue' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />)}
        </div>
      ),
      onClick: () => {
        setSortField('dealValue');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1);
      }
    },
    { key: 'actions', className: 'text-center sticky right-0 bg-muted z-20 border-l border-border', label: 'Actions' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Leads & Account Entities</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive operational customer directory. Sort, batch, and filter pipelines.
          </p>
        </div>
        
        {/* Actions Button Bar */}
        <div id="leads-action-toolbar" className="flex items-center space-x-2.5">
          <Button
            id="btn-import-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Import CSV
          </Button>
          
          <Button
            id="btn-export-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Data
          </Button>

          <Button
            id="btn-create-lead-modal"
            onClick={() => {
              setEditingLeadId(null);
              reset({
                firstName: '',
                lastName: '',
                name: '',
                company: '',
                email: '',
                phone: '',
                status: 'New',
                source: 'Website',
                assignedTo: currentUser?.name || 'Unassigned',
                notes: '',
                companyWebsite: '',
                facebook: '',
                emailOptOut: false,
                addressStreet: '',
                addressCity: '',
                addressState: '',
                addressPostalCode: '',
                addressCountry: '',
                priority: 'Medium',
              });
              setDealValueInput(0);
              setDealValueError('');
              setShowAddModal(true);
            }}
            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Leads Table Management Toolbar Box - Filters & Sorting */}
      <Card className="bg-card border border-border rounded-[8px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search bar inside toolbar to lock workspace search */}
          <div>
            <label htmlFor="leads-toolbar-search" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Directory Filter Search
            </label>
            <Input
              id="leads-toolbar-search"
              type="text"
              placeholder="Search by name, company..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-card border border-border text-foreground text-xs rounded-[6px] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Filter Status */}
          <div>
            <label htmlFor="leads-status-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Operational Status
            </label>
            <FormSelect
              id="leads-status-filter"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All', label: 'All Lead Statuses' },
                ...statusOptions.map(opt => ({ value: opt, label: opt }))
              ]}
              placeholder="All Lead Statuses"
            />
          </div>

          {/* Filter Lead Source */}
          <div>
            <label htmlFor="leads-source-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Acquisition Sourcing
            </label>
            <FormSelect
              id="leads-source-filter"
              value={sourceFilter}
              onChange={(val) => {
                setSourceFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All', label: 'All Sourcing Channels' },
                ...sourceOptions.map(opt => ({ value: opt, label: opt }))
              ]}
              placeholder="All Sourcing Channels"
            />
          </div>

          {/* Filter Assigned Representative */}
          <div>
            <label htmlFor="leads-user-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Assigned Representative
            </label>
            <FormSelect
              id="leads-user-filter"
              value={userFilter}
              onChange={(val) => {
                setUserFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All', label: 'All Sales Reps' },
                ...CRM_USERS.map(u => ({ value: u.name, label: u.name }))
              ]}
              placeholder="All Sales Reps"
            />
          </div>

        </div>
      </Card>

      {/* Enterprise-grade Leads Table */}
      <UnifiedTable
        id="leads-directory-table"
        data={paginatedLeads}
        headers={tableHeaders}
        hideScrollbar={true}
        emptyStateText="No corporate leads matched this query. Try widening filtering parameters."
        pagination={{
          currentPage,
          totalPages,
          totalRecords: filteredLeads.length,
          rowsPerPage,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: setRowsPerPage,
          recordTypeLabel: 'leads'
        }}
        renderRow={(lead) => {
          const isChecked = selectedLeadIds.includes(lead.id);
          
          // Clean status highlights
          let statusBg = 'bg-muted text-foreground border-border';
          if (lead.status === 'Qualified') statusBg = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
          else if (lead.status === 'Working' || lead.status === 'Contacted') statusBg = 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-100 dark:border-blue-800';
          else if (lead.status === 'Nurturing') statusBg = 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800';
          else if (lead.status === 'Unqualified') statusBg = 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-100 dark:border-red-800';

          return (
            <tr 
              key={lead.id}
              className={`group h-[52px] border-b border-border transition-colors ${
                isChecked ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox column */}
              <td className={`py-2.5 px-4 text-center sticky left-0 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-r border-border`}>
                <input
                  type="checkbox"
                  aria-label={`Select ${lead.name}`}
                  checked={isChecked}
                  onChange={() => handleToggleSelectRow(lead.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
              </td>

              {/* Lead Name & ID */}
              <td className={`py-2.5 px-4 sticky left-12 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-r border-border min-w-[200px]`}>
                <div className="flex flex-col">
                  <a 
                    href={`/lead-details/${lead.id}`}
                    className="font-semibold text-primary hover:text-primary/90 hover:underline text-[13px] text-left cursor-pointer"
                  >
                    {lead.name}
                  </a>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">{lead.id}</span>
                </div>
              </td>

              {/* Company Name */}
              <td className="py-2.5 px-4 font-medium text-foreground">
                {lead.company}
              </td>

              {/* Contact details */}
              <td className="py-2.5 px-4">
                <div className="flex flex-col text-muted-foreground">
                  <span className="truncate max-w-[160px]">{lead.email}</span>
                  <span className="text-[11px]">{lead.phone}</span>
                </div>
              </td>

              {/* Status badge */}
              <td className="py-2.5 px-4">
                <span className={`px-2 py-0.5 border rounded-[4px] text-[11px] font-medium ${statusBg}`}>
                  {lead.status}
                </span>
              </td>

              {/* Lead score */}
              <td className="py-2.5 px-4">
                {(() => {
                  const score = computeLeadScore(lead);
                  const tier = leadScoreTier(score);
                  const tierClass =
                    tier === 'Hot'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : tier === 'Warm'
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                      : 'bg-muted text-muted-foreground border-border';
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-[4px] text-[11px] font-semibold font-mono ${tierClass}`} title={`${tier} lead — score ${score}/100`}>
                      {score}
                    </span>
                  );
                })()}
              </td>

              {/* Sourcing Channel */}
              <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                {lead.source}
              </td>

              {/* Assigned Representative */}
              <td className="py-2.5 px-4 text-foreground">
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-[12px]">{lead.assignedTo}</span>
                </div>
              </td>

              {/* Value mapping */}
              <td className="py-2.5 px-4 text-right font-semibold text-foreground">
                {formatUSD(lead.dealValue)}
              </td>

              {/* Row actions */}
              <td className={`py-2.5 px-4 text-center sticky right-0 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-l border-border`}>
                <div className="flex items-center justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id={`leads-popover-trigger-${lead.id}`}
                        variant="ghost"
                        aria-label={`Row actions for ${lead.name}`}
                        className="h-8 w-8 p-0 hover:bg-muted rounded-full flex items-center justify-center cursor-pointer"
                      >
                        <MoreVertical className="h-4.5 w-4.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1 bg-card border border-border shadow-lg rounded-md z-40" align="end">
                      <div className="flex flex-col text-xs font-medium">
                        <a
                          href={`/lead-details/${lead.id}`}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>View Details</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionLead(lead);
                            setActiveActionType('notes');
                            setNoteContent('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Add Note</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionLead(lead);
                            setActiveActionType('followup');
                            setFollowupTitle(`Follow-up with ${lead.name}`);
                            setFollowupDate(new Date().toISOString().slice(0, 10));
                            setFollowupPriority('Medium');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                          <span>Followups</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionLead(lead);
                            setActiveActionType('meeting');
                            setMeetingTitle(`Meeting with ${lead.name}`);
                            setMeetingDate(new Date().toISOString().slice(0, 10));
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-green-500" />
                          <span>Set Meeting</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionLead(lead);
                            setActiveActionType('assignee');
                            setSelectedAssignee(lead.assignedTo);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <UserCog className="h-3.5 w-3.5 text-cyan-500" />
                          <span>Change Assignee</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingLeadId(lead.id);
                            reset({
                              firstName: lead.firstName || lead.name.split(' ')[0] || '',
                              lastName: lead.lastName || lead.name.split(' ').slice(1).join(' ') || '',
                              name: lead.name,
                              company: lead.company,
                              email: lead.email,
                              phone: lead.phone,
                              status: lead.status,
                              source: lead.source,
                              assignedTo: lead.assignedTo,
                              notes: lead.notes || '',
                              companyWebsite: lead.companyWebsite || '',
                              facebook: lead.facebook || '',
                              emailOptOut: lead.emailOptOut || false,
                              addressStreet: lead.addressInfo?.street || '',
                              addressCity: lead.addressInfo?.city || '',
                              addressState: lead.addressInfo?.state || '',
                              addressPostalCode: lead.addressInfo?.postalCode || '',
                              addressCountry: lead.addressInfo?.country || '',
                              priority: lead.priority || 'Medium',
                            });
                            setDealValueInput(lead.dealValue || 0);
                            setDealValueError('');
                            setShowAddModal(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-purple-500" />
                          <span>Edit Lead</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionLead(lead);
                            setActiveActionType('email');
                            setEmailSubject(`Followup: Core CRM context for ${lead.company}`);
                            setEmailBody(`Hi ${lead.name},\n\nI wanted to reach out regarding our solution proposal...\n\nBest regards,\n${currentUser?.name || 'Unassigned'}`);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <Mail className="h-3.5 w-3.5 text-sky-500" />
                          <span>Send Email</span>
                        </button>

                        <div className="border-t border-border my-1"></div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm({
                              description: `Are you sure you want to delete lead ${lead.name}?`,
                              destructive: true,
                              confirmLabel: 'Delete',
                            })) {
                              onDeleteLeads([lead.id]);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors rounded flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>Delete Lead</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* SIDE PANEL: ADD NEW CORPORATE LEAD */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">
              {editingLeadId ? 'Update Lead Account Record' : 'Create Lead Account Record'}
            </SheetTitle>
          </SheetHeader>

          {/* Form */}
          <form onSubmit={handleSubmit(handleCreateLeadSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First name"
                register={register('firstName')}
                error={errors.firstName?.message}
                required
                placeholder="e.g. Robert"
              />

              <FormInput
                label="Last name"
                register={register('lastName')}
                error={errors.lastName?.message}
                required
                placeholder="e.g. Downey"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Company name"
                register={register('company')}
                error={errors.company?.message}
                required
                placeholder="e.g. Stark Industries"
              />

              <FormInput
                label="Company website"
                register={register('companyWebsite')}
                error={errors.companyWebsite?.message}
                placeholder="e.g. https://apextech.io"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Email address"
                register={register('email')}
                error={errors.email?.message}
                placeholder="bruce@stark.com"
                type="email"
              />

              <FormInput
                label="Phone number"
                register={register('phone')}
                error={errors.phone?.message}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <FormInput
                label="Facebook Profile URL"
                register={register('facebook')}
                error={errors.facebook?.message}
                placeholder="e.g. https://facebook.com/robert"
              />

              <div className="pt-5 select-none">
                <FormCheckbox
                  label="Email Opt Out"
                  register={register('emailOptOut')}
                  error={errors.emailOptOut?.message}
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border border-border rounded-[8px] p-4 bg-muted">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center select-none">
                <MapPin className="h-4 w-4 mr-1.5 text-slate-500" />
                Address Information
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FormSelect
                label="Status"
                register={register('status')}
                error={errors.status?.message}
                options={statusOptions.map(opt => ({ value: opt, label: opt }))}
              />

              <FormSelect
                label="Source Channel"
                register={register('source')}
                error={errors.source?.message}
                options={sourceOptions.map(opt => ({ value: opt, label: opt }))}
              />

              <FormSelect
                label="Account Handler"
                register={register('assignedTo')}
                error={errors.assignedTo?.message}
                options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              />

              <FormSelect
                label="Priority"
                register={register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
              />

              <div className="flex flex-col space-y-1.5 w-full">
                <label htmlFor="lead-deal-value" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  Estimated Deal Value ($)
                </label>
                <input
                  id="lead-deal-value"
                  type="number"
                  min={0}
                  value={dealValueInput}
                  onChange={(e) => setDealValueInput(Math.max(0, Number(e.target.value) || 0))}
                  aria-invalid={!!dealValueError}
                  aria-describedby={dealValueError ? 'lead-deal-value-error' : undefined}
                  className="h-9 px-3 bg-background border border-border rounded-md text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {dealValueError && <p id="lead-deal-value-error" role="alert" className="text-[11px] text-destructive font-medium">{dealValueError}</p>}
              </div>
            </div>

            <FormTextarea
              label="Internal notes & activity brief"
              register={register('notes')}
              error={errors.notes?.message}
              placeholder="Insert any relevant context from calls, introductions..."
              rows={3}
            />

            {/* Action Operations */}
            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setEditingLeadId(null);
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
              >
                Cancel operations
              </Button>
              <Button
                id="btn-lead-form-submit"
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingLeadId ? 'Update account' : 'Create account'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: IMPORT CSV CONSOLE */}
      <Sheet open={showImportModal} onOpenChange={setShowImportModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
            <div className="flex items-center space-x-2">
              <FolderSync className="h-4.5 w-4.5 text-primary" />
              <SheetTitle className="font-semibold text-foreground text-[15px]">Bulk CSV Enterprise Importer</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provide a raw CSV dataset representing customer records. Your column headers should map to:
              <code className="bg-primary/10 text-primary px-1 py-0.5 rounded ml-1 font-mono font-bold text-[10px]">
                Lead Name, Company, Email, Phone, Deal Value ($), Status, Source
              </code>.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="lead-csv-content" className="text-xs font-semibold text-foreground">Insert raw text below:</label>
              </div>
              <textarea
                id="lead-csv-content"
                rows={7}
                value={csvContent}
                aria-invalid={!!csvError}
                aria-describedby={csvError ? 'lead-csv-error' : undefined}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                  setImportRowErrors([]);
                }}
                placeholder='Lead Name,Company,Email,Phone,Deal Value ($),Status,Source&#10;"James Bond","MI6 Logistics","james@bond.gov","+44 (0) 700-007",85000,"Qualified","Referral"'
                className="w-full p-3 font-mono text-[11px] border border-border rounded-[6px] outline-none focus:border-primary bg-muted crm-scrollbar"
              />

              {csvError && (
                <p id="lead-csv-error" className="text-[11px] text-destructive font-medium mt-1">{csvError}</p>
              )}
              {importRowErrors.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[11px] text-destructive list-disc list-inside">
                  {importRowErrors.map((rowError, idx) => (
                    <li key={idx}>row {rowError.row}: {rowError.message}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Supports standard RFC-4180 parsing compliance</span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvContent('');
                    setCsvError('');
                    setImportRowErrors([]);
                  }}
                  className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
                >
                  Discard
                </Button>
                <Button
                  id="btn-import-leads-submit"
                  type="button"
                  onClick={handleImportSubmit}
                  className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                >
                  Integrate Records
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: DETAILED RECORD ACCOUNT VIEW */}
      <Sheet open={!!showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full">
          {showDetailModal && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
                <div>
                  <SheetTitle className="font-semibold text-foreground text-[15px]">Lead Account Record Profile</SheetTitle>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{showDetailModal.id}</p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
                
                <div className="flex items-center space-x-4 pb-4 border-b border-border">
                  <div className="bg-primary/10 h-12 w-12 rounded-[6px] border border-primary/20 text-primary flex items-center justify-center font-bold text-lg uppercase">
                    {showDetailModal.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground">{showDetailModal.name}</h3>
                    <p className="font-semibold text-xs text-muted-foreground">{showDetailModal.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Corporate Email</span>
                    <p className="font-semibold text-foreground mt-0.5">{showDetailModal.email}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Company Contact</span>
                    <p className="font-semibold text-foreground mt-0.5">{showDetailModal.phone}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Marketing Sourcing</span>
                    <p className="font-semibold text-foreground mt-0.5">{showDetailModal.source}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Corporate Estimated Value</span>
                    <p className="font-semibold text-primary mt-0.5 text-[14px]">{formatUSD(showDetailModal.dealValue)}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Lead Status</span>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 border bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-[4px] font-medium text-[11px]">
                        {showDetailModal.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground opacity-90">Representative in Charge</span>
                    <p className="font-semibold text-foreground mt-0.5">{showDetailModal.assignedTo}</p>
                  </div>
                </div>

                <div className="bg-muted p-3 border border-border rounded-[6px]">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">CRM Log Notes:</span>
                  <p className="text-xs text-foreground leading-relaxed font-sans">
                    {showDetailModal.notes || 'No notes are attached to this customer file record.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Registered system trace: {formatRelativeTime(showDetailModal.createdAt)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDetailModal(null)}
                    className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted font-medium cursor-pointer"
                  >
                    Close file
                  </Button>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: INDIVIDUAL ROW ACTION SYSTEM */}
      <Sheet open={!!activeActionLead && !!activeActionType} onOpenChange={(open) => { if (!open) { setActiveActionLead(null); setActiveActionType(null); } }}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-50">
          {activeActionLead && activeActionType && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
                <div>
                  <SheetTitle className="font-semibold text-foreground text-[15px] capitalize">
                    {activeActionType === 'notes' && 'Add Corporate Log Note'}
                    {activeActionType === 'followup' && 'Schedule Customer Followup'}
                    {activeActionType === 'meeting' && 'Set Corporate Briefing Meeting'}
                    {activeActionType === 'assignee' && 'Reassign Account Representative'}
                    {activeActionType === 'email' && 'Dispatch Corporate Email Message'}
                  </SheetTitle>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Lead: {activeActionLead.name} ({activeActionLead.company})
                  </p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
                {/* 1. NOTES ACTION FORM */}
                {activeActionType === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="lead-note-content" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none text-[11.5px]">
                        Note Content Text
                      </label>
                      <textarea
                        id="lead-note-content"
                        rows={6}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Type standard enterprise call brief or feedback comments..."
                        className="w-full p-3 font-sans text-xs border border-border rounded-[6px] outline-none focus:border-primary bg-muted crm-scrollbar"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!noteContent) {
                          showToast('Note content is required.', 'error');
                          return;
                        }
                        const rawHistory = activeActionLead.notes_history || [];
                        const newNote = {
                          id: `NOTE-${Date.now()}`,
                          content: noteContent,
                          date: new Date().toISOString().slice(0, 10),
                          author: currentUser?.name || 'Unassigned'
                        };
                        onUpdateLead(activeActionLead.id, {
                          notes_history: [...rawHistory, newNote],
                          notes: noteContent
                        });
                        showToast(`Note added successfully to ${activeActionLead.name}.`, 'success');
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Save CRM Log Note
                    </Button>
                  </div>
                )}

                {/* 2. FOLLOWUP ACTION FORM */}
                {activeActionType === 'followup' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="lead-followup-title" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Followup Task Title
                      </label>
                      <Input
                        id="lead-followup-title"
                        type="text"
                        value={followupTitle}
                        onChange={(e) => setFollowupTitle(e.target.value)}
                        placeholder="e.g. Call back regarding pricing models"
                        className="w-full h-9 text-xs border border-border rounded-[6px] bg-muted pb-1.5 pt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                          Expected Due Date
                        </label>
                        <FormDatePicker
                          label=""
                          registerName="followupDate"
                          setValue={(_, val) => setFollowupDate(val || '')}
                          value={followupDate}
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-followup-priority" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                          Task Urgency Priority
                        </label>
                        <select
                          id="lead-followup-priority"
                          value={followupPriority}
                          onChange={(e) => setFollowupPriority(e.target.value as any)}
                          className="w-full h-9 px-3 text-xs border border-border rounded-[6px] bg-muted outline-none focus:border-primary"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!followupTitle) {
                          showToast('Followup title is required.', 'error');
                          return;
                        }
                        addTask({
                          title: followupTitle,
                          dueDate: followupDate,
                          priority: followupPriority,
                          status: 'Pending',
                          assignedTo: activeActionLead.assignedTo || currentUser?.name || 'Unassigned',
                          category: 'Follow-up',
                          relatedToType: 'Lead',
                          relatedToName: activeActionLead.name
                        });
                        showToast(`Followup task scheduled for ${activeActionLead.name}.`, 'success');
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Schedule Task
                    </Button>
                  </div>
                )}

                {/* 3. SET MEETING ACTION FORM */}
                {activeActionType === 'meeting' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="lead-meeting-title" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Briefing / Meeting Subject
                      </label>
                      <Input
                        id="lead-meeting-title"
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="e.g. Solution demo presentation"
                        className="w-full h-9 text-xs border border-border rounded-[6px] bg-muted pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Meeting Date
                      </label>
                      <FormDatePicker
                        label=""
                        registerName="meetingDate"
                        setValue={(_, val) => setMeetingDate(val || '')}
                        value={meetingDate}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!meetingTitle) {
                          showToast('Meeting subject is required.', 'error');
                          return;
                        }
                        addTask({
                          title: `${meetingTitle} (Meeting)`,
                          dueDate: meetingDate,
                          priority: 'High',
                          status: 'Pending',
                          assignedTo: activeActionLead.assignedTo || currentUser?.name || 'Unassigned',
                          category: 'Meeting',
                          relatedToType: 'Lead',
                          relatedToName: activeActionLead.name
                        });
                        showToast(`Meeting booked with ${activeActionLead.name}.`, 'success');
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Book Meeting
                    </Button>
                  </div>
                )}

                {/* 4. CHANGE ASSIGNEE FORM */}
                {activeActionType === 'assignee' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="lead-assignee-select" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Select Representative
                      </label>
                      <select
                        id="lead-assignee-select"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-border rounded-[6px] bg-muted outline-none focus:border-primary"
                      >
                        {CRM_USERS.map(u => (
                          <option key={u.name} value={u.name}>{u.name} - ({u.role})</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        onUpdateLead(activeActionLead.id, { assignedTo: selectedAssignee });
                        showToast(`Lead updated. Reassigned to ${selectedAssignee}.`, 'success');
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Change Representative
                    </Button>
                  </div>
                )}

                {/* 5. SEND EMAIL ACTION FORM */}
                {activeActionType === 'email' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="lead-email-recipient" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Recipient Address
                      </label>
                      <Input
                        id="lead-email-recipient"
                        type="text"
                        disabled
                        value={activeActionLead.email}
                        className="w-full h-9 text-xs border border-border rounded-[6px] bg-muted text-muted-foreground cursor-not-allowed pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="lead-email-subject" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Email Subject
                      </label>
                      <Input
                        id="lead-email-subject"
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject..."
                        className="w-full h-9 text-xs border border-border rounded-[6px] bg-muted pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="lead-email-body" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                        Mail Body Content
                      </label>
                      <textarea
                        id="lead-email-body"
                        rows={6}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Body..."
                        className="w-full p-3 font-sans text-xs border border-border rounded-[6px] outline-none focus:border-primary bg-muted crm-scrollbar"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!emailSubject || !emailBody) {
                          showToast('Email subject and body are required.', 'error');
                          return;
                        }
                        // Add activity to show an email was sent trace log
                        onUpdateLead(activeActionLead.id, {
                          lastActivity: `Core corporate email sent regarding "${emailSubject}"`
                        });
                        showToast(`Corporate email dispatched successfully to ${activeActionLead.email}.`, 'success');
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Send Message
                    </Button>
                  </div>
                )}


              </div>

              <div className="p-3 border-t border-border bg-muted flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setActiveActionLead(null);
                    setActiveActionType(null);
                  }}
                  className="h-8 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
                >
                  Close Panel
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Floating Viewport Bulk Operations Bar - Compact, elegant, overlayed at bottom */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xs text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4.5 z-55 border border-slate-800 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800 font-medium whitespace-nowrap select-none">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span>Selected <strong className="text-blue-400 font-bold">{selectedLeadIds.length}</strong> records</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Select - Reassign Rep */}
            <select
              value=""
              aria-label="Reassign selected leads to representative"
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkAssign(val);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Reassign To...</option>
              {CRM_USERS.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>

            {/* Direct Select - Change Status */}
            <select
              value=""
              aria-label="Change status of selected leads"
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkStatusChange(val as LeadStatus);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Status...</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Direct Action - Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-900 text-red-200 hover:text-white rounded-[6px] font-semibold flex items-center gap-1 transition-all cursor-pointer text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>

            {/* Unselect All trigger */}
            <button
              onClick={() => setSelectedLeadIds([])}
              aria-label="Clear selections"
              className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Clear Selections"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
