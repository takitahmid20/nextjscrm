/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ────────────────────────────────────────────────────────────────────────
 * MOCK DATA LAYER — the one seam a backend engineer needs to replace.
 * ────────────────────────────────────────────────────────────────────────
 * Every function below is a stand-in for a real database query (Prisma,
 * Drizzle, raw SQL, whatever). The route handlers in src/app/api/** only
 * call these functions and never touch storage directly — so swapping
 * this file for real DB calls (keeping the same function names/signatures)
 * is the entire backend integration. Nothing above this file needs to
 * change.
 *
 * State lives in module-level arrays, so it persists only for the life of
 * the Node process (resets on server restart). That's intentional for a
 * pre-backend demo: multiple browser tabs/devices now see the same data,
 * which localStorage never allowed.
 */

import { Lead, Contact, Deal, CRMTask, Activity, CRMUser, ListResult, Account, Attachment, AttachmentEntityType } from '../types';
import { INITIAL_LEADS, INITIAL_DEALS, INITIAL_TASKS, INITIAL_ACTIVITIES, INITIAL_CONTACTS, CRM_USERS } from '../utils';
import { generateId } from './id';
import { paginateAndFilter } from './list-utils';
import { ListQueryValues } from '../validation';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

let leads: Lead[] = clone(INITIAL_LEADS);
let contacts: Contact[] = clone(INITIAL_CONTACTS);
let deals: Deal[] = clone(INITIAL_DEALS);
let tasks: CRMTask[] = clone(INITIAL_TASKS);
let activities: Activity[] = clone(INITIAL_ACTIVITIES);
let users: CRMUser[] = clone(CRM_USERS);

// ---------------------------------------------------------------------------
// Auth accounts — kept separate from CRMUser so a password never rides
// along with a plain "team member" record used for assignee dropdowns.
// TODO(backend): replace hashPassword/verifyPassword with bcrypt/argon2 and
// this array with a real `accounts` table.
// ---------------------------------------------------------------------------
interface AuthAccount {
  userId: string;
  email: string;
  passwordHash: string;
}

function hashPassword(password: string): string {
  return `mock:${password}`;
}

function verifyPassword(password: string, hash: string): boolean {
  return hash === hashPassword(password);
}

let authAccounts: AuthAccount[] = users.map((u) => ({
  userId: u.id,
  email: u.email,
  passwordHash: hashPassword('password123'),
}));

function nowIso(): string {
  return new Date().toISOString();
}

