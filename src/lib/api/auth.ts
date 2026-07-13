/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionUser } from '../../types';
import { apiFetch } from './http';

export const authApi = {
  login: (input: { email: string; password: string }) =>
    apiFetch<{ user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  signup: (input: { fullName: string; companyName: string; email: string; password: string }) =>
    apiFetch<{ user: SessionUser }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  session: () => apiFetch<{ user: SessionUser }>('/auth/session'),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string; devOtp?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email: string, otp: string) =>
    apiFetch<{ user: SessionUser }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
};
