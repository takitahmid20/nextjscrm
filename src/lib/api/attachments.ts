/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attachment, AttachmentEntityType } from '../../types';
import { apiFetch, toQueryString } from './http';

export const attachmentsApi = {
  list: (entityType: AttachmentEntityType, entityId: string) =>
    apiFetch<Attachment[]>(`/attachments${toQueryString({ entityType, entityId })}`),
  upload: (input: { entityType: AttachmentEntityType; entityId: string; fileName: string; fileSize: number; mimeType: string; dataUrl: string }) =>
    apiFetch<Attachment>('/attachments', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/attachments/${id}`, { method: 'DELETE' }),
};
