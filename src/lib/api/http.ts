/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse, ApiFailure } from '../../types';

export class ApiError extends Error {
  status: number;
  issues?: Record<string, string[]>;

  constructor(message: string, status: number, issues?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

/**
 * The single real HTTP client for the app — every entity module in
 * src/lib/api/** goes through this. Swapping the mock data layer under
 * src/app/api for a real database requires no change here at all.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) {
    throw new ApiError('Request failed.', response.status);
  }
  if (!body.success) {
    const failure = body as ApiFailure;
    throw new ApiError(failure.error.message, response.status, failure.error.issues);
  }
  return body.data;
}

export function toQueryString(query: object): string {
  const params = new URLSearchParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
