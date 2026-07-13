/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SESSION_COOKIE_NAME } from '@/src/lib/session';
import { ok } from '@/src/lib/api-response';

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}
