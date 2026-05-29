/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  X,
  CheckCircle,
  MoreVertical,
  SlidersHorizontal,
  MapPin,
  CalendarDays,
  UserCog,
  Mail,
  UserCheck,
  Building2,
  PhoneCall,
  Sparkles,
  Search,
  CheckCircle2,
  Phone,
  Upload,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Contact, LeadSource } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime, exportContactsToCSV, parseCSVToContacts } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormValues } from '../validation';
import { FormInput, FormSelect, FormTextarea, FormCheckbox, FormDatePicker } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCRM } from '../context/CRMContext';

interface ContactsViewProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => void;
  onUpdateContact: (id: string, updated: Partial<Contact>) => void;
  onDeleteContacts: (ids: string[]) => void;
  onImportContacts?: (newImportedContacts: Partial<Contact>[]) => void;
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

  // Navigation & Page sizes
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // CSV Import state hooks
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvError, setCsvError] = useState('');

  // Row actions modals / sub-sheets
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [activeActionContact, setActiveActionContact] = useState<Contact | null>(null);
  const [activeActionType, setActiveActionType] = useState<'notes' | 'followup' | 'meeting' | 'assignee' | 'email' | null>(null);

  // Row action forms values
  const [noteContent, setNoteContent] = useState('');
  const [followupTitle, setFollowupTitle] = useState('');
  const [followupDate, setFollowupDate] = useState('2026-06-01');
  const [followupPriority, setFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-06-01');
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

  // React Hook Form setups matches search schema
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      source: 'Inbound',
      assignedTo: 'Sarah Jenkins',
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
  const onSubmitContactForm = (data: ContactFormValues) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const contactPayload = {
      name: fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      email: data.email,
      phone: data.phone,
      source: data.source,
      assignedTo: data.assignedTo || 'Sarah Jenkins',
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
        { id: `NOTE-${Date.now()}`, content: data.notes, date: new Date().toISOString(), author: currentUser?.name || 'Sarah Jenkins' }
      ] : []
    };

    if (editingContactId) {
      onUpdateContact(editingContactId, contactPayload);
      setEditingContactId(null);
    } else {
      onAddContact(contactPayload);
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

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete ${selectedContactIds.length} contact records?`)) {
      onDeleteContacts(selectedContactIds);
      setSelectedContactIds([]);
    }
  };

  const handleBulkAssign = (username: string) => {
    selectedContactIds.forEach(id => {
      onUpdateContact(id, { assignedTo: username });
    });
    setSelectedContactIds([]);
    alert(`Reassigned the ${selectedContactIds.length} selected records to ${username}.`);
  };

  const handleBulkPriorityChange = (priority: 'Low' | 'Medium' | 'High') => {
    selectedContactIds.forEach(id => {
      onUpdateContact(id, { priority });
    });
    setSelectedContactIds([]);
    alert(`Priority of selected contacts updated to "${priority}".`);
  };

  // Memoized lists filtering & sorting
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Base search text fields matching
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

  // Side actions submit handlers using blue keys
  const handleLogNoteSubmit = () => {
    if (!activeActionContact || !noteContent.trim()) return;
    const existingHistory = activeActionContact.notes_history || [];
    const entry = {
      id: `NOTE-${Date.now()}`,
      content: noteContent,
      date: new Date().toISOString(),
      author: currentUser?.name || 'Sarah Jenkins'
    };
    onUpdateContact(activeActionContact.id, {
      notes: noteContent,
      notes_history: [entry, ...existingHistory]
    });
    setNoteContent('');
    setActiveActionType(null);
    alert('Interaction note added to contact timeline.');
  };

  const handleFollowupSubmit = () => {
    if (!activeActionContact || !followupTitle.trim()) return;
    addTask({
      title: followupTitle,
      dueDate: followupDate,
      priority: followupPriority,
      status: 'Pending',
      assignedTo: activeActionContact.assignedTo || 'Sarah Jenkins',
      category: 'Follow-up',
      relatedToType: 'None'
    });
    setFollowupTitle('');
    setActiveActionType(null);
    alert(`Follow-up task scheduled configuration saved.`);
  };

  const handleMeetingSubmit = () => {
    if (!activeActionContact || !meetingTitle.trim()) return;
    addTask({
      title: `${meetingTitle} (Meeting)`,
      dueDate: meetingDate,
      priority: 'High',
      status: 'Pending',
      assignedTo: activeActionContact.assignedTo || 'Sarah Jenkins',
      category: 'Meeting',
      relatedToType: 'None'
    });
    setMeetingTitle('');
    setActiveActionType(null);
    alert(`Briefing scheduled successfully.`);
  };

  const handleSendEmailSubmit = () => {
    if (!activeActionContact || !emailBody.trim()) return;
    onUpdateContact(activeActionContact.id, {
      lastActivity: `Sent email regarding: "${emailSubject}"`
    });
    setEmailSubject('');
    setEmailBody('');
    setActiveActionType(null);
    alert(`Outbound message sent to <${activeActionContact.email}>.`);
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

  // Live simulation import trigger
  const handleSimulationImport = () => {
    const simulationContent = `Contact Name,Company,Email,Phone,Source,Priority,Deal Value ($),Assigned User\n"Diana Prince","Themyscira Exports","diana@exports.io","+1 (555) 777-8888","Partnership","High",45000,"Alex Rivera"\n"Wayne Bruce","Wayne Enterprises","bruce@waynecorp.co","+1 (555) 999-0000","Referral","High",125000,"Sarah Jenkins"\n"Clara Kent","Daily Planet Inc","clark@dailyplanet.org","+1 (555) 123-9876","Cold Call","Medium",15000,"Elena Rostova"`;
    setCsvContent(simulationContent);
  };

  const handleImportSubmit = () => {
    if (!csvContent.trim()) {
      setCsvError('Please paste or load CSV text content.');
      return;
    }
    if (!onImportContacts) {
      setCsvError('Importer callback is temporarily unavailable.');
      return;
    }
    try {
      const parsed = parseCSVToContacts(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid contacts parsed. Verify headings structure.');
        return;
      }
      onImportContacts(parsed);
      setShowImportModal(false);
      setCsvContent('');
      setCsvError('');
      alert(`Successfully imported ${parsed.length} business contacts.`);
    } catch (e: any) {
      setCsvError('Failed parsing CSV lines. Code: ' + e?.message);
    }
  };

  return (
    <div id="contacts-directory-container" className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24">
      
      {/* Header segment matches leads */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-[#2563EB] p-1.5 rounded-[6px] text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Contacts Directory</h1>
          </div>
          <p className="text-xs text-[#6B7280]">
            Unified listing of qualified corporate business partners, accounts, and converted strategic relationship owners.
          </p>
        </div>

         <div className="flex flex-wrap items-center gap-2.5">
          <Button
            id="btn-import-contacts-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#111827] hover:text-[#2563EB] text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-[#6B7280]" />
            Import CSV
          </Button>
          
          <Button
            id="btn-export-contacts-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#111827] hover:text-[#2563EB] text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#6B7280]" />
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
                assignedTo: currentUser?.name || 'Sarah Jenkins',
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
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold px-4 h-10 shadow-sm rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Contact
          </Button>
        </div>
      </div>

      {/* Database Filters & Quick Search Card */}
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search bar inside toolbar to lock workspace search */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5">
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
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] text-[#111827] text-xs rounded-[6px] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 outline-none"
            />
          </div>

          {/* Filter Source */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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

          {/* Filter Representative */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
                  className="h-10 text-xs px-2.5 text-red-500 hover:text-red-650 hover:bg-red-50 font-bold shrink-0 rounded-[6px]"
                  title="Clear all filters"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* Enterprise-grade Contacts Table */}
      <div className="border border-[#E5E7EB] bg-white rounded-[8px] shadow-sm overflow-hidden overflow-x-auto crm-scrollbar">
        <Table className="min-w-full">
          <TableHeader className="bg-[#F5F6F8] font-medium text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-[#E5E7EB]">
            <TableRow>
              <TableHead className="py-3 px-4 w-12 text-center sticky left-0 bg-[#F5F6F8] z-20 shadow-[1px_0_0_#CBD5E1] border-r border-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={paginatedContacts.length > 0 && selectedContactIds.length === paginatedContacts.length}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB] rounded cursor-pointer"
                />
              </TableHead>
              
              <TableHead 
                className="py-3 px-4 cursor-pointer hover:bg-gray-150 transition-colors text-xs text-[#6B7280] sticky left-12 bg-[#F5F6F8] z-20 shadow-[1px_0_0_#CBD5E1] border-r border-slate-200 min-w-[200px]"
                onClick={() => {
                  setSortField('name');
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                }}
              >
                <div className="flex items-center gap-1">
                  Contact Name
                  {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                </div>
              </TableHead>

              <TableHead 
                className="py-3 px-4 cursor-pointer hover:bg-gray-150 text-xs text-[#6B7280]"
                onClick={() => {
                  setSortField('company');
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                }}
              >
                <div className="flex items-center gap-1">
                  Company Account
                  {sortField === 'company' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                </div>
              </TableHead>

              <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Email Address</TableHead>
              <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Phone Number</TableHead>
              <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Source</TableHead>
              <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Manager</TableHead>
              <TableHead className="py-3 px-4 text-xs text-[#6B7280] text-center">Priority</TableHead>
              
              <TableHead 
                className="py-3 px-4 cursor-pointer hover:bg-gray-150 text-xs text-[#6B7280]"
                onClick={() => {
                  setSortField('createdAt');
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                }}
              >
                <div className="flex items-center gap-1">
                  Added Date
                  {sortField === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                </div>
              </TableHead>

              <TableHead className="py-3 px-4 text-center text-xs text-[#6B7280] sticky right-0 bg-[#F5F6F8] z-20 border-l border-slate-200">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="text-xs divide-y divide-[#E5E7EB] bg-white text-[#374151]">
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400 font-sans">
                  No registered contacts fit the designated filter parameters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => {
                const isChecked = selectedContactIds.includes(contact.id);
                return (
                  <TableRow 
                    key={contact.id}
                    className={`group h-[52px] transition-colors ${
                      isChecked ? 'bg-[#EFF6FF]/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox column */}
                    <TableCell className={`py-2.5 px-4 text-center sticky left-0 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-r border-[#E5E7EB]`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectRow(contact.id)}
                        className="h-3.5 w-3.5 text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB] rounded cursor-pointer"
                      />
                    </TableCell>

                    {/* Contact Name & ID */}
                    <TableCell className={`py-2.5 px-4 sticky left-12 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-r border-slate-200 min-w-[200px]`}>
                      <div className="flex flex-col">
                        <a 
                          href={`/contact-details?id=${contact.id}`}
                          className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline text-[13px] text-left cursor-pointer truncate"
                        >
                          {contact.name}
                        </a>
                        <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                          {contact.id}
                        </span>
                      </div>
                    </TableCell>

                    {/* Company Account */}
                    <TableCell className="py-2.5 px-4 font-semibold text-slate-700">
                      {contact.company}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-2.5 px-4">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="hover:underline text-[#2563EB] font-medium flex items-center gap-1 select-all">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-slate-300 italic">None</span>
                      )}
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="py-2.5 px-4 font-semibold font-mono text-slate-600 space-x-1 whitespace-nowrap">
                      {contact.phone || <span className="text-slate-300 italic font-mono font-normal">None</span>}
                    </TableCell>

                    {/* Source */}
                    <TableCell className="py-2.5 px-4">
                      <span className="bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-[4px] font-medium text-slate-600">
                        {contact.source}
                      </span>
                    </TableCell>

                    {/* Assigned portfolio rep */}
                    <TableCell className="py-2.5 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[9px] font-bold flex items-center justify-center">
                          {contact.assignedTo ? contact.assignedTo.split(' ').map(n=>n[0]).join('') : 'U'}
                        </div>
                        <span className="truncate max-w-[110px]">{contact.assignedTo}</span>
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        contact.priority === 'High' 
                           ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                          : contact.priority === 'Medium'
                          ? 'bg-amber-50 border border-amber-100 text-amber-700'
                          : 'bg-slate-50 border border-slate-100 text-slate-600'
                      }`}>
                        {contact.priority || 'Medium'}
                      </span>
                    </TableCell>

                    {/* Created date */}
                    <TableCell className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(contact.createdAt)}
                    </TableCell>

                    {/* Row action popover */}
                    <TableCell className={`py-2.5 px-4 text-center sticky right-0 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-l border-slate-200`}>
                      <div className="flex items-center justify-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-200 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                           <PopoverContent align="end" className="w-48 p-1 bg-white border border-[#E5E7EB] shadow-lg rounded-md z-45">
                            <div className="flex flex-col text-xs font-medium">
                              <a 
                                href={`/contact-details?id=${contact.id}`}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 border-0"
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
                              >
                                <UserCog className="h-3.5 w-3.5 text-slate-500" />
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
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
                              >
                                <Mail className="h-3.5 w-3.5 text-cyan-500" />
                                <span>Send Email</span>
                              </button>

                              <button 
                                type="button"
                                onClick={() => handleEditOpen(contact)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer border-0"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                                <span>Modify Profile</span>
                              </button>

                              <div className="h-[1px] bg-slate-100 my-1" />

                              <button 
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Permanently wipe contact portfolio for "${contact.name}"?`)) {
                                    onDeleteContacts([contact.id]);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-rose-50 rounded flex items-center gap-2 text-rose-600 cursor-pointer border-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>Delete Record</span>
                              </button>
                            </div>

                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls area match leads bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 select-none">
        <div>
          Showing <strong>{sortedContacts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * rowsPerPage, sortedContacts.length)}</strong> of{' '}
          <strong>{sortedContacts.length}</strong> qualified accounts
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-[#CBD5E1] rounded-[4px] px-1.5 py-1 font-semibold text-slate-700 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="h-8 px-2 border-[#CBD5E1] rounded-[4px] hover:bg-slate-50 text-slate-700"
            >
              Prev
            </Button>
            <span className="font-semibold px-2.5">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="h-8 px-2 border-[#CBD5E1] rounded-[4px] hover:bg-slate-50 text-slate-700"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Side-panel: Register Unified Business partner - WITH LARGER WIDTH AND PROPER STYLING */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-55">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
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
            <div className="border border-[#E2E8F0] rounded-[8px] p-4 bg-[#F8FAFC]">
              <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wide mb-3 flex items-center select-none">
                <MapPin className="h-4 w-4 mr-1.5 text-slate-500 shadow-none border-none scale-100" />
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

            <div className="grid grid-cols-3 gap-3">
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
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setEditingContactId(null);
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
              >
                Discard operations
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
              >
                {editingContactId ? 'Update details' : 'Create profile'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Row action: Side panel action sheets */}
      <Sheet open={activeActionType !== null} onOpenChange={() => setActiveActionType(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-55">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
              {activeActionType === 'notes' && 'Log Contact Interaction'}
              {activeActionType === 'followup' && 'Schedule Call Check-in'}
              {activeActionType === 'meeting' && 'Schedule Executive Sync'}
              {activeActionType === 'email' && 'Dispatch Corporate Email'}
            </SheetTitle>
            <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
              Contact: {activeActionContact?.name} ({activeActionContact?.company})
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
            {activeActionType === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Note Description
                  </label>
                  <Textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Summarize phone calls, email outcomes, custom items, or negotiated points..."
                    className="min-h-[140px] text-xs"
                  />
                </div>
                <Button onClick={handleLogNoteSubmit} className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] h-9 text-xs font-semibold rounded-[6px]">
                  Append to Relationship History
                </Button>
              </div>
            )}

            {activeActionType === 'followup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text:[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Task Checklist Title
                  </label>
                  <Input type="text" value={followupTitle} onChange={(e)=>setFollowupTitle(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                      Due Target Date
                    </label>
                    <input type="date" value={followupDate} onChange={(e)=>setFollowupDate(e.target.value)} className="w-full h-9 px-3 border border-[#CBD5E1] rounded-[6px] text-xs bg-white text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                      Team Priority
                    </label>
                    <select
                      value={followupPriority}
                      onChange={(e)=>setFollowupPriority(e.target.value as any)}
                      className="w-full h-9 px-3 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none focus:border-[#2563EB]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleFollowupSubmit} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 text-xs font-semibold rounded-[6px]">
                  Add to Account Action list
                </Button>
              </div>
            )}

            {activeActionType === 'meeting' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Sync Session Subject
                  </label>
                  <Input type="text" value={meetingTitle} onChange={(e)=>setMeetingTitle(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Scheduled Date
                  </label>
                  <input type="date" value={meetingDate} onChange={(e)=>setMeetingDate(e.target.value)} className="w-full h-9 px-3 border border-[#CBD5E1] rounded-[6px] text-xs bg-white text-slate-800" />
                </div>
                <Button onClick={handleMeetingSubmit} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 text-xs font-semibold rounded-[6px]">
                  Confirm Briefing Schedules
                </Button>
              </div>
            )}

            {activeActionType === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Recipient Address
                  </label>
                  <Input type="text" value={activeActionContact?.email || ''} disabled className="h-9 text-xs bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Email Subject
                  </label>
                  <Input type="text" value={emailSubject} onChange={(e)=>setEmailSubject(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                    Message Body
                  </label>
                  <Textarea value={emailBody} onChange={(e)=>setEmailBody(e.target.value)} className="min-h-[140px] text-xs font-sans whitespace-pre-wrap" />
                </div>
                <Button onClick={handleSendEmailSubmit} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 text-xs font-semibold rounded-[6px]">
                  Send Message
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#E5E7EB] bg-[#F5F6F8] flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setActiveActionContact(null);
                setActiveActionType(null);
              }}
              className="h-8 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer animate-none"
            >
              Close Panel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Viewport Bulk Operations Bar - Compact, elegant, overlayed at bottom */}
      {selectedContactIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xs text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4.5 z-55 border border-slate-800 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800 font-medium whitespace-nowrap select-none">
            <span className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse"></span>
            <span>Selected <strong className="text-blue-400 font-bold">{selectedContactIds.length}</strong> records</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Select - Reassign Rep */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkAssign(val);
              }}
              className="bg-slate-800 hover:bg-slate-755 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Reassign Rep...</option>
              {CRM_USERS.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>

            {/* Direct Select - Priority level */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkPriorityChange(val as any);
              }}
              className="bg-slate-800 hover:bg-slate-755 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
            >
              <option value="">Priority...</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">💤 Low</option>
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
              onClick={() => setSelectedContactIds([])}
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
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-100">
          <SheetHeader className="p-4 border-b border-[#E5E7EB] bg-slate-50/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-semibold text-[#111827] text-[15px]">Bulk CSV Enterprise Importer</SheetTitle>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center border-0" onClick={() => setShowImportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <span className="text-[12px] text-slate-500 font-medium leading-relaxed block border-none select-none">
              Provide a raw CSV dataset representing customer records. Your column headers should map to:
            </span>

            <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded-[6px] font-mono text-[10px] text-slate-605 leading-normal space-y-1 select-all">
              <span className="block font-bold">Contact Name,Company,Email,Phone,Source,Priority,Deal Value ($),Assigned User</span>
              <span className="block italic text-slate-400">"Diana Prince","Themyscira Exports","diana@exports.io","+1 (555) 777-8888","Partnership","High",45000,"Alex Rivera"</span>
              <span className="block italic text-slate-400">"Wayne Bruce","Wayne Enterprises","bruce@waynecorp.co","+1 (555) 999-0000","Referral","High",125000,"Sarah Jenkins"</span>
            </div>

            <div className="space-y-1.5 flex flex-col h-[280px]">
              <label className="text-xs font-semibold text-slate-700">Paste raw text csv lines:</label>
              <Textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                }}
                placeholder="Paste Comma-Separated Values here..."
                className="flex-1 text-xs font-mono min-h-[160px]"
              />
            </div>

            {csvError && (
              <p className="text-[11px] text-red-650 font-semibold select-none">{csvError}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs font-semibold border-[#CBD5E1] text-[#374151] hover:bg-slate-50 cursor-pointer"
                onClick={handleSimulationImport}
              >
                Autoload Sim Dataset
              </Button>
            </div>
          </div>

          <div className="p-3.5 border-t border-[#E5E7EB] bg-slate-50/50 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setCsvContent('');
                setCsvError('');
              }}
              className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              className="h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[6px] cursor-pointer"
            >
              Submit Enterprise Upload
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
