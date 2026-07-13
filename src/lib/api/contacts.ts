/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Contact, ListResult, ListQuery } from '../../types';
import { apiFetch, toQueryString } from './http';

export interface ContactListQuery extends ListQuery {
  source?: string;
  priority?: string;
  assignedTo?: string;
}

export interface ContactImportResult {
  imported: Contact[];
  importedCount: number;
  errors: { row: number; message: string }[];
}

export const contactsApi = {
  list: (query: ContactListQuery = {}) => apiFetch<ListResult<Contact>>(`/contacts${toQueryString(query)}`),
  create: (input: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) =>
    apiFetch<Contact>('/contacts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Contact>) =>
    apiFetch<Contact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) => apiFetch<{ deleted: number }>('/contacts/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  import: (rows: Record<string, unknown>[]) =>
    apiFetch<ContactImportResult>('/contacts/import', { method: 'POST', body: JSON.stringify({ rows }) }),
};
