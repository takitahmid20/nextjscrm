/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Collision-safe ID generator shared by the mock data layer.
 * Real DB integrations should drop this in favor of DB-generated ids
 * (uuid/serial/ObjectId) — this exists only so the mock layer below the
 * API routes has a single, non-colliding id source.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
