/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadStatus = 'New' | 'Contacted' | 'Working' | 'Qualified' | 'Nurturing' | 'Unqualified';
export type LeadSource = 'Website' | 'Referral' | 'Cold Call' | 'Inbound' | 'LinkedIn' | 'Ad Campaign' | 'Partnership';

export interface BaseEntity {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  assignedTo: string; // User ID or Name
  lastActivity: string; // ISO date or descriptive string
  createdAt: string;
  notes?: string;
  notes_history?: Array<{ id: string; content: string; date: string; author: string }>;
  companyWebsite?: string;
  facebook?: string;
  emailOptOut?: boolean;
  addressInfo?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  priority?: 'Low' | 'Medium' | 'High';
  dealValue?: number;
}

export interface Lead extends BaseEntity {
  status: LeadStatus;
  dealValue: number; // Override to be required
}

export type DealStage = 'Lead In' | 'Contact Made' | 'Demo Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: DealStage;
  status: 'Open' | 'Won' | 'Lost';
  contactPerson: string;
  email: string;
  phone: string;
  expectedCloseDate: string;
  assignedTo: string;
  createdAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface CRMTask {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  category: 'Call' | 'Email' | 'Meeting' | 'Proposal' | 'Follow-up' | 'Task';
  relatedToType: 'Lead' | 'Deal' | 'None';
  relatedToName?: string;
}

export interface Activity {
  id: string;
  timestamp: string;
  type: 'lead_created' | 'deal_won' | 'deal_lost' | 'task_completed' | 'email_sent' | 'call_logged' | 'stage_changed';
  user: string;
  description: string;
  entityName?: string;
  value?: number;
}

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
}

export interface Contact extends BaseEntity {
  convertedFromLeadId?: string;
}