function logActivity(
  type: Activity['type'],
  description: string,
  user: string,
  entityName?: string,
  value?: number
): Activity {
  const activity: Activity = {
    id: generateId('ACT'),
    timestamp: nowIso(),
    type,
    user,
    description,
    entityName,
    value,
  };
  activities = [activity, ...activities];
  return activity;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export const leadsDb = {
  list(query: ListQueryValues, filters?: { status?: string; source?: string; assignedTo?: string }): ListResult<Lead> {
    return paginateAndFilter(leads, query, {
      searchFields: ['name', 'company', 'email', 'phone'],
      filters,
    });
  },
  get(id: string): Lead | undefined {
    return leads.find((l) => l.id === id);
  },
  create(input: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>, actor: string): Lead {
    const lead: Lead = { ...input, id: generateId('LD'), createdAt: nowIso(), lastActivity: nowIso() };
    leads = [lead, ...leads];
    logActivity('lead_created', `Created lead ${lead.name} (${lead.company}).`, actor, lead.name, lead.dealValue);
    return lead;
  },
  update(id: string, patch: Partial<Lead>, actor: string): Lead | undefined {
    const existing = leads.find((l) => l.id === id);
    if (!existing) return undefined;
    const updated: Lead = { ...existing, ...patch, lastActivity: nowIso() };
    leads = leads.map((l) => (l.id === id ? updated : l));
    if (patch.status && patch.status !== existing.status) {
      logActivity('stage_changed', `Updated status of "${existing.name}" to ${patch.status}.`, actor, existing.name);
    }
    return updated;
  },
  remove(ids: string[], actor: string): void {
    leads = leads.filter((l) => !ids.includes(l.id));
    logActivity('lead_created', `Removed ${ids.length} lead record(s).`, actor);
  },
  bulkCreate(rows: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>[], actor: string): Lead[] {
    const created = rows.map((row) => ({ ...row, id: generateId('LD'), createdAt: nowIso(), lastActivity: nowIso() }));
    leads = [...created, ...leads];
    logActivity('lead_created', `Bulk-imported ${created.length} lead record(s).`, actor);
    return created;
  },
};

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
export const contactsDb = {
  list(query: ListQueryValues, filters?: { source?: string; priority?: string; assignedTo?: string }): ListResult<Contact> {
    return paginateAndFilter(contacts, query, {
      searchFields: ['name', 'company', 'email', 'phone'],
      filters,
    });
  },
  get(id: string): Contact | undefined {
    return contacts.find((c) => c.id === id);
  },
  create(input: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>, actor: string): Contact {
    const contact: Contact = { ...input, id: generateId('CON'), createdAt: nowIso(), lastActivity: nowIso() };
    contacts = [contact, ...contacts];
    logActivity('lead_created', `Added contact ${contact.name} (${contact.company}).`, actor, contact.name);
    return contact;
  },
  update(id: string, patch: Partial<Contact>, actor: string): Contact | undefined {
    const existing = contacts.find((c) => c.id === id);
    if (!existing) return undefined;
    const updated: Contact = { ...existing, ...patch, lastActivity: nowIso() };
    contacts = contacts.map((c) => (c.id === id ? updated : c));
    if (patch.priority && patch.priority !== existing.priority) {
      logActivity('stage_changed', `Updated priority of "${existing.name}" to ${patch.priority}.`, actor, existing.name);
    }
    return updated;
  },
  remove(ids: string[], actor: string): void {
    contacts = contacts.filter((c) => !ids.includes(c.id));
    logActivity('lead_created', `Removed ${ids.length} contact record(s).`, actor);
  },
  bulkCreate(rows: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>[], actor: string): Contact[] {
    const created = rows.map((row) => ({ ...row, id: generateId('CON'), createdAt: nowIso(), lastActivity: nowIso() }));
    contacts = [...created, ...contacts];
    logActivity('lead_created', `Bulk-imported ${created.length} contact record(s).`, actor);
    return created;
  },
};

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------
export const dealsDb = {
  list(query: ListQueryValues, filters?: { stage?: string; status?: string; assignedTo?: string }): ListResult<Deal> {
    return paginateAndFilter(deals, query, {
      searchFields: ['title', 'company', 'contactPerson', 'email'],
      filters,
    });
  },
  get(id: string): Deal | undefined {
    return deals.find((d) => d.id === id);
  },
  create(input: Omit<Deal, 'id' | 'createdAt'>, actor: string): Deal {
    const deal: Deal = { ...input, id: generateId('DL'), createdAt: nowIso() };
    deals = [deal, ...deals];
    logActivity('lead_created', `Drafted opportunity "${deal.title}" for ${deal.company}.`, actor, deal.title, deal.value);
    return deal;
  },
  update(id: string, patch: Partial<Deal>, actor: string): Deal | undefined {
    const existing = deals.find((d) => d.id === id);
    if (!existing) return undefined;
    const updated: Deal = { ...existing, ...patch };
    deals = deals.map((d) => (d.id === id ? updated : d));

    if (patch.stage && patch.stage !== existing.stage) {
      logActivity('stage_changed', `Advanced opportunity "${existing.title}" to stage: ${patch.stage}.`, actor, existing.title, existing.value);
    }
    if (patch.status && patch.status !== existing.status) {
      const type = patch.status === 'Won' ? 'deal_won' : patch.status === 'Lost' ? 'deal_lost' : 'stage_changed';
      const description =
        patch.status === 'Won'
          ? `Closed WON: "${existing.title}" valued at ${existing.value}.`
          : `Closed LOST: "${existing.title}".`;
      logActivity(type, description, actor, existing.title, existing.value);
    }
    if (patch.value !== undefined && patch.value !== existing.value) {
      logActivity('stage_changed', `Updated contract value on "${existing.title}" to ${patch.value}.`, actor, existing.title, patch.value);
    }
    return updated;
  },
  remove(id: string, actor: string): Deal | undefined {
    const existing = deals.find((d) => d.id === id);
    deals = deals.filter((d) => d.id !== id);
    if (existing) logActivity('stage_changed', `Removed opportunity "${existing.title}".`, actor);
    return existing;
  },
  bulkCreate(rows: Omit<Deal, 'id' | 'createdAt'>[], actor: string): Deal[] {
    const created = rows.map((row) => ({ ...row, id: generateId('DL'), createdAt: nowIso() }));
    deals = [...created, ...deals];
    logActivity('lead_created', `Bulk-imported ${created.length} deal record(s).`, actor);
    return created;
  },
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export const tasksDb = {
  list(query: ListQueryValues, filters?: { status?: string; priority?: string; assignedTo?: string }): ListResult<CRMTask> {
    return paginateAndFilter(tasks, query, {
      searchFields: ['title', 'relatedToName'],
      filters,
    });
  },
  get(id: string): CRMTask | undefined {
    return tasks.find((t) => t.id === id);
  },
  create(input: Omit<CRMTask, 'id'>): CRMTask {
    const task: CRMTask = { ...input, id: generateId('TSK') };
    tasks = [task, ...tasks];
    return task;
  },
  update(id: string, patch: Partial<CRMTask>, actor: string): CRMTask | undefined {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return undefined;
    const updated: CRMTask = { ...existing, ...patch };
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    if (patch.status === 'Completed' && existing.status !== 'Completed') {
      logActivity('task_completed', `Completed task: "${existing.title}".`, actor, existing.title);
    }
    return updated;
  },
  remove(id: string): void {
    tasks = tasks.filter((t) => t.id !== id);
  },
  bulkCreate(rows: Omit<CRMTask, 'id'>[]): CRMTask[] {
    const created = rows.map((row) => ({ ...row, id: generateId('TSK') }));
    tasks = [...created, ...tasks];
    return created;
  },
};

// ---------------------------------------------------------------------------
// Activities (read-only feed)
// ---------------------------------------------------------------------------
export const activitiesDb = {
  list(limit = 100): Activity[] {
    return activities.slice(0, limit);
  },
};

// ---------------------------------------------------------------------------
// Team members (CRM_USERS) — real CRUD, backs the Settings > Team page and
// every assignee dropdown in the app.
// ---------------------------------------------------------------------------
export const usersDb = {
  list(): CRMUser[] {
    return users;
  },
  get(id: string): CRMUser | undefined {
    return users.find((u) => u.id === id);
  },
  create(input: Omit<CRMUser, 'id' | 'avatarColor'>): CRMUser {
    const palette = ['bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'];
    const user: CRMUser = { ...input, id: generateId('USR'), avatarColor: palette[users.length % palette.length] };
    users = [...users, user];
    return user;
  },
  update(id: string, patch: Partial<CRMUser>): CRMUser | undefined {
    const existing = users.find((u) => u.id === id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    users = users.map((u) => (u.id === id ? updated : u));
    return updated;
  },
  remove(id: string): void {
    users = users.filter((u) => u.id !== id);
    authAccounts = authAccounts.filter((a) => a.userId !== id);
  },
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authDb = {
  findUserByEmail(email: string): CRMUser | undefined {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById(id: string): CRMUser | undefined {
    return users.find((u) => u.id === id);
  },
  verifyCredentials(email: string, password: string): CRMUser | null {
    const account = authAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || !verifyPassword(password, account.passwordHash)) return null;
    return users.find((u) => u.id === account.userId) ?? null;
  },
  signup(input: { fullName: string; companyName: string; email: string; password: string }): CRMUser | null {
    if (authDb.findUserByEmail(input.email)) return null;
    const user = usersDb.create({ name: input.fullName, email: input.email, role: 'Account Executive', company: input.companyName });
    authAccounts = [...authAccounts, { userId: user.id, email: input.email, passwordHash: hashPassword(input.password) }];
    return user;
  },
  resetPassword(email: string, newPassword: string): boolean {
    const account = authAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) return false;
    account.passwordHash = hashPassword(newPassword);
    return true;
  },

  // TODO(backend): replace with a real one-time-code table + email/SMS dispatch.
  requestOtp(email: string): string {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    return code;
  },
  verifyOtp(email: string, code: string): boolean {
    const entry = otpStore.get(email.toLowerCase());
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) return false;
    otpStore.delete(email.toLowerCase());
    return true;
  },
};

const otpStore = new Map<string, { code: string; expiresAt: number }>();

// ---------------------------------------------------------------------------
// Accounts (Companies)
//
// `accounts` holds real, explicitly-created Account records. Every distinct
// `company` string already sitting on a lead/contact/deal that has no real
// Account record yet is surfaced as a "virtual" account (isVirtual: true,
// id `VACC-<slug>`) so the Accounts list always reflects every company that
// actually appears in the data, not just the ones someone remembered to
// create a record for. Editing a virtual account promotes it to a real one.
// ---------------------------------------------------------------------------
let accounts: Account[] = [];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'account';
}

function distinctCompanyNames(): string[] {
  const names = new Map<string, string>(); // lowercase -> original casing
  [...leads, ...contacts, ...deals].forEach((entity) => {
    const company = entity.company?.trim();
    if (company && !names.has(company.toLowerCase())) {
      names.set(company.toLowerCase(), company);
    }
  });
  return Array.from(names.values());
}

function getAllAccounts(): Account[] {
  const realNames = new Set(accounts.map((a) => a.name.toLowerCase()));
  const virtual: Account[] = distinctCompanyNames()
    .filter((name) => !realNames.has(name.toLowerCase()))
    .map((name) => ({
      id: `VACC-${slugify(name)}`,
      name,
      assignedTo: '',
      createdAt: nowIso(),
      isVirtual: true,
    }));
  return [...accounts, ...virtual];
}

export const accountsDb = {
  list(query: ListQueryValues, filters?: { assignedTo?: string }): ListResult<Account> {
    return paginateAndFilter(getAllAccounts(), query, {
      searchFields: ['name', 'industry'],
      filters,
    });
  },
  get(id: string): Account | undefined {
    return getAllAccounts().find((a) => a.id === id);
  },
  create(input: Omit<Account, 'id' | 'createdAt'>, actor: string): Account {
    const account: Account = { ...input, id: generateId('ACC'), createdAt: nowIso() };
    accounts = [account, ...accounts];
    logActivity('lead_created', `Created account "${account.name}".`, actor, account.name);
    return account;
  },
  update(id: string, patch: Partial<Account>, actor: string): Account | undefined {
    const existing = accounts.find((a) => a.id === id);
    if (existing) {
      const updated: Account = { ...existing, ...patch };
      accounts = accounts.map((a) => (a.id === id ? updated : a));
      return updated;
    }
    // Promoting a virtual (auto-derived) account to a real, editable record.
    const virtual = getAllAccounts().find((a) => a.id === id && a.isVirtual);
    if (!virtual) return undefined;
    const promoted: Account = {
      id: generateId('ACC'),
      name: patch.name ?? virtual.name,
      industry: patch.industry,
      website: patch.website,
      phone: patch.phone,
      description: patch.description,
      billingAddress: patch.billingAddress,
      assignedTo: patch.assignedTo ?? '',
      createdAt: nowIso(),
    };
    accounts = [promoted, ...accounts];
    logActivity('lead_created', `Registered account record for "${promoted.name}".`, actor, promoted.name);
    return promoted;
  },
  remove(id: string): void {
    accounts = accounts.filter((a) => a.id !== id);
  },
  /** Aggregate stats + related records for an account, matched by company name (case-insensitive). */
  rollup(accountName: string) {
    const key = accountName.toLowerCase();
    const relatedLeads = leads.filter((l) => l.company?.toLowerCase() === key);
    const relatedContacts = contacts.filter((c) => c.company?.toLowerCase() === key);
    const relatedDeals = deals.filter((d) => d.company?.toLowerCase() === key);
    return {
      leads: relatedLeads,
      contacts: relatedContacts,
      deals: relatedDeals,
      leadCount: relatedLeads.length,
      contactCount: relatedContacts.length,
      dealCount: relatedDeals.length,
      openPipelineValue: relatedDeals.filter((d) => d.status === 'Open').reduce((sum, d) => sum + d.value, 0),
      wonValue: relatedDeals.filter((d) => d.status === 'Won').reduce((sum, d) => sum + d.value, 0),
    };
  },
};

// ---------------------------------------------------------------------------
// Attachments — metadata + mock file content (data URI). No real object
// storage; a backend should swap `dataUrl` for a real storage URL/key.
// ---------------------------------------------------------------------------
let attachments: Attachment[] = [];

export const attachmentsDb = {
  list(entityType: AttachmentEntityType, entityId: string): Attachment[] {
    return attachments
      .filter((a) => a.entityType === entityType && a.entityId === entityId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
  create(input: Omit<Attachment, 'id' | 'uploadedAt'>): Attachment {
    const attachment: Attachment = { ...input, id: generateId('ATT'), uploadedAt: nowIso() };
    attachments = [attachment, ...attachments];
    return attachment;
  },
  remove(id: string): void {
    attachments = attachments.filter((a) => a.id !== id);
  },
};
