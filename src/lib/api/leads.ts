/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, ListResult, ListQuery } from '../../types';
import { apiFetch, toQueryString } from './http';

export interface LeadListQuery extends ListQuery {
  status?: string;
  source?: string;
  assignedTo?: string;
}

export interface LeadImportResult {
  imported: Lead[];
  importedCount: number;
  errors: { row: number; message: string }[];
}

export const leadsApi = {
  list: (query: LeadListQuery = {}) => apiFetch<ListResult<Lead>>(`/leads${toQueryString(query)}`),
  create: (input: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) =>
    apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Lead>) => apiFetch<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/leads/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) => apiFetch<{ deleted: number }>('/leads/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  import: (rows: Record<string, unknown>[]) =>
    apiFetch<LeadImportResult>('/leads/import', { method: 'POST', body: JSON.stringify({ rows }) }),
};
