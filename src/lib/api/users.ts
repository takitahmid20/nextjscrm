/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRMUser } from '../../types';
import { apiFetch } from './http';

export const usersApi = {
  list: () => apiFetch<CRMUser[]>('/users'),
  create: (input: Omit<CRMUser, 'id' | 'avatarColor'>) => apiFetch<CRMUser>('/users', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<CRMUser>) => apiFetch<CRMUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),
};
