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
  company?: string;
}

export interface Contact extends BaseEntity {
  convertedFromLeadId?: string;
}

/**
 * API contract types shared by the route handlers (src/app/api/**) and the
 * typed client (src/lib/api/**). A real backend replacing the mock data
 * layer must keep this envelope so the client layer needs no changes.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    message: string;
    issues?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  company?: string;
}

/**
 * Account (Company) — a first-class entity, separate from the free-text
 * `company` string carried on Lead/Contact/Deal. Real Account records
 * (created explicitly) and "virtual" accounts (auto-derived from a company
 * name that shows up on a lead/contact/deal but has no Account record yet)
 * are unioned together in the Accounts list — see accountsDb.list() in
 * src/lib/mock-db.ts.
 */
export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  description?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  assignedTo: string;
  createdAt: string;
  /** True for auto-derived rows with no real Account record behind them yet. */
  isVirtual?: boolean;
}

export interface AccountRollup {
  account: Account;
  leadCount: number;
  contactCount: number;
  dealCount: number;
  openPipelineValue: number;
  wonValue: number;
}

/**
 * File attachment metadata + mock content (a data URI). There's no real
 * object storage here — this is a frontend-only stand-in. A backend should
 * swap `dataUrl` for a real storage URL and keep the rest of the shape.
 */
export type AttachmentEntityType = 'Lead' | 'Contact' | 'Deal' | 'Account';

export interface Attachment {
  id: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}
