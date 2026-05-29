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
  FolderSync
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
import { FormInput, FormSelect, FormTextarea } from './forms/FormControls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  // Navigation & Page sizes
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'New',
      source: 'Website',
      assignedTo: 'Sarah Jenkins',
      notes: '',
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
    // Assign a default deal value depending on random seed or set to constant
    onAddLead({
      name: values.name,
      company: values.company,
      email: values.email || 'info@' + values.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
      phone: values.phone || '+1 (555) 000-0000',
      status: values.status,
      source: values.source,
      assignedTo: values.assignedTo,
      notes: values.notes,
      dealValue: Math.floor(Math.random() * 25) * 1000 + 4000 // Standard b2b range
    });

    // Reset Form & Close
    reset();
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
            onClick={() => setShowAddModal(true)}
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
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5">
              Operational Status
            </label>
            <select
              id="leads-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] text-xs text-[#111827] rounded-[6px] outline-none cursor-pointer focus:border-[#2563EB]"
            >
              <option value="All">All Lead Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Filter Lead Source */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5">
              Acquisition Sourcing
            </label>
            <select
              id="leads-source-filter"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] text-xs text-[#111827] rounded-[6px] outline-none cursor-pointer focus:border-[#2563EB]"
            >
              <option value="All">All Acquisition Channels</option>
              {sourceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Filter Assigned Representative */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B7280] mb-1.5">
              Assigned Representative
            </label>
            <select
              id="leads-user-filter"
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] text-xs text-[#111827] rounded-[6px] outline-none cursor-pointer focus:border-[#2563EB]"
            >
              <option value="All">All Sales Reps</option>
              {CRM_USERS.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Batch Bulk Operations bar - Active ONLY when checkboxes are marked */}
        {selectedLeadIds.length > 0 && (
          <div 
            id="leads-bulk-actions-panel"
            className="mt-4 p-3 bg-[#EFF6FF] border border-[#2563EB]/25 rounded-[6px] flex flex-col sm:flex-row items-center justify-between text-xs space-y-2 sm:space-y-0"
          >
            <span className="font-medium text-[#2563EB]">
              Selected <strong>{selectedLeadIds.length}</strong> enterprise records
            </span>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#6B7280] text-[11px]">Batch Actions:</span>
              
              {/* Batch assign */}
              <select
                onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
                defaultValue=""
                className="bg-white border border-[#E5E7EB] px-2.5 py-1.5 rounded-[4px] text-xs outline-none cursor-pointer text-[#111827]"
              >
                <option value="" disabled>Reassign Rep...</option>
                {CRM_USERS.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>

              {/* Batch status change */}
              <select
                onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value as LeadStatus)}
                defaultValue=""
                className="bg-white border border-[#E5E7EB] px-2.5 py-1.5 rounded-[4px] text-xs outline-none cursor-pointer text-[#111827]"
              >
                <option value="" disabled>Change Status...</option>
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <Button
                id="btn-bulk-delete"
                onClick={handleBulkDelete}
                variant="outline"
                className="bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Enterprise-grade Leads Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto crm-scrollbar">
          <Table id="leads-directory-table" className="w-full text-left text-xs text-[#111827] border-collapse min-w-[1000px]">
            {/* Headers Area */}
            <TableHeader className="bg-[#F5F6F8] font-medium text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-[#E5E7EB]">
              <TableRow>
                <TableHead className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                  />
                </TableHead>
                
                <TableHead 
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-xs text-[#6B7280]"
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

                <TableHead className="py-3 px-4 text-center text-xs text-[#6B7280]">Actions</TableHead>
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
                      className={`h-[52px] hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-[#EFF6FF]/40' : ''
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(lead.id)}
                          className="h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                        />
                      </td>

                      {/* Lead Name & ID */}
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <a
                            id={`btn-view-lead-${lead.id}`}
                            href={`/lead-details?id=${lead.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              window.history.pushState({ tab: 'lead-details' }, '', `/lead-details?id=${lead.id}`);
                              const popstateEvent = new PopStateEvent('popstate');
                              window.dispatchEvent(popstateEvent);
                            }}
                            className="p-1 hover:bg-[#EFF6FF] rounded text-[#6B7280] hover:text-[#2563EB] transition-colors cursor-pointer"
                            title="Review full operational records"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          
                          {/* Quick promote trigger */}
                          <button
                            id={`btn-working-lead-${lead.id}`}
                            onClick={() => {
                              onUpdateLead(lead.id, { status: 'Working', lastActivity: new Date().toISOString() });
                              alert(`Lead ${lead.name} marked as Working.`);
                            }}
                            className="p-1 hover:bg-[#EFF6FF] rounded text-[#6B7280] hover:text-[#2563EB] transition-colors text-[10px] font-medium"
                            title="Set working status"
                            disabled={lead.status === 'Working'}
                          >
                            Working
                          </button>
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
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-[#E5E7EB] rounded-[4px] px-1.5 py-1 bg-white"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
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
            <SheetTitle className="font-semibold text-[#111827] text-[15px]">Create Lead Account Record</SheetTitle>
          </SheetHeader>

          {/* Form */}
          <form onSubmit={handleSubmit(handleCreateLeadSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 crm-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Lead full name"
                register={register('name')}
                error={errors.name?.message}
                required
                placeholder="e.g. Robert Downey"
              />

              <FormInput
                label="Company name"
                register={register('company')}
                error={errors.company?.message}
                required
                placeholder="e.g. Stark Industries"
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

            <div className="grid grid-cols-3 gap-3">
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
                Create account
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

    </div>
  );
}
