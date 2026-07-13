/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { attachmentUploadSchema } from '@/src/validation';
import { attachmentsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';
import { AttachmentEntityType } from '@/src/types';

const ENTITY_TYPES = ['Lead', 'Contact', 'Deal', 'Account'] as const;
const listQuerySchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) return fail('entityType and entityId query params are required.', 400);

  return ok(attachmentsDb.list(parsed.data.entityType as AttachmentEntityType, parsed.data.entityId));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = attachmentUploadSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Attachment upload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const attachment = attachmentsDb.create({ ...parsed.data, uploadedBy: user.name });
  return ok(attachment, 201);
}
