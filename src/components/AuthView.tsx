/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Building, User, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema, LoginFormValues,
  signupSchema, SignupFormValues,
  forgotPasswordSchema, ForgotPasswordFormValues,
  verifyOtpSchema, VerifyOtpFormValues,
} from '../validation';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api/http';

type Panel = 'signin' | 'signup' | 'forgot' | 'otp';

interface AuthViewProps {
  onAuthenticated: () => void;
}

export default function AuthView({ onAuthenticated }: AuthViewProps) {
  const { login, signup, forgotPassword, verifyOtp } = useAuth();
  const [panel, setPanel] = useState<Panel>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const signInForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', companyName: '', email: '', password: '' },
  });

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  });

  function goTo(next: Panel) {
    setPanel(next);
    setAuthError('');
  }

  function describeError(error: unknown, fallback: string) {
    return error instanceof ApiError ? error.message : fallback;
  }

  async function handleSignIn(values: LoginFormValues) {
    setAuthError('');
    try {
      await login(values.email, values.password);
      onAuthenticated();
    } catch (error) {
      setAuthError(describeError(error, 'Unable to sign in. Please try again.'));
    }
  }

  async function handleSignUp(values: SignupFormValues) {
    setAuthError('');
    try {
      await signup(values);
      onAuthenticated();
    } catch (error) {
      setAuthError(describeError(error, 'Unable to create your account. Please try again.'));
    }
  }

  async function handleForgotPassword(values: ForgotPasswordFormValues) {
    setAuthError('');
    try {
      const result = await forgotPassword(values.email);
      setOtpEmail(values.email);
      setOtpHint(result.devOtp ?? null);
      goTo('otp');
    } catch (error) {
      setAuthError(describeError(error, 'Unable to send a reset code. Please try again.'));
    }
  }

  async function handleVerifyOtp(values: VerifyOtpFormValues) {
    setAuthError('');
    try {
      await verifyOtp(otpEmail, values.otp);
      onAuthenticated();
    } catch (error) {
      setAuthError(describeError(error, 'That code is invalid or has expired.'));
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 text-sm text-foreground relative shadow-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto h-11 w-11 bg-primary/10 border border-primary/15 rounded-md text-primary flex items-center justify-center">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          {panel === 'signin' && (
            <>
              <h1 className="text-lg font-bold mt-3">Sign in to Takimac CRM</h1>
              <p className="text-xs text-muted-foreground mt-1">Welcome back — enter your work credentials.</p>
            </>
          )}
          {panel === 'signup' && (
            <>
              <h1 className="text-lg font-bold mt-3">Create your workspace</h1>
              <p className="text-xs text-muted-foreground mt-1">Set up a new company account in a few seconds.</p>
            </>
          )}
          {panel === 'forgot' && (
            <>
              <h1 className="text-lg font-bold mt-3">Reset your password</h1>
              <p className="text-xs text-muted-foreground mt-1">We'll send a one-time code to your work email.</p>
            </>
          )}
          {panel === 'otp' && (
            <>
              <h1 className="text-lg font-bold mt-3">Enter verification code</h1>
              <p className="text-xs text-muted-foreground mt-1">Check your email for a 6-digit code.</p>
            </>
          )}
        </div>

        {authError && (
          <div role="alert" aria-live="assertive" className="mb-4 p-2.5 bg-destructive/10 border border-destructive/30 text-destructive font-medium rounded-md leading-tight text-xs">
            {authError}
          </div>
        )}

        {panel === 'signin' && (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signin-email" className="block font-semibold mb-1.5">Work email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!signInForm.formState.errors.email}
                  aria-describedby={signInForm.formState.errors.email ? 'signin-email-error' : undefined}
                  {...signInForm.register('email')}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="you@company.com"
                />
              </div>
              {signInForm.formState.errors.email && (
                <p id="signin-email-error" className="mt-1 text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signin-password" className="font-semibold">Password</label>
                <button type="button" onClick={() => goTo('forgot')} className="text-primary hover:underline font-semibold text-xs">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={!!signInForm.formState.errors.password}
                  aria-describedby={signInForm.formState.errors.password ? 'signin-password-error' : undefined}
                  {...signInForm.register('password')}
                  className="w-full h-10 pl-9 pr-9 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {signInForm.formState.errors.password && (
                <p id="signin-password-error" className="mt-1 text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={signInForm.formState.isSubmitting}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {signInForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>

            <div className="text-center pt-2 border-t border-border text-muted-foreground text-xs">
              Don't have a workspace yet?{' '}
              <button type="button" onClick={() => goTo('signup')} className="text-primary hover:underline font-semibold">
                Create one
              </button>
            </div>
          </form>
        )}

        {panel === 'signup' && (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-3" noValidate>
            <div>
              <label htmlFor="signup-company" className="block font-semibold mb-1">Company name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="signup-company"
                  type="text"
                  autoComplete="organization"
                  {...signUpForm.register('companyName')}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Acme Inc."
                />
              </div>
              {signUpForm.formState.errors.companyName && (
                <p className="mt-1 text-xs text-destructive">{signUpForm.formState.errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="signup-fullname" className="block font-semibold mb-1">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="signup-fullname"
                  type="text"
                  autoComplete="name"
                  {...signUpForm.register('fullName')}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Jane Smith"
                />
              </div>
              {signUpForm.formState.errors.fullName && (
                <p className="mt-1 text-xs text-destructive">{signUpForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="signup-email" className="block font-semibold mb-1">Work email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                {...signUpForm.register('email')}
                className="w-full h-10 px-3 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@company.com"
              />
              {signUpForm.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="signup-password" className="block font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...signUpForm.register('password')}
                  className="w-full h-10 px-3 pr-9 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {signUpForm.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={signUpForm.formState.isSubmitting}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {signUpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create workspace
            </button>

            <div className="text-center pt-2 border-t border-border text-muted-foreground text-xs">
              Already have an account?{' '}
              <button type="button" onClick={() => goTo('signin')} className="text-primary hover:underline font-semibold">
                Sign in
              </button>
            </div>
          </form>
        )}

        {panel === 'forgot' && (
          <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4" noValidate>
            <p className="text-xs text-muted-foreground leading-normal">
              Enter your work email and we'll send a 6-digit code to reset your password.
            </p>
            <div>
              <label htmlFor="forgot-email" className="block font-semibold mb-1.5">Work email</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                {...forgotForm.register('email')}
                className="w-full h-10 px-3 bg-background border border-border rounded-md outline-none text-sm focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@company.com"
              />
              {forgotForm.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={forgotForm.formState.isSubmitting}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {forgotForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset code
            </button>

            <button
              type="button"
              onClick={() => goTo('signin')}
              className="w-full h-10 border border-border bg-background rounded-md flex items-center justify-center gap-1.5 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </form>
        )}

        {panel === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4" noValidate>
            <p className="text-xs text-muted-foreground leading-normal text-center">
              Enter the 6-digit code sent to <strong>{otpEmail}</strong>.
            </p>
            {otpHint && (
              <p className="text-xs text-center text-primary font-mono">Dev-only preview code: {otpHint}</p>
            )}

            <div>
              <label htmlFor="otp-code" className="sr-only">Verification code</label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                {...otpForm.register('otp')}
                className="w-full h-12 text-center tracking-[0.5em] font-bold text-lg bg-muted border border-border rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="000000"
              />
              {otpForm.formState.errors.otp && (
                <p className="mt-1 text-xs text-destructive text-center">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {otpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify code
            </button>

            <button
              type="button"
              onClick={() => goTo('signin')}
              className="w-full text-center text-muted-foreground hover:text-foreground text-xs font-semibold"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
