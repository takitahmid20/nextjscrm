/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { contactImportRowSchema } from '@/src/validation';
import { contactsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

const bodySchema = z.object({ rows: z.array(z.record(z.string(), z.any())).min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) return fail('Expected a non-empty array of rows.', 400);

  const valid: z.infer<typeof contactImportRowSchema>[] = [];
  const errors: { row: number; message: string }[] = [];

  parsedBody.data.rows.forEach((row, index) => {
    const parsed = contactImportRowSchema.safeParse(row);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      errors.push({ row: index + 1, message: parsed.error.issues.map((i) => i.message).join(' ') });
    }
  });

  const imported = contactsDb.bulkCreate(valid, user.name);
  return ok({ imported, importedCount: imported.length, errors });
}
