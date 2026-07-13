/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRMTask, ListResult, ListQuery } from '../../types';
import { apiFetch, toQueryString } from './http';

export interface TaskListQuery extends ListQuery {
  status?: string;
  priority?: string;
  assignedTo?: string;
}

export interface TaskImportResult {
  imported: CRMTask[];
  importedCount: number;
  errors: { row: number; message: string }[];
}

export const tasksApi = {
  list: (query: TaskListQuery = {}) => apiFetch<ListResult<CRMTask>>(`/tasks${toQueryString(query)}`),
  create: (input: Omit<CRMTask, 'id' | 'status'>) => apiFetch<CRMTask>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<CRMTask>) => apiFetch<CRMTask>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  import: (rows: Record<string, unknown>[]) =>
    apiFetch<TaskImportResult>('/tasks/import', { method: 'POST', body: JSON.stringify({ rows }) }),
};
