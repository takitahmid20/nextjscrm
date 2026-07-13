/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  UserCog,
  Mail,
  UserCheck,
  PhoneCall,
  Sparkles,
  Upload,
  Download,
  Eye,
  MessageSquare,
  CalendarDays,
  SlidersHorizontal,
  MoreVertical,
  MapPin,
  Loader2
} from 'lucide-react';
import { Contact, LeadSource } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime, exportContactsToCSV, parseCSVToContacts } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormValues } from '../validation';
import { FormInput, FormSelect, FormTextarea, FormCheckbox } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCRM } from '../context/CRMContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';

interface ContactImportResult {
  importedCount: number;
  errors: { row: number; message: string }[];
}

interface ContactsViewProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => void;
  onUpdateContact: (id: string, updated: Partial<Contact>) => void;
  onDeleteContacts: (ids: string[]) => void;
  onImportContacts?: (newImportedContacts: Partial<Contact>[]) => Promise<ContactImportResult>;
  globalSearch: string;
}

export default function ContactsView({ 
  contacts, 
  onAddContact, 
  onUpdateContact, 
  onDeleteContacts,
  onImportContacts,
  globalSearch 
}: ContactsViewProps) {
  const { addTask, currentUser } = useCRM();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Navigation & Page sizes
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // CSV Import state hooks
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvError, setCsvError] = useState('');
  const [importRowErrors, setImportRowErrors] = useState<{ row: number; message: string }[]>([]);

  // Row actions modals / sub-sheets
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [activeActionContact, setActiveActionContact] = useState<Contact | null>(null);
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
  const [sortField, setSortField] = useState<'name' | 'company' | 'createdAt' | 'lastActivity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [userFilter, setUserFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState('');

  // Row Selections
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Interactive Modal Overlays
  const [showAddModal, setShowAddModal] = useState(false);

  // React Hook Form setups
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      source: 'Inbound',
      assignedTo: currentUser?.name || 'Unassigned',
      notes: '',
      companyWebsite: '',
      facebook: '',
      emailOptOut: false,
      priority: 'Medium',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressPostalCode: '',
      addressCountry: ''
    }
  });

  const sourceOptions: LeadSource[] = ['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership'];

  // Handle Form submissions
  const onSubmitContactForm = async (data: ContactFormValues) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const contactPayload = {
      name: fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      email: data.email,
      phone: data.phone,
      source: data.source,
      assignedTo: data.assignedTo || currentUser?.name || 'Unassigned',
      notes: data.notes || '',
      companyWebsite: data.companyWebsite || '',
      facebook: data.facebook || '',
      emailOptOut: !!data.emailOptOut,
      priority: data.priority || 'Medium',
      addressInfo: {
        street: data.addressStreet || '',
        city: data.addressCity || '',
        state: data.addressState || '',
        postalCode: data.addressPostalCode || '',
        country: data.addressCountry || ''
      },
      notes_history: data.notes ? [
        { id: `NOTE-${Date.now()}`, content: data.notes, date: new Date().toISOString(), author: currentUser?.name || 'Unassigned' }
      ] : []
    };

    if (editingContactId) {
      await onUpdateContact(editingContactId, contactPayload);
      setEditingContactId(null);
    } else {
      const duplicate = contactPayload.email && contacts.find(c => c.email.toLowerCase() === contactPayload.email.toLowerCase());
      if (duplicate) {
        showToast(`Heads up: "${duplicate.name}" already uses this email address.`, 'info');
      }
      await onAddContact(contactPayload);
    }
    setShowAddModal(false);
    reset();
  };

  // Open edits
  const handleEditOpen = (contact: Contact) => {
    setEditingContactId(contact.id);
    reset({
      firstName: contact.firstName || contact.name.split(' ')[0] || '',
      lastName: contact.lastName || contact.name.split(' ').slice(1).join(' ') || '',
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      source: contact.source,
      assignedTo: contact.assignedTo,
      notes: contact.notes || '',
      companyWebsite: contact.companyWebsite || '',
      facebook: contact.facebook || '',
      emailOptOut: !!contact.emailOptOut,
      priority: contact.priority || 'Medium',
      addressStreet: contact.addressInfo?.street || '',
      addressCity: contact.addressInfo?.city || '',
      addressState: contact.addressInfo?.state || '',
      addressPostalCode: contact.addressInfo?.postalCode || '',
      addressCountry: contact.addressInfo?.country || ''
    });
    setShowAddModal(true);
  };

  const handleBulkDelete = async () => {
    if (await confirm({
      description: `Are you sure you want to permanently delete ${selectedContactIds.length} contact records?`,
      destructive: true,
      confirmLabel: 'Delete',
    })) {
      onDeleteContacts(selectedContactIds);
      setSelectedContactIds([]);
    }
  };

  const handleBulkAssign = (username: string) => {
    selectedContactIds.forEach(id => {
      onUpdateContact(id, { assignedTo: username });
    });
    setSelectedContactIds([]);
    showToast(`Reassigned the ${selectedContactIds.length} selected records to ${username}.`, 'success');
  };

  const handleBulkPriorityChange = (priority: 'Low' | 'Medium' | 'High') => {
    selectedContactIds.forEach(id => {
      onUpdateContact(id, { priority });
    });
    setSelectedContactIds([]);
    showToast(`Priority of selected contacts updated to "${priority}".`, 'success');
  };

  // Memoized lists filtering & sorting
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const query = (localSearch || globalSearch || '').toLowerCase().trim();
      const matchSearch = !query || 
        contact.name.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.id.toLowerCase().includes(query);

      const matchSource = sourceFilter === 'All' || contact.source === sourceFilter;
      const matchUser = userFilter === 'All' || contact.assignedTo === userFilter;
      const matchPriority = priorityFilter === 'All' || contact.priority === priorityFilter;

      return matchSearch && matchSource && matchUser && matchPriority;
    });
  }, [contacts, localSearch, globalSearch, sourceFilter, userFilter, priorityFilter]);

  const sortedContacts = useMemo(() => {
    const list = [...filteredContacts];
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
    });
    return list;
  }, [filteredContacts, sortField, sortOrder]);

  // Pagination parameters
  const totalPages = Math.ceil(sortedContacts.length / rowsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedContacts.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedContacts, currentPage, rowsPerPage]);

  const toggleSelectRow = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === paginatedContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(paginatedContacts.map(l => l.id));
    }
  };

  // Side actions submit handlers
  const handleLogNoteSubmit = () => {
    if (!activeActionContact) return;
    if (!noteContent.trim()) {
      showToast('Note content is required.', 'error');
      return;
    }
    const existingHistory = activeActionContact.notes_history || [];
    const entry = {
      id: `NOTE-${Date.now()}`,
      content: noteContent,
      date: new Date().toISOString(),
      author: currentUser?.name || 'Unassigned'
    };
    onUpdateContact(activeActionContact.id, {
      notes: noteContent,
      notes_history: [entry, ...existingHistory]
    });
    setNoteContent('');
    setActiveActionType(null);
    showToast('Interaction note added to contact timeline.', 'success');
  };

  const handleFollowupSubmit = () => {
    if (!activeActionContact) return;
    if (!followupTitle.trim()) {
      showToast('Followup title is required.', 'error');
      return;
    }
    addTask({
      title: followupTitle,
      dueDate: followupDate,
      priority: followupPriority,
      status: 'Pending',
      assignedTo: activeActionContact.assignedTo || currentUser?.name || 'Unassigned',
      category: 'Follow-up',
      relatedToType: 'None'
    });
    setFollowupTitle('');
    setActiveActionType(null);
    showToast(`Follow-up task scheduled configuration saved.`, 'success');
  };

  const handleMeetingSubmit = () => {
    if (!activeActionContact) return;
    if (!meetingTitle.trim()) {
      showToast('Meeting subject is required.', 'error');
      return;
    }
    addTask({
      title: `${meetingTitle} (Meeting)`,
      dueDate: meetingDate,
      priority: 'High',
      status: 'Pending',
      assignedTo: activeActionContact.assignedTo || currentUser?.name || 'Unassigned',
      category: 'Meeting',
      relatedToType: 'None'
    });
    setMeetingTitle('');
    setActiveActionType(null);
    showToast(`Briefing scheduled successfully.`, 'success');
  };

  const handleSendEmailSubmit = () => {
    if (!activeActionContact) return;
    if (!emailBody.trim()) {
      showToast('Email body is required.', 'error');
      return;
    }
    onUpdateContact(activeActionContact.id, {
      lastActivity: `Sent email regarding: "${emailSubject}"`
    });
    setEmailSubject('');
    setEmailBody('');
    setActiveActionType(null);
    showToast(`Outbound message sent to <${activeActionContact.email}>.`, 'success');
  };

  // Export CSV action
  const handleExportCSV = () => {
    const csvStr = exportContactsToCSV(contacts);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `centric_crm_contacts_export_${new Date().toISOString().slice(0,10)}.csv`);
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
    if (!onImportContacts) {
      setCsvError('Importer callback is temporarily unavailable.');
      setImportRowErrors([]);
      return;
    }
    try {
      const parsed = parseCSVToContacts(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid contacts parsed. Verify headings structure.');
        setImportRowErrors([]);
        return;
      }
      setCsvError('');
      const result = await onImportContacts(parsed);
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
          aria-label="Select all contacts on this page"
          checked={paginatedContacts.length > 0 && selectedContactIds.length === paginatedContacts.length}
          onChange={toggleSelectAll}
          className="h-3.5 w-3.5 text-primary border-border focus:ring-primary rounded cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      className: 'sticky left-12 bg-muted z-20 shadow-[1px_0_0_var(--border)] border-r border-border min-w-[200px]',
      label: (
        <div className="flex items-center gap-1 select-none">
          Contact Name
          {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
        </div>
      ),
      onClick: () => {
        setSortField('name');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    },
    {
      key: 'company',
      label: (
        <div className="flex items-center gap-1 select-none">
          Company Account
          {sortField === 'company' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
        </div>
      ),
      onClick: () => {
        setSortField('company');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'source', label: 'Source' },
    { key: 'assignedTo', label: 'Manager' },
    { key: 'priority', className: 'text-center', label: 'Priority' },
    {
      key: 'createdAt',
      label: (
        <div className="flex items-center gap-1 select-none">
          Added Date
          {sortField === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
        </div>
      ),
      onClick: () => {
        setSortField('createdAt');
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    },
    { key: 'actions', className: 'text-center sticky right-0 bg-muted z-20 border-l border-border', label: 'Actions' }
  ];

  return (
    <div id="contacts-directory-container" className="space-y-6">
      
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Contacts Directory</h1>
          <p className="text-sm text-muted-foreground">
            Unified listing of qualified corporate business partners, accounts, and converted strategic relationship owners.
          </p>
        </div>

        {/* Actions Button Bar */}
        <div id="contacts-action-toolbar" className="flex items-center space-x-2.5">
          <Button
            id="btn-import-contacts-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Import CSV
          </Button>
          
          <Button
            id="btn-export-contacts-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-card border border-border hover:bg-primary/10 text-foreground hover:text-primary text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Data
          </Button>

          <Button
            id="btn-add-contact"
            onClick={() => {
              setEditingContactId(null);
              reset({
                firstName: '',
                lastName: '',
                company: '',
                email: '',
                phone: '',
                source: 'Inbound',
                assignedTo: currentUser?.name || 'Unassigned',
                notes: '',
                companyWebsite: '',
                facebook: '',
                emailOptOut: false,
                priority: 'Medium',
                addressStreet: '',
                addressCity: '',
                addressState: '',
                addressPostalCode: '',
                addressCountry: ''
              });
              setShowAddModal(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold px-4 h-10 shadow-sm rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer animate-none"
          >
            <Plus className="h-4 w-4" />
            Create Contact
          </Button>
        </div>
      </div>

      {/* Database Filters & Quick Search Card */}
      <Card className="bg-card border border-border rounded-[8px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search bar inside toolbar to lock workspace search */}
          <div>
            <label htmlFor="contact-toolbar-search" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Directory Filter Search
            </label>
            <Input
              id="contact-toolbar-search"
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

          {/* Filter Source Sourcing */}
          <div>
            <label htmlFor="contact-source-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Acquisition Sourcing
            </label>
            <FormSelect
              id="contact-source-filter"
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
            <label htmlFor="contact-user-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Assigned Representative
            </label>
            <FormSelect
              id="contact-user-filter"
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

          {/* Filter Priority */}
          <div>
            <label htmlFor="contact-priority-filter" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
              Deal Priority Level
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <FormSelect
                  id="contact-priority-filter"
                  value={priorityFilter}
                  onChange={(val) => {
                    setPriorityFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'All', label: 'All Priority Levels' },
                    { value: 'High', label: '🔥 High' },
                    { value: 'Medium', label: '⚡ Medium' },
                    { value: 'Low', label: '💤 Low' }
                  ]}
                  placeholder="All Priority Levels"
                />
              </div>

              {(sourceFilter !== 'All' || userFilter !== 'All' || priorityFilter !== 'All' || localSearch !== '') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSourceFilter('All');
                    setUserFilter('All');
                    setPriorityFilter('All');
                    setLocalSearch('');
                  }}
                  className="h-10 text-xs px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold shrink-0 rounded-[6px]"
                  title="Clear all filters"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* Reusable UnifiedTable Component Integration */}
      <UnifiedTable
        id="contacts-directory-table"
        data={paginatedContacts}
        headers={tableHeaders}
        emptyStateText="No registered contacts fit the designated filter parameters."
        pagination={{
          currentPage,
          totalPages,
          totalRecords: filteredContacts.length,
          rowsPerPage,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: setRowsPerPage,
          recordTypeLabel: 'contacts'
        }}
        renderRow={(contact) => {
          const isChecked = selectedContactIds.includes(contact.id);
          return (
            <tr 
              key={contact.id}
              className={`group h-[52px] border-b border-border transition-colors ${
                isChecked ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox cell */}
              <td className={`py-2.5 px-4 text-center sticky left-0 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-r border-border`}>
                <input
                  type="checkbox"
                  aria-label={`Select ${contact.name}`}
                  checked={isChecked}
                  onChange={() => toggleSelectRow(contact.id)}
                  className="h-3.5 w-3.5 text-primary border-border focus:ring-primary rounded cursor-pointer"
                />
              </td>

              {/* Name & ID cell */}
              <td className={`py-2.5 px-4 sticky left-12 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-r border-border min-w-[200px]`}>
                <div className="flex flex-col">
                  <a 
                    href={`/contact-details/${contact.id}`}
                    className="font-semibold text-primary hover:text-primary/90 hover:underline text-[13px] text-left cursor-pointer truncate"
                  >
                    {contact.name}
                  </a>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5 select-all">
                    {contact.id}
                  </span>
                </div>
              </td>

              {/* Company cell */}
              <td className="py-2.5 px-4 font-semibold text-foreground">
                {contact.company}
              </td>

              {/* Email cell */}
              <td className="py-2.5 px-4">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="hover:underline text-primary font-medium flex items-center gap-1 select-all">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </td>

              {/* Phone cell */}
              <td className="py-2.5 px-4 font-semibold font-mono text-foreground space-x-1 whitespace-nowrap">
                {contact.phone || <span className="text-muted-foreground italic font-mono font-normal">None</span>}
              </td>

              {/* Source cell */}
              <td className="py-2.5 px-4">
                <span className="bg-muted border border-border px-2 py-0.5 rounded-[4px] font-medium text-foreground">
                  {contact.source}
                </span>
              </td>

              {/* Portfolio manager cell */}
              <td className="py-2.5 px-4 font-medium text-foreground">
                <div className="flex items-center gap-1.5 select-none">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">
                    {contact.assignedTo ? contact.assignedTo.split(' ').map(n=>n[0]).join('') : 'U'}
                  </div>
                  <span className="truncate max-w-[110px]">{contact.assignedTo}</span>
                </div>
              </td>

              {/* Priority badge cell */}
              <td className="py-2.5 px-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  contact.priority === 'High'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : contact.priority === 'Medium'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    : 'bg-muted border border-border text-muted-foreground'
                }`}>
                  {contact.priority || 'Medium'}
                </span>
              </td>

              {/* Created Date cell */}
              <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(contact.createdAt)}
              </td>

              {/* Row Action popover cell */}
              <td className={`py-2.5 px-4 text-center sticky right-0 z-10 transition-colors ${isChecked ? 'bg-primary/10' : 'bg-card group-hover:bg-muted'} border-l border-border`}>
                <div className="flex items-center justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        aria-label={`Row actions for ${contact.name}`}
                        className="h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1 bg-card border border-border shadow-lg rounded-md z-45">
                      <div className="flex flex-col text-xs font-medium">
                        <a 
                          href={`/contact-details/${contact.id}`}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground border-0"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>View Details</span>
                        </a>

                        <button 
                          type="button"
                          onClick={() => {
                            setActiveActionContact(contact);
                            setNoteContent('');
                            setActiveActionType('notes');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Add Note</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setActiveActionContact(contact);
                            setFollowupTitle(`Call follow-up: ${contact.name}`);
                            setFollowupDate('2026-06-01');
                            setFollowupPriority('Medium');
                            setActiveActionType('followup');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                          <span>Followups</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setActiveActionContact(contact);
                            setMeetingTitle('QBR Relationship Sync Session');
                            setMeetingDate('2026-06-05');
                            setActiveActionType('meeting');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-green-500" />
                          <span>Set Meeting</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setActiveActionContact(contact);
                            setSelectedAssignee(contact.assignedTo);
                            setActiveActionType('assignee');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Reassign Manager</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            setEmailSubject(`Enterprise Partnership Update - ${contact.company}`);
                            setEmailBody(`Hi ${contact.name},\n\nI hope this message finds you well. I wanted to check in following our converted setup...`);
                            setActiveActionContact(contact);
                            setActiveActionType('email');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <Mail className="h-3.5 w-3.5 text-cyan-500" />
                          <span>Send Email</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleEditOpen(contact)}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded flex items-center gap-2 text-foreground cursor-pointer border-0"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Modify Profile</span>
                        </button>

                        <div className="h-[1px] bg-border my-1" />

                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm({
                              description: `Permanently wipe contact portfolio for "${contact.name}"?`,
                              destructive: true,
                              confirmLabel: 'Delete',
                            })) {
                              onDeleteContacts([contact.id]);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-destructive/10 rounded flex items-center gap-2 text-destructive cursor-pointer border-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          <span>Delete Record</span>
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

      {/* Register new Contact slide out sheet */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-55">
          <SheetHeader className="px-5 py-4 border-b border-border bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">
              {editingContactId ? 'Update Contact Profile Record' : 'Create Contact Profile Record'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmitContactForm)} className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
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
                  label="Email Communications Opt Out"
                  register={register('emailOptOut')}
                  error={errors.emailOptOut?.message}
                />
              </div>
            </div>

            {/* Address Info Section */}
            <div className="border border-border rounded-[8px] p-4 bg-muted">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center select-none">
                <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            </div>

            <FormTextarea
              label="Internal notes & relationship brief"
              register={register('notes')}
              error={errors.notes?.message}
              placeholder="Insert any relevant context from conversions..."
              rows={3}
            />

            {/* Action Operations */}
            <div className="pt-3 border-t border-border flex items-center justify-end space-x-2 select-none">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setEditingContactId(null);
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer"
              >
                Discard operations
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-[6px] cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingContactId ? 'Update details' : 'Create profile'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Row action: Side panel action sheets */}
      <Sheet open={activeActionType !== null} onOpenChange={() => setActiveActionType(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-55">
          <SheetHeader className="px-5 py-4 border-b border-border bg-muted">
            <SheetTitle className="font-semibold text-foreground text-[15px]">
              {activeActionType === 'notes' && 'Log Contact Interaction'}
              {activeActionType === 'followup' && 'Schedule Call Check-in'}
              {activeActionType === 'meeting' && 'Schedule Executive Sync'}
              {activeActionType === 'email' && 'Dispatch Corporate Email'}
            </SheetTitle>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Contact: {activeActionContact?.name} ({activeActionContact?.company})
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
            {activeActionType === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-note-content" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Note Description
                  </label>
                  <Textarea
                    id="contact-note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Summarize phone calls, email outcomes, custom items, or negotiated points..."
                    className="min-h-[140px] text-xs font-sans"
                  />
                </div>
                <Button onClick={handleLogNoteSubmit} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-semibold rounded-[6px] cursor-pointer">
                  Append to Relationship History
                </Button>
              </div>
            )}

            {activeActionType === 'followup' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-followup-title" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Task Checklist Title
                  </label>
                  <Input id="contact-followup-title" type="text" value={followupTitle} onChange={(e)=>setFollowupTitle(e.target.value)} className="h-9 text-xs border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-followup-date" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                      Due Target Date
                    </label>
                    <input id="contact-followup-date" type="date" value={followupDate} onChange={(e)=>setFollowupDate(e.target.value)} className="w-full h-9 px-3 border border-border rounded-[6px] text-xs bg-card text-foreground outline-none" />
                  </div>
                  <div>
                    <label htmlFor="contact-followup-priority" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none font-semibold">
                      Team Priority
                    </label>
                    <select
                      id="contact-followup-priority"
                      value={followupPriority}
                      onChange={(e)=>setFollowupPriority(e.target.value as any)}
                      className="w-full h-9 px-3 text-xs border border-border rounded-[6px] bg-muted outline-none focus:border-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleFollowupSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-semibold rounded-[6px] cursor-pointer">
                  Add to Account Action list
                </Button>
              </div>
            )}

            {activeActionType === 'meeting' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-meeting-title" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Sync Session Subject
                  </label>
                  <Input id="contact-meeting-title" type="text" value={meetingTitle} onChange={(e)=>setMeetingTitle(e.target.value)} className="h-9 text-xs border-border" />
                </div>
                <div>
                  <label htmlFor="contact-meeting-date" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Scheduled Date
                  </label>
                  <input id="contact-meeting-date" type="date" value={meetingDate} onChange={(e)=>setMeetingDate(e.target.value)} className="w-full h-9 px-3 border border-border rounded-[6px] text-xs bg-card text-foreground outline-none" />
                </div>
                <Button onClick={handleMeetingSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-semibold rounded-[6px] cursor-pointer">
                  Confirm Briefing Schedules
                </Button>
              </div>
            )}

            {activeActionType === 'email' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-email-recipient" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Recipient Address
                  </label>
                  <Input id="contact-email-recipient" type="text" value={activeActionContact?.email || ''} disabled className="h-9 text-xs bg-muted cursor-not-allowed border-border" />
                </div>
                <div>
                  <label htmlFor="contact-email-subject" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Email Subject
                  </label>
                  <Input id="contact-email-subject" type="text" value={emailSubject} onChange={(e)=>setEmailSubject(e.target.value)} className="h-9 text-xs border-border" />
                </div>
                <div>
                  <label htmlFor="contact-email-body" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 select-none">
                    Message Body
                  </label>
                  <Textarea id="contact-email-body" value={emailBody} onChange={(e)=>setEmailBody(e.target.value)} className="min-h-[140px] text-xs font-sans whitespace-pre-wrap outline-none" />
                </div>
                <Button onClick={handleSendEmailSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-semibold rounded-[6px] cursor-pointer">
                  Send Message
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-muted flex justify-end select-none">
            <Button
              type="button"
              onClick={() => {
                setActiveActionContact(null);
                setActiveActionType(null);
              }}
              className="h-8 px-4 border border-border text-xs text-foreground bg-card rounded-[6px] hover:bg-muted cursor-pointer animate-none"
            >
              Close Panel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Viewport Bulk Operations Bar */}
      {selectedContactIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xs text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4.5 z-55 border border-slate-800 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800 font-medium whitespace-nowrap select-none">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span>Selected <strong className="text-blue-400 font-bold">{selectedContactIds.length}</strong> records</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value=""
              aria-label="Reassign selected contacts to representative"
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkAssign(val);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Reassign Rep...</option>
              {CRM_USERS.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>

            <select
              value=""
              aria-label="Change priority of selected contacts"
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkPriorityChange(val as any);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Priority...</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">💤 Low</option>
            </select>

            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-900 text-red-200 hover:text-white rounded-[6px] font-semibold flex items-center gap-1 transition-all cursor-pointer text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>

            <button
              onClick={() => setSelectedContactIds([])}
              aria-label="Clear selections"
              className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Clear Selections"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SIDE PANEL: IMPORT CSV CONSOLE */}
      <Sheet open={showImportModal} onOpenChange={setShowImportModal}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border shadow-2xl p-0 flex flex-col h-full z-100">
          <SheetHeader className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-semibold text-foreground text-[15px]">Bulk CSV Enterprise Importer</SheetTitle>
              <Button variant="ghost" aria-label="Close import panel" className="h-8 w-8 p-0 hover:bg-muted rounded-full cursor-pointer flex items-center justify-center border-0" onClick={() => setShowImportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <span className="text-[12px] text-muted-foreground font-medium leading-relaxed block border-none select-none">
              Provide a raw CSV dataset representing customer records. Your column headers should map to:
            </span>

            <div className="p-3 bg-muted border border-border rounded-[6px] font-mono text-[10px] text-muted-foreground leading-normal space-y-1 select-all">
              <span className="block font-bold">Contact Name,Company,Email,Phone,Source,Priority,Deal Value ($),Assigned User</span>
              <span className="block italic text-muted-foreground">"Jane Doe","Acme Corp","jane@acme.com","+1 (555) 010-2000","Partnership","High",45000,"Alex Rivera"</span>
              <span className="block italic text-muted-foreground">"John Smith","Globex Inc","john@globex.com","+1 (555) 010-3000","Referral","High",125000,"Elena Rostova"</span>
            </div>

            <div className="space-y-1.5 flex flex-col h-[280px]">
              <label htmlFor="contact-csv-content" className="text-xs font-semibold text-foreground">Paste raw text csv lines:</label>
              <Textarea
                id="contact-csv-content"
                value={csvContent}
                aria-invalid={!!csvError}
                aria-describedby={csvError ? 'contact-csv-error' : undefined}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                  setImportRowErrors([]);
                }}
                placeholder="Paste Comma-Separated Values here..."
                className="flex-1 text-xs font-mono min-h-[160px]"
              />
            </div>

            {csvError && (
              <p id="contact-csv-error" className="text-[11px] text-destructive font-semibold select-none">{csvError}</p>
            )}
            {importRowErrors.length > 0 && (
              <ul className="text-[11px] text-destructive list-disc list-inside space-y-0.5">
                {importRowErrors.map((rowError, idx) => (
                  <li key={idx}>row {rowError.row}: {rowError.message}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3.5 border-t border-border bg-muted/50 flex justify-end gap-2.5 select-none">
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
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Submit Enterprise Importer
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
