/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, ListResult, ListQuery, Lead, Contact, Deal } from '../../types';
import { apiFetch, toQueryString } from './http';

export interface AccountListQuery extends ListQuery {
  assignedTo?: string;
}

export interface AccountRollupResult {
  account: Account;
  leads: Lead[];
  contacts: Contact[];
  deals: Deal[];
  leadCount: number;
  contactCount: number;
  dealCount: number;
  openPipelineValue: number;
  wonValue: number;
}

export const accountsApi = {
  list: (query: AccountListQuery = {}) => apiFetch<ListResult<Account>>(`/accounts${toQueryString(query)}`),
  get: (id: string) => apiFetch<Account>(`/accounts/${id}`),
  rollup: (id: string) => apiFetch<AccountRollupResult>(`/accounts/${id}/rollup`),
  create: (input: Omit<Account, 'id' | 'createdAt'>) => apiFetch<Account>('/accounts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Account>) => apiFetch<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
};
