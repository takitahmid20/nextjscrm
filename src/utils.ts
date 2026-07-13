/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, Deal, CRMTask, Activity, CRMUser, Contact } from './types';

export const CRM_USERS: CRMUser[] = [
  { id: '1', name: 'Sarah Jenkins', email: 's.jenkins@acme.corp', role: 'Sales Director', avatarColor: 'bg-emerald-600' },
  { id: '2', name: 'Alex Rivera', email: 'a.rivera@acme.corp', role: 'Account Executive', avatarColor: 'bg-blue-600' },
  { id: '3', name: 'Marcus Brody', email: 'm.brody@acme.corp', role: 'Sales Specialist', avatarColor: 'bg-indigo-600' },
  { id: '4', name: 'Elena Rostova', email: 'e.rostova@acme.corp', role: 'Business Development', avatarColor: 'bg-amber-600' },
  { id: '5', name: 'David Vance', email: 'd.vance@acme.corp', role: 'Account Executive', avatarColor: 'bg-rose-600' },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'LD-101',
    name: 'Robert Chen',
    company: 'Apex Technologies',
    email: 'rchen@apextech.io',
    phone: '+1 (555) 234-5678',
    status: 'Qualified',
    source: 'Website',
    assignedTo: 'Alex Rivera',
    lastActivity: '2026-05-26T14:30:00Z',
    dealValue: 24500,
    createdAt: '2026-05-15T09:12:00Z',
    notes: 'Very interested in our core enterprise plan. Requested a demo next Wednesday.'
  },
  {
    id: 'LD-102',
    name: 'Miriam Vance',
    company: 'Global Retail Corp',
    email: 'mvance@globalretail.com',
    phone: '+1 (555) 876-5432',
    status: 'Contacted',
    source: 'Inbound',
    assignedTo: 'Marcus Brody',
    lastActivity: '2026-05-28T10:15:00Z',
    dealValue: 12000,
    createdAt: '2026-05-20T11:45:00Z',
    notes: 'Followed up via phone. Wants to negotiate pricing for 50 licenses.'
  },
  {
    id: 'LD-103',
    name: 'Jonathan Miller',
    company: 'Silverline Consulting',
    email: 'jmiller@silverline.co',
    phone: '+1 (555) 345-6789',
    status: 'Working',
    source: 'LinkedIn',
    assignedTo: 'Elena Rostova',
    lastActivity: '2026-05-27T16:45:00Z',
    dealValue: 8500,
    createdAt: '2026-05-22T14:20:00Z',
    notes: 'Reached out through a warm connection. Sent product brochure.'
  },
  {
    id: 'LD-104',
    name: 'Emily Watson',
    company: 'BioHealth Labs',
    email: 'e.watson@biohealth.info',
    phone: '+1 (555) 456-7890',
    status: 'New',
    source: 'Referral',
    assignedTo: 'Sarah Jenkins',
    lastActivity: '2026-05-28T09:00:00Z',
    dealValue: 48000,
    createdAt: '2026-05-28T08:30:00Z',
    notes: 'Introduced by CEO. Large target medical manufacturing company.'
  },
  {
    id: 'LD-105',
    name: 'Garth Hudson',
    company: 'Bandwidth Media',
    email: 'garth@bandwidth.media',
    phone: '+1 (555) 901-1234',
    status: 'Nurturing',
    source: 'Ad Campaign',
    assignedTo: 'David Vance',
    lastActivity: '2026-05-12T13:00:00Z',
    dealValue: 15000,
    createdAt: '2026-04-10T10:00:00Z',
    notes: 'Downloaded whitepaper. Budget has been delayed until Q3.'
  },
  {
    id: 'LD-106',
    name: 'Patricia Finch',
    company: 'Summit Real Estate',
    email: 'pfinch@summit-re.com',
    phone: '+1 (555) 567-8901',
    status: 'Unqualified',
    source: 'Cold Call',
    assignedTo: 'David Vance',
    lastActivity: '2026-05-25T11:00:00Z',
    dealValue: 4500,
    createdAt: '2026-05-24T15:00:00Z',
    notes: 'Company is too small for our integration requirements.'
  },
  {
    id: 'LD-107',
    name: 'Zane Malik',
    company: 'Alpha Logistics',
    email: 'z.malik@alphalogistics.com',
    phone: '+1 (555) 678-9012',
    status: 'Working',
    source: 'Partnership',
    assignedTo: 'Elena Rostova',
    lastActivity: '2026-05-28T16:20:00Z',
    dealValue: 32000,
    createdAt: '2026-05-18T08:45:00Z',
    notes: 'Interested in freight tracker integration. Currently setting up a trial account.'
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'DL-201',
    title: 'Enterprise ERP Integration',
    company: 'Apex Technologies',
    value: 24500,
    stage: 'Demo Scheduled',
    status: 'Open',
    contactPerson: 'Robert Chen',
    email: 'rchen@apextech.io',
    phone: '+1 (555) 234-5678',
    expectedCloseDate: '2026-07-15',
    assignedTo: 'Alex Rivera',
    createdAt: '2026-05-15T09:12:00Z'
  },
  {
    id: 'DL-202',
    title: '50-Seat Annual Subscription',
    company: 'Global Retail Corp',
    value: 12000,
    stage: 'Negotiation',
    status: 'Open',
    contactPerson: 'Miriam Vance',
    email: 'mvance@globalretail.com',
    phone: '+1 (555) 876-5432',
    expectedCloseDate: '2026-06-30',
    assignedTo: 'Marcus Brody',
    createdAt: '2026-05-20T11:45:00Z'
  },
  {
    id: 'DL-203',
    title: 'Custom API Consulting Contract',
    company: 'Silverline Consulting',
    value: 8500,
    stage: 'Proposal Sent',
    status: 'Open',
    contactPerson: 'Jonathan Miller',
    email: 'jmiller@silverline.co',
    phone: '+1 (555) 345-6789',
    expectedCloseDate: '2026-06-15',
    assignedTo: 'Elena Rostova',
    createdAt: '2026-05-22T14:20:00Z'
  },
  {
    id: 'DL-204',
    title: 'Fleet Automation Upgrade',
    company: 'Delta Freight Lines',
    value: 65000,
    stage: 'Won',
    status: 'Won',
    contactPerson: 'Thomas Miller',
    email: 't.miller@deltafreight.com',
    phone: '+1 (555) 789-0123',
    expectedCloseDate: '2026-05-25',
    assignedTo: 'Sarah Jenkins',
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'DL-205',
    title: 'CRM Support Contract Year 1',
    company: 'Nova Media Group',
    value: 9200,
    stage: 'Lost',
    status: 'Lost',
    contactPerson: 'Helena Carter',
    email: 'h.carter@novamedia.com',
    phone: '+1 (555) 890-1234',
    expectedCloseDate: '2026-05-20',
    assignedTo: 'David Vance',
    createdAt: '2026-04-20T11:00:00Z'
  },
  {
    id: 'DL-206',
    title: 'Supply Chain Tracking Contract',
    company: 'Alpha Logistics',
    value: 32000,
    stage: 'Contact Made',
    status: 'Open',
    contactPerson: 'Zane Malik',
    email: 'z.malik@alphalogistics.com',
    phone: '+1 (555) 678-9012',
    expectedCloseDate: '2026-08-01',
    assignedTo: 'Elena Rostova',
    createdAt: '2026-05-18T08:45:00Z'
  }
];

