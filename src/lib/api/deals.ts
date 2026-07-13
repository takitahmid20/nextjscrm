/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Deal, ListResult, ListQuery } from '../../types';
import { apiFetch, toQueryString } from './http';

export interface DealListQuery extends ListQuery {
  stage?: string;
  status?: string;
  assignedTo?: string;
}

export interface DealImportResult {
  imported: Deal[];
  importedCount: number;
  errors: { row: number; message: string }[];
}

export const dealsApi = {
  list: (query: DealListQuery = {}) => apiFetch<ListResult<Deal>>(`/deals${toQueryString(query)}`),
  get: (id: string) => apiFetch<Deal>(`/deals/${id}`),
  create: (input: Omit<Deal, 'id' | 'createdAt' | 'status'>) =>
    apiFetch<Deal>('/deals', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Deal>) => apiFetch<Deal>(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/deals/${id}`, { method: 'DELETE' }),
  import: (rows: Record<string, unknown>[]) =>
    apiFetch<DealImportResult>('/deals/import', { method: 'POST', body: JSON.stringify({ rows }) }),
};
