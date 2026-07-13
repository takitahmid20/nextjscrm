/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { ApiResponse } from '../types';

export function ok<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

export function fail(message: string, status = 400, issues?: Record<string, string[]>) {
  const body: ApiResponse<never> = { success: false, error: { message, issues } };
  return NextResponse.json(body, { status });
}