export const INITIAL_TASKS: CRMTask[] = [
  {
    id: 'TSK-301',
    title: 'Prepare Slide Deck for Apex Technologies',
    dueDate: '2026-06-02',
    priority: 'High',
    status: 'Pending',
    assignedTo: 'Alex Rivera',
    category: 'Proposal',
    relatedToType: 'Deal',
    relatedToName: 'Enterprise ERP Integration'
  },
  {
    id: 'TSK-302',
    title: 'Follow up with Miriam Vance on licensing numbers',
    dueDate: '2026-05-30',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: 'Marcus Brody',
    category: 'Call',
    relatedToType: 'Lead',
    relatedToName: 'Miriam Vance'
  },
  {
    id: 'TSK-303',
    title: 'Draft standard SLA agreement document',
    dueDate: '2026-06-10',
    priority: 'Low',
    status: 'Pending',
    assignedTo: 'Sarah Jenkins',
    category: 'Task',
    relatedToType: 'None'
  },
  {
    id: 'TSK-304',
    title: 'Send trial account setups for Alpha Logistics',
    dueDate: '2026-05-29',
    priority: 'High',
    status: 'Pending',
    assignedTo: 'Elena Rostova',
    category: 'Email',
    relatedToType: 'Lead',
    relatedToName: 'Zane Malik'
  },
  {
    id: 'TSK-305',
    title: 'Complete pricing review with leadership team',
    dueDate: '2026-05-27',
    priority: 'High',
    status: 'Completed',
    assignedTo: 'Sarah Jenkins',
    category: 'Meeting',
    relatedToType: 'None'
  },
  {
    id: 'TSK-306',
    title: 'Log introduction call comments',
    dueDate: '2026-05-28',
    priority: 'Low',
    status: 'Completed',
    assignedTo: 'Elena Rostova',
    category: 'Follow-up',
    relatedToType: 'Lead',
    relatedToName: 'Jonathan Miller'
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'ACT-401',
    timestamp: '2026-05-28T16:20:00Z',
    type: 'call_logged',
    user: 'Elena Rostova',
    description: 'Logged an outbound phone call with Zane Malik (Alpha Logistics). Walked through API availability.',
    entityName: 'Zane Malik'
  },
  {
    id: 'ACT-402',
    timestamp: '2026-05-28T10:15:00Z',
    type: 'stage_changed',
    user: 'Marcus Brody',
    description: 'Moved deal "50-Seat Annual Subscription" to Negotiation.',
    entityName: '50-Seat Annual Subscription',
    value: 12000
  },
  {
    id: 'ACT-403',
    timestamp: '2026-05-28T09:00:00Z',
    type: 'lead_created',
    user: 'Sarah Jenkins',
    description: 'Created new high-value lead Emily Watson (BioHealth Labs).',
    entityName: 'Emily Watson',
    value: 48000
  },
  {
    id: 'ACT-404',
    timestamp: '2026-05-27T17:00:00Z',
    type: 'task_completed',
    user: 'Sarah Jenkins',
    description: 'Completed meeting task: "Complete pricing review with leadership team".',
    entityName: 'Pricing Review'
  },
  {
    id: 'ACT-405',
    timestamp: '2026-05-25T14:30:00Z',
    type: 'deal_won',
    user: 'Sarah Jenkins',
    description: 'Marked deal "Fleet Automation Upgrade" as WON!',
    entityName: 'Fleet Automation Upgrade',
    value: 65000
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'CON-501',
    name: 'Thomas Miller',
    company: 'Delta Freight Lines',
    email: 't.miller@deltafreight.com',
    phone: '+1 (555) 789-0123',
    source: 'Referral',
    assignedTo: 'Sarah Jenkins',
    lastActivity: '2026-05-25T14:30:00Z',
    createdAt: '2026-05-01T10:00:00Z',
    notes: 'Successfully converted from lead. The Fleet Automation Upgrade deal was completed successfully!',
    dealValue: 65000
  },
  {
    id: 'CON-502',
    name: 'Helena Carter',
    company: 'Nova Media Group',
    email: 'h.carter@novamedia.com',
    phone: '+1 (555) 890-1234',
    source: 'Website',
    assignedTo: 'David Vance',
    lastActivity: '2026-05-20T11:00:00Z',
    createdAt: '2026-04-20T11:00:00Z',
    notes: 'Converted client. Main point of contact for Nova Media enterprise profile.',
    dealValue: 9200
  }
];

