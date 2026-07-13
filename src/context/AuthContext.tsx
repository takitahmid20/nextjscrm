/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SessionUser } from '../types';
import { authApi } from '../lib/api/auth';
import { usersApi } from '../lib/api/users';
import { ApiError } from '../lib/api/http';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: SessionUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { fullName: string; companyName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ devOtp?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  updateProfile: (patch: { name: string; role: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    authApi
      .session()
      .then(({ user }) => {
        setUser(user);
        setStatus('authenticated');
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authApi.login({ email, password });
    setUser(user);
    setStatus('authenticated');
  }, []);

  const signup = useCallback(async (input: { fullName: string; companyName: string; email: string; password: string }) => {
    const { user } = await authApi.signup(input);
    setUser(user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return authApi.forgotPassword(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const { user } = await authApi.verifyOtp(email, otp);
    setUser(user);
    setStatus('authenticated');
  }, []);

  const updateProfile = useCallback(async (patch: { name: string; role: string }) => {
    if (!user) return;
    const updated = await usersApi.update(user.id, patch);
    setUser((prev) => (prev ? { ...prev, name: updated.name, role: updated.role } : prev));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout, forgotPassword, verifyOtp, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
