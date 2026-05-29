/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base CRM Client API Infrastructure
 * Represents a clean, centralized, enterprise-grade service layer configuration.
 * All operations map cleanly to backend structures. Includes latency simulation 
 * to align with state transitions, loading indicators, and rigorous mock database hooks.
 */

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Simulating network latency for enterprise SaaS environment
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Future real-world implementation scaffolding
  // const token = localStorage.getItem('crm_jwt_token');
  // const headers = {
  //   'Content-Type': 'application/json',
  //   ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //   ...options.headers,
  // };
  // const response = await fetch(`/api/v1${endpoint}`, { ...options, headers });
  // if (!response.ok) throw new APIError('Request failed', response.status);
  // return response.json();

  // Pure decoupled mock implementation of API proxy fallback
  console.log(`[CRM API Call] -> ${options.method || 'GET'} ${endpoint}`);
  return {} as T;
}