function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return fallback;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
}

// Localstorage state management helpers
export function getSavedCRMData() {
  if (typeof window === 'undefined') {
    return {
      leads: INITIAL_LEADS,
      deals: INITIAL_DEALS,
      tasks: INITIAL_TASKS,
      activities: INITIAL_ACTIVITIES,
      contacts: INITIAL_CONTACTS,
    };
  }

  return {
    leads: safeParse('crm_leads', INITIAL_LEADS),
    deals: safeParse('crm_deals', INITIAL_DEALS),
    tasks: safeParse('crm_tasks', INITIAL_TASKS),
    activities: safeParse('crm_activities', INITIAL_ACTIVITIES),
    contacts: safeParse('crm_contacts', INITIAL_CONTACTS),
  };
}

export function saveCRMData(leads: Lead[], deals: Deal[], tasks: CRMTask[], activities: Activity[], contacts?: Contact[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crm_leads', JSON.stringify(leads));
  localStorage.setItem('crm_deals', JSON.stringify(deals));
  localStorage.setItem('crm_tasks', JSON.stringify(tasks));
  localStorage.setItem('crm_activities', JSON.stringify(activities));
  if (contacts !== undefined) {
    localStorage.setItem('crm_contacts', JSON.stringify(contacts));
  }
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Generic export CSV helper
export function exportToCSV<T>(
  data: T[],
  headers: string[],
  rowMapper: (item: T) => any[]
): string {
  const rows = data.map(item => rowMapper(item).map(val => {
    const strVal = String(val ?? '');
    return `"${strVal.replace(/"/g, '""')}"`;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

// Generic parse CSV helper
export function parseCSV<T>(
  csvText: string,
  rowBuilder: (fields: Record<string, string>) => T | null
): T[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const fieldsRecord: Record<string, string> = {};
    headers.forEach((header, index) => {
      fieldsRecord[header] = values[index] || '';
    });

    const parsed = rowBuilder(fieldsRecord);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

export function exportLeadsToCSV(leads: Lead[]): string {
  const headers = ['ID', 'Lead Name', 'Company', 'Email', 'Phone', 'Status', 'Source', 'Deal Value ($)', 'Assigned User', 'Created At'];
  return exportToCSV(leads, headers, l => [
    l.id,
    l.name,
    l.company,
    l.email,
    l.phone,
    l.status,
    l.source,
    l.dealValue,
    l.assignedTo,
    l.createdAt
  ]);
}

export function parseCSVToLeads(csvText: string): Partial<Lead>[] {
  return parseCSV<Partial<Lead>>(csvText, fields => {
    const name = fields['lead name'] || fields['name'] || '';
    const company = fields['company'] || '';
    if (!name && !company) return null;
    
    return {
      name,
      company,
      email: fields['email'] || '',
      phone: fields['phone'] || '',
      dealValue: Number(fields['deal value ($)']) || Number(fields['value']) || 0,
      status: fields['status'] as any,
      source: fields['source'] as any,
      assignedTo: fields['assigned user'] || fields['assignedto'] || '',
    };
  });
}

export function exportContactsToCSV(contacts: Contact[]): string {
  const headers = ['ID', 'Contact Name', 'Company', 'Email', 'Phone', 'Source', 'Priority', 'Deal Value ($)', 'Assigned User', 'Created At'];
  return exportToCSV(contacts, headers, c => [
    c.id,
    c.name,
    c.company,
    c.email || '',
    c.phone || '',
    c.source,
    c.priority || 'Medium',
    c.dealValue || 0,
    c.assignedTo || '',
    c.createdAt
  ]);
}

export function parseCSVToContacts(csvText: string): Partial<Contact>[] {
  return parseCSV<Partial<Contact>>(csvText, fields => {
    const name = fields['contact name'] || fields['name'] || '';
    const company = fields['company'] || '';
    if (!name && !company) return null;

    return {
      name,
      company,
      email: fields['email'] || '',
      phone: fields['phone'] || '',
      source: fields['source'] as any,
      priority: fields['priority'] as any,
      dealValue: Number(fields['deal value ($)']) || Number(fields['val']) || Number(fields['value']) || 0,
      assignedTo: fields['assigned user'] || fields['assignedto'] || '',
    };
  });
}

export function exportDealsToCSV(deals: Deal[]): string {
  const headers = ['ID', 'Deal Title', 'Company', 'Value ($)', 'Stage', 'Status', 'Contact Person', 'Email', 'Phone', 'Expected Close Date', 'Assigned User', 'Created At'];
  return exportToCSV(deals, headers, d => [
    d.id,
    d.title,
    d.company,
    d.value,
    d.stage,
    d.status,
    d.contactPerson,
    d.email,
    d.phone,
    d.expectedCloseDate,
    d.assignedTo,
    d.createdAt
  ]);
}

export function parseCSVToDeals(csvText: string): Partial<Deal>[] {
  return parseCSV<Partial<Deal>>(csvText, fields => {
    const title = fields['deal title'] || fields['title'] || '';
    const company = fields['company'] || '';
    if (!title && !company) return null;

    return {
      title,
      company,
      value: Number(fields['value ($)']) || Number(fields['value']) || 0,
      stage: fields['stage'] as any,
      contactPerson: fields['contact person'] || fields['contactperson'] || '',
      email: fields['email'] || '',
      phone: fields['phone'] || '',
      expectedCloseDate: fields['expected close date'] || fields['expectedclosedate'] || '',
      assignedTo: fields['assigned user'] || fields['assignedto'] || '',
    };
  });
}

export function exportTasksToCSV(tasks: CRMTask[]): string {
  const headers = ['ID', 'Task Title', 'Due Date', 'Priority', 'Status', 'Category', 'Assigned User'];
  return exportToCSV(tasks, headers, t => [
    t.id,
    t.title,
    t.dueDate,
    t.priority,
    t.status,
    t.category,
    t.assignedTo
  ]);
}

export function parseCSVToTasks(csvText: string): Partial<CRMTask>[] {
  return parseCSV<Partial<CRMTask>>(csvText, fields => {
    const title = fields['task title'] || fields['title'] || '';
    if (!title) return null;

    return {
      title,
      dueDate: fields['due date'] || fields['duedate'] || '',
      priority: fields['priority'] as any,
      category: fields['category'] as any,
      assignedTo: fields['assigned user'] || fields['assignedto'] || '',
    };
  });
}

/**
 * Simple deterministic lead score (0-100), a stand-in for the kind of
 * behavioral/engagement scoring a real marketing-automation integration
 * would feed in. Weighs pipeline status, acquisition channel, and how
 * recently the lead came in — three signals that are honestly derivable
 * from data this app actually has.
 */
const LEAD_STATUS_SCORE: Record<Lead['status'], number> = {
  Qualified: 80,
  Working: 60,
  Nurturing: 50,
  Contacted: 40,
  New: 20,
  Unqualified: 0,
};

const LEAD_SOURCE_SCORE: Record<Lead['source'], number> = {
  Referral: 15,
  Partnership: 15,
  Website: 10,
  Inbound: 10,
  LinkedIn: 8,
  'Ad Campaign': 5,
  'Cold Call': 0,
};

export function computeLeadScore(lead: Lead): number {
  const statusScore = LEAD_STATUS_SCORE[lead.status] ?? 0;
  const sourceScore = LEAD_SOURCE_SCORE[lead.source] ?? 0;

  const ageDays = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = ageDays <= 7 ? 10 : ageDays <= 30 ? 5 : 0;

  return Math.max(0, Math.min(100, statusScore + sourceScore + recencyScore));
}

export function leadScoreTier(score: number): 'Hot' | 'Warm' | 'Cool' {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cool';
}
