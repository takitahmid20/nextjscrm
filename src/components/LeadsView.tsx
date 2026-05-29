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
  MoreHorizontal
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource } from '../types';
import { CRM_USERS, formatUSD, formatRelativeTime, exportLeadsToCSV, parseCSVToLeads } from '../utils';
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

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => void;
  onUpdateLead: (id: string, updated: Partial<Lead>) => void;
  onDeleteLeads: (ids: string[]) => void;
  onImportLeads: (imported: Partial<Lead>[]) => void;
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
  const [followupDate, setFollowupDate] = useState('2026-06-01');
  const [followupPriority, setFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-06-01');
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

  // Hook Form for enterprise lead creation validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
      assignedTo: 'Sarah Jenkins',
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
  const handleBulkDelete = () => {
    if (confirm(`Do you want to permanently delete these ${selectedLeadIds.length} leads from operations?`)) {
      onDeleteLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    }
  };

  const handleBulkStatusChange = (status: LeadStatus) => {
    selectedLeadIds.forEach(id => {
      onUpdateLead(id, { status, lastActivity: new Date().toISOString() });
    });
    alert(`Bulk operations executed. Updated ${selectedLeadIds.length} records.`);
    setSelectedLeadIds([]);
  };

  const handleBulkAssign = (userName: string) => {
    selectedLeadIds.forEach(id => {
      onUpdateLead(id, { assignedTo: userName, lastActivity: new Date().toISOString() });
    });
    alert(`Bulk assignment executed. ${selectedLeadIds.length} leads assigned to ${userName}.`);
    setSelectedLeadIds([]);
  };

  // Submit new lead form via React Hook Form schema validation
  const handleCreateLeadSubmit = (values: LeadFormValues) => {
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
    };

    if (editingLeadId) {
      onUpdateLead(editingLeadId, {
        ...payload,
        lastActivity: `Lead details updated via unified form`
      });
      alert(`Lead details for "${computedName}" updated successfully.`);
    } else {
      onAddLead({
        ...payload,
        dealValue: Math.floor(Math.random() * 25) * 1000 + 4000, // Standard b2b range
      });
      alert(`New lead "${computedName}" created successfully.`);
    }

    // Reset Form & Close
    reset();
    setEditingLeadId(null);
    setShowAddModal(false);
  };

  // Mock Export CSV action
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

  // Live simulation import trigger
  const handleSimulationImport = () => {
    const simulationContent = `Lead Name,Company,Email,Phone,Deal Value ($),Status,Source,Assigned User\n"Diana Prince","Themyscira Exports","diana@ exports.io","+1 (555) 777-8888",45000,"New","Partnership","Alex Rivera"\n"Wayne Bruce","Wayne Enterprises","bruce@waynecorp.co","+1 (555) 999-0000",125000,"Qualified","Referral","Sarah Jenkins"\n"Clara Kent","Daily Planet Inc","clark@dailyplanet.org","+1 (555) 123-9876",15000,"Working","Cold Call","Elena Rostova"`;
    setCsvContent(simulationContent);
  };

  const handleImportSubmit = () => {
    if (!csvContent.trim()) {
      setCsvError('Please paste or load CSV text content.');
      return;
    }
    try {
      const parsed = parseCSVToLeads(csvContent);
      if (parsed.length === 0) {
        setCsvError('No valid leads parsed. Verify headings structure.');
        return;
      }
      onImportLeads(parsed);
      setShowImportModal(false);
      setCsvContent('');
      setCsvError('');
      alert(`Successfully imported ${parsed.length} enterprise leads.`);
    } catch (e: any) {
      setCsvError('Failed parsing CSV lines. Code: ' + e?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-28px font-semibold text-[#111827] tracking-tight">Leads & Account Entities</h1>
          <p className="text-sm text-[#6B7280]">
            Comprehensive operational customer directory. Sort, batch, and filter pipelines.
          </p>
        </div>
        
        {/* Actions Button Bar */}
        <div id="leads-action-toolbar" className="flex items-center space-x-2.5">
          <Button
            id="btn-import-csv"
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="h-10 px-3.5 bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#111827] hover:text-[#2563EB] text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-[#6B7280]" />
            Import CSV
          </Button>
          
          <Button
            id="btn-export-csv"
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 px-3.5 bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#111827] hover:text-[#2563EB] text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#6B7280]" />
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
                assignedTo: 'Sarah Jenkins',
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
              setShowAddModal(true);
            }}
            className="h-10 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Leads Table Management Toolbar Box - Filters & Sorting */}
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search bar inside toolbar to lock workspace search */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5">
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
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] text-[#111827] text-xs rounded-[6px] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 outline-none"
            />
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto crm-scrollbar">
          <Table id="leads-directory-table" className="w-full text-left text-xs text-[#111827] border-collapse min-w-[1000px]">
            {/* Headers Area */}
            <TableHeader className="bg-[#F5F6F8] font-medium text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-[#E5E7EB]">
              <TableRow>
                <TableHead className="py-3 px-4 w-12 text-center sticky left-0 bg-[#F5F6F8] z-20 border-r border-[#E5E7EB] shadow-[1px_0_0_#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                  />
                </TableHead>
                
                <TableHead 
                  className="py-3 px-4 cursor-pointer hover:bg-gray-105 transition-colors text-xs text-[#6B7280] sticky left-12 bg-[#F5F6F8] z-20 border-r border-slate-200 shadow-[1px_0_0_#CBD5E1] min-w-[200px]"
                  onClick={() => {
                    setSortField('name');
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Lead Name & ID</span>
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-[#2563EB]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#2563EB]" />)}
                  </div>
                </TableHead>

                <TableHead 
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-xs text-[#6B7280]"
                  onClick={() => {
                    setSortField('company');
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Company / Domain</span>
                    {sortField === 'company' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-[#2563EB]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#2563EB]" />)}
                  </div>
                </TableHead>

                <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Contact Info (Email/Phone)</TableHead>
                
                <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Status</TableHead>
                
                <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Acquisition</TableHead>
                
                <TableHead className="py-3 px-4 text-xs text-[#6B7280]">Assigned Manager</TableHead>
                
                <TableHead 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors text-xs text-[#6B7280]"
                  onClick={() => {
                    setSortField('dealValue');
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Deal Value</span>
                    {sortField === 'dealValue' && (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-[#2563EB]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#2563EB]" />)}
                  </div>
                </TableHead>

                <TableHead className="py-3 px-4 text-center text-xs text-[#6B7280] sticky right-0 bg-[#F5F6F8] z-20 border-l border-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {/* Rows Area */}
            <TableBody className="divide-y divide-[#E5E7EB]">
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-[#6B7280]">
                    No corporate leads matched this query. Try widening filtering parameters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  
                  // Clean status highlights
                  let statusBg = 'bg-gray-100 text-gray-800 border-gray-200';
                  if (lead.status === 'Qualified') statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                  else if (lead.status === 'Working' || lead.status === 'Contacted') statusBg = 'bg-blue-50 text-blue-800 border-blue-100';
                  else if (lead.status === 'Nurturing') statusBg = 'bg-indigo-50 text-indigo-800 border-indigo-100';
                  else if (lead.status === 'Unqualified') statusBg = 'bg-red-50 text-red-800 border-red-100';

                  return (
                    <tr 
                      key={lead.id}
                      className={`group h-[52px] transition-colors ${
                        isChecked ? 'bg-[#EFF6FF]/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className={`py-2.5 px-4 text-center sticky left-0 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-r border-[#E5E7EB]`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(lead.id)}
                          className="h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                        />
                      </td>

                      {/* Lead Name & ID */}
                      <td className={`py-2.5 px-4 sticky left-12 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-r border-slate-200 min-w-[200px]`}>
                        <div className="flex flex-col">
                          <a 
                            href={`/lead-details?id=${lead.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              window.history.pushState({ tab: 'lead-details' }, '', `/lead-details?id=${lead.id}`);
                              const popstateEvent = new PopStateEvent('popstate');
                              window.dispatchEvent(popstateEvent);
                            }}
                            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline text-[13px] text-left cursor-pointer"
                          >
                            {lead.name}
                          </a>
                          <span className="text-[10px] uppercase font-mono text-[#6B7280]">{lead.id}</span>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-2.5 px-4 font-medium text-[#111827]">
                        {lead.company}
                      </td>

                      {/* Contact details */}
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col text-[#6B7280]">
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

                      {/* Sourcing Channel */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#6B7280]">
                        {lead.source}
                      </td>

                      {/* Assigned Representative */}
                      <td className="py-2.5 px-4 text-[#111827]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium text-[12px]">{lead.assignedTo}</span>
                        </div>
                      </td>

                      {/* Value mapping */}
                      <td className="py-2.5 px-4 text-right font-semibold text-[#111827]">
                        {formatUSD(lead.dealValue)}
                      </td>

                      {/* Row actions */}
                      <td className={`py-2.5 px-4 text-center sticky right-0 z-10 transition-colors ${isChecked ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-slate-100'} border-l border-slate-200`}>
                        <div className="flex items-center justify-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id={`leads-popover-trigger-${lead.id}`}
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full flex items-center justify-center cursor-pointer"
                              >
                                <MoreVertical className="h-4.5 w-4.5 text-slate-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1 bg-white border border-[#E5E7EB] shadow-lg rounded-md z-40" align="end">
                              <div className="flex flex-col text-xs font-medium">
                                <a
                                  href={`/lead-details?id=${lead.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.history.pushState({ tab: 'lead-details' }, '', `/lead-details?id=${lead.id}`);
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700"
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
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
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
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
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
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
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
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
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
                                    setShowAddModal(true);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
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
                                    setEmailBody(`Hi ${lead.name},\n\nI wanted to reach out regarding our solution proposal...\n\nBest regards,\n${currentUser?.name || 'Sarah Jenkins'}`);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors rounded flex items-center gap-2 text-slate-700 cursor-pointer"
                                >
                                  <Mail className="h-3.5 w-3.5 text-sky-500" />
                                  <span>Send Email</span>
                                </button>

                                <div className="border-t border-slate-100 my-1"></div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
                                      onDeleteLeads([lead.id]);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 transition-colors rounded flex items-center gap-2 cursor-pointer"
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
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer / Unified Pagination Controls */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7280] space-y-3 sm:space-y-0 select-none">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <FormSelect
              value={String(rowsPerPage)}
              onChange={(val) => {
                setRowsPerPage(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { value: '5', label: '5' },
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' }
              ]}
              className="w-16"
            />
            <span>
              Showing {filteredLeads.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filteredLeads.length)} of {filteredLeads.length} records
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#111827] rounded-[4px] disabled:opacity-40"
            >
              First
            </button>
            <button
              id="btn-leads-page-prev"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#111827] rounded-[4px] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] rounded-[4px] font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              id="btn-leads-page-next"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#111827] rounded-[4px] disabled:opacity-40"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#111827] rounded-[4px] disabled:opacity-40"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* SIDE PANEL: ADD NEW CORPORATE LEAD */}
      <Sheet open={showAddModal} onOpenChange={setShowAddModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">
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
            <div className="border border-[#E2E8F0] rounded-[8px] p-4 bg-[#F8FAFC]">
              <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wide mb-3 flex items-center select-none">
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

            <div className="grid grid-cols-4 gap-3">
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
            </div>

            <FormTextarea
              label="Internal notes & activity brief"
              register={register('notes')}
              error={errors.notes?.message}
              placeholder="Insert any relevant context from calls, introductions..."
              rows={3}
            />

            {/* Action Operations */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setEditingLeadId(null);
                  setShowAddModal(false);
                }}
                className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
              >
                Cancel operations
              </Button>
              <Button
                id="btn-lead-form-submit"
                type="submit"
                className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
              >
                {editingLeadId ? 'Update account' : 'Create account'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* SIDE PANEL: IMPORT CSV CONSOLE */}
      <Sheet open={showImportModal} onOpenChange={setShowImportModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
            <div className="flex items-center space-x-2">
              <FolderSync className="h-4.5 w-4.5 text-[#2563EB]" />
              <SheetTitle className="font-semibold text-[#111827] text-[15px]">Bulk CSV Enterprise Importer</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Provide a raw CSV dataset representing customer records. Your column headers should map to:
              <code className="bg-[#EFF6FF] text-[#2563EB] px-1 py-0.5 rounded ml-1 font-mono font-bold text-[10px]">
                Lead Name, Company, Email, Phone, Deal Value ($), Status, Source
              </code>.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#111827]">Insert raw text below:</label>
                <button
                  type="button"
                  onClick={handleSimulationImport}
                  className="text-[11px] text-[#2563EB] hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Load enterprise simulation data
                </button>
              </div>
              <textarea
                rows={7}
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvError('');
                }}
                placeholder='Lead Name,Company,Email,Phone,Deal Value ($),Status,Source&#10;"James Bond","MI6 Logistics","james@bond.gov","+44 (0) 700-007",85000,"Qualified","Referral"'
                className="w-full p-3 font-mono text-[11px] border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB] bg-[#F5F6F8] crm-scrollbar"
              />
              
              {csvError && (
                <p className="text-[11px] text-red-650 font-medium mt-1">{csvError}</p>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[10px] text-[#6B7280]">Supports standard RFC-4180 parsing compliance</span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
                >
                  Discard
                </Button>
                <Button
                  id="btn-import-leads-submit"
                  type="button"
                  onClick={handleImportSubmit}
                  className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
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
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full">
          {showDetailModal && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
                <div>
                  <SheetTitle className="font-semibold text-[#111827] text-[15px]">Lead Account Record Profile</SheetTitle>
                  <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{showDetailModal.id}</p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
                
                <div className="flex items-center space-x-4 pb-4 border-b border-[#E5E7EB]">
                  <div className="bg-[#EFF6FF] h-12 w-12 rounded-[6px] border border-blue-200 text-[#2563EB] flex items-center justify-center font-bold text-lg uppercase">
                    {showDetailModal.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-16px font-bold text-[#111827]">{showDetailModal.name}</h3>
                    <p className="font-semibold text-xs text-[#6B7280]">{showDetailModal.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Corporate Email</span>
                    <p className="font-semibold text-[#111827] mt-0.5">{showDetailModal.email}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Company Contact</span>
                    <p className="font-semibold text-[#111827] mt-0.5">{showDetailModal.phone}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Marketing Sourcing</span>
                    <p className="font-semibold text-[#111827] mt-0.5">{showDetailModal.source}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Corporate Estimated Value</span>
                    <p className="font-semibold text-[#2563EB] mt-0.5 text-14px">{formatUSD(showDetailModal.dealValue)}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Lead Status</span>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 border bg-blue-50 border-blue-100 text-blue-800 rounded-[4px] font-medium text-[11px]">
                        {showDetailModal.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B7280] opacity-90">Representative in Charge</span>
                    <p className="font-semibold text-[#111827] mt-0.5">{showDetailModal.assignedTo}</p>
                  </div>
                </div>

                <div className="bg-[#F5F6F8] p-3 border border-[#E5E7EB] rounded-[6px]">
                  <span className="text-[11px] font-semibold text-[#6B7280] block mb-1">CRM Log Notes:</span>
                  <p className="text-xs text-[#111827] leading-relaxed font-sans">
                    {showDetailModal.notes || 'No notes are attached to this customer file record.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Registered system trace: {formatRelativeTime(showDetailModal.createdAt)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDetailModal(null)}
                    className="h-9 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 font-medium cursor-pointer"
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
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#E5E7EB] shadow-2xl p-0 flex flex-col h-full z-50">
          {activeActionLead && activeActionType && (
            <>
              <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F6F8]">
                <div>
                  <SheetTitle className="font-semibold text-[#111827] text-[15px] capitalize">
                    {activeActionType === 'notes' && 'Add Corporate Log Note'}
                    {activeActionType === 'followup' && 'Schedule Customer Followup'}
                    {activeActionType === 'meeting' && 'Set Corporate Briefing Meeting'}
                    {activeActionType === 'assignee' && 'Reassign Account Representative'}
                    {activeActionType === 'email' && 'Dispatch Corporate Email Message'}
                  </SheetTitle>
                  <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                    Lead: {activeActionLead.name} ({activeActionLead.company})
                  </p>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar text-xs">
                {/* 1. NOTES ACTION FORM */}
                {activeActionType === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none text-[11.5px]">
                        Note Content Text
                      </label>
                      <textarea
                        rows={6}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Type standard enterprise call brief or feedback comments..."
                        className="w-full p-3 font-sans text-xs border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB] bg-[#F5F6F8] crm-scrollbar"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!noteContent) {
                          alert('Note content is required.');
                          return;
                        }
                        const rawHistory = activeActionLead.notes_history || [];
                        const newNote = {
                          id: `NOTE-${Date.now()}`,
                          content: noteContent,
                          date: new Date().toISOString().slice(0, 10),
                          author: currentUser?.name || 'Sarah Jenkins'
                        };
                        onUpdateLead(activeActionLead.id, {
                          notes_history: [...rawHistory, newNote],
                          notes: noteContent
                        });
                        alert(`Note added successfully to ${activeActionLead.name}.`);
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Save CRM Log Note
                    </Button>
                  </div>
                )}

                {/* 2. FOLLOWUP ACTION FORM */}
                {activeActionType === 'followup' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Followup Task Title
                      </label>
                      <Input
                        type="text"
                        value={followupTitle}
                        onChange={(e) => setFollowupTitle(e.target.value)}
                        placeholder="e.g. Call back regarding pricing models"
                        className="w-full h-9 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] pb-1.5 pt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                          Task Urgency Priority
                        </label>
                        <select
                          value={followupPriority}
                          onChange={(e) => setFollowupPriority(e.target.value as any)}
                          className="w-full h-9 px-3 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none focus:border-[#2563EB]"
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
                          alert('Followup title is required.');
                          return;
                        }
                        addTask({
                          title: followupTitle,
                          dueDate: followupDate,
                          priority: followupPriority,
                          status: 'Pending',
                          assignedTo: activeActionLead.assignedTo || 'Sarah Jenkins',
                          category: 'Follow-up',
                          relatedToType: 'Lead',
                          relatedToName: activeActionLead.name
                        });
                        alert(`Followup task scheduled for ${activeActionLead.name}.`);
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Schedule Task
                    </Button>
                  </div>
                )}

                {/* 3. SET MEETING ACTION FORM */}
                {activeActionType === 'meeting' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Briefing / Meeting Subject
                      </label>
                      <Input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="e.g. Solution demo presentation"
                        className="w-full h-9 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
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
                          alert('Meeting subject is required.');
                          return;
                        }
                        addTask({
                          title: `${meetingTitle} (Meeting)`,
                          dueDate: meetingDate,
                          priority: 'High',
                          status: 'Pending',
                          assignedTo: activeActionLead.assignedTo || 'Sarah Jenkins',
                          category: 'Meeting',
                          relatedToType: 'Lead',
                          relatedToName: activeActionLead.name
                        });
                        alert(`Meeting booked with ${activeActionLead.name}.`);
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Book Meeting
                    </Button>
                  </div>
                )}

                {/* 4. CHANGE ASSIGNEE FORM */}
                {activeActionType === 'assignee' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Select Representative
                      </label>
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] outline-none focus:border-[#2563EB]"
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
                        alert(`Lead updated. Reassigned to ${selectedAssignee}.`);
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Change Representative
                    </Button>
                  </div>
                )}

                {/* 5. SEND EMAIL ACTION FORM */}
                {activeActionType === 'email' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Recipient Address
                      </label>
                      <Input
                        type="text"
                        disabled
                        value={activeActionLead.email}
                        className="w-full h-9 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F3F4F6] text-slate-500 cursor-not-allowed pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Email Subject
                      </label>
                      <Input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject..."
                        className="w-full h-9 text-xs border border-[#E5E7EB] rounded-[6px] bg-[#F5F6F8] pb-1.5 pt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
                        Mail Body Content
                      </label>
                      <textarea
                        rows={6}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Body..."
                        className="w-full p-3 font-sans text-xs border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB] bg-[#F5F6F8] crm-scrollbar"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!emailSubject || !emailBody) {
                          alert('Email subject and body are required.');
                          return;
                        }
                        // Add activity to show an email was sent trace log
                        onUpdateLead(activeActionLead.id, {
                          lastActivity: `Core corporate email sent regarding "${emailSubject}"`
                        });
                        alert(`Corporate email dispatched successfully to ${activeActionLead.email}.`);
                        setActiveActionLead(null);
                        setActiveActionType(null);
                      }}
                      className="w-full h-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-[6px] cursor-pointer"
                    >
                      Send Message
                    </Button>
                  </div>
                )}


              </div>

              <div className="p-3 border-t border-[#E5E7EB] bg-[#F5F6F8] flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setActiveActionLead(null);
                    setActiveActionType(null);
                  }}
                  className="h-8 px-4 border border-[#E5E7EB] text-xs text-[#111827] bg-white rounded-[6px] hover:bg-slate-50 cursor-pointer"
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
            <span className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse"></span>
            <span>Selected <strong className="text-blue-400 font-bold">{selectedLeadIds.length}</strong> records</span>
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
              <option value="">Reassign To...</option>
              {CRM_USERS.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>

            {/* Direct Select - Change Status */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleBulkStatusChange(val as LeadStatus);
              }}
              className="bg-slate-800 hover:bg-slate-755 border border-slate-700 text-white rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors max-w-[130px] truncate"
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
