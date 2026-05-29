/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Building, ArrowLeft, RefreshCw, KeyRound, Check } from 'lucide-react';

interface AuthViewProps {
  onSuccessLogin: (name: string, role: string) => void;
  onExitAuthPreview: () => void;
}

export default function AuthView({ onSuccessLogin, onExitAuthPreview }: AuthViewProps) {
  // Switch between panels: 'signin' | 'signup' | 'forgot' | 'otp'
  const [panel, setPanel] = useState<'signin' | 'signup' | 'forgot' | 'otp'>('signin');
  
  // Real interactive typing states
  const [emailText, setEmailText] = useState('takitahmid20@gmail.com');
  const [passwordText, setPasswordText] = useState('••••••••••••');
  const [fullNameText, setFullNameText] = useState('Taki Tahmid');
  const [companyNameText, setCompanyNameText] = useState('Acme Agency Ltd');
  const [otpText, setOtpText] = useState(['5', '9', '2', '0', '1', '4']);
  const [authError, setAuthError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailText || !passwordText) {
      setAuthError('Mandatory corporate logins missing.');
      return;
    }
    // Simulate logging in
    onSuccessLogin(fullNameText || 'Taki Tahmid', 'Principal account executive');
    alert('Mock Login Authorized! Authenticating session.');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameText || !companyNameText || !emailText) {
      setAuthError('Please fill in required fields.');
      return;
    }
    alert(`Account for ${companyNameText} registered securely! Requesting OTP Token.`);
    setPanel('otp');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailText) {
      setAuthError('Please input registered work email.');
      return;
    }
    alert(`OTP recovery token dispatched to: ${emailText}`);
    setPanel('otp');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = otpText.join('');
    if (joined.length !== 6) {
      setAuthError('OTP requires six-digit transaction code.');
      return;
    }
    onSuccessLogin(fullNameText, 'Global Sales Executive');
    alert(`OTP verified! Session token created for company ${companyNameText || 'Centric Corp'}.`);
  };

  const handleOtpCellChange = (index: number, val: string) => {
    if (val.length > 1) return;
    const copied = [...otpText];
    copied[index] = val;
    setOtpText(copied);
    
    // Auto-focus next input
    if (val && index < 5) {
      const el = document.getElementById(`otp-cell-input-${index + 1}`);
      if (el) el.focus();
    }
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-4 select-none">
       {/* Small tab bar selection to easily preview ALL requested security screens */}
       <div className="mb-6 bg-white border border-[#E5E7EB] rounded-[6px] p-1 flex space-x-1 text-xs text-[#6B7280]">
         <button
           id="btn-preview-signin"
           onClick={() => { setPanel('signin'); setAuthError(''); }}
           className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${panel === 'signin' ? 'bg-[#2563EB] text-white' : 'hover:bg-slate-50 text-[#6B7280]'}`}
         >
           1. Sign In
         </button>
         <button
           id="btn-preview-signup"
           onClick={() => { setPanel('signup'); setAuthError(''); }}
           className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${panel === 'signup' ? 'bg-[#2563EB] text-white' : 'hover:bg-slate-50 text-[#6B7280]'}`}
         >
           2. Sign Up
         </button>
         <button
           id="btn-preview-forgot"
           onClick={() => { setPanel('forgot'); setAuthError(''); }}
           className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${panel === 'forgot' ? 'bg-[#2563EB] text-white' : 'hover:bg-slate-50 text-[#6B7280]'}`}
         >
           3. Forgot PW
         </button>
         <button
           id="btn-preview-otp"
           onClick={() => { setPanel('otp'); setAuthError(''); }}
           className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${panel === 'otp' ? 'bg-[#2563EB] text-white' : 'hover:bg-slate-50 text-[#6B7280]'}`}
         >
           4. OTP Screen
         </button>
       </div>

       {/* Centered Auth Card Frame */}
       <div 
         id="auth-centered-box" 
         className="bg-white border border-[#E5E7EB] rounded-[8px] max-w-sm w-full p-6 text-xs text-[#111827] relative"
       >
          <div className="absolute top-4 right-4 text-[10px] text-[#2563EB] font-mono tracking-widest font-bold">
            SECURE PORT
          </div>

          <div className="mb-5 text-center">
            <div className="mx-auto h-11 w-11 bg-[#EFF6FF] border border-[#2563EB]/15 rounded-[6px] text-[#2563EB] flex items-center justify-center">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            {panel === 'signin' && (
              <>
                <h3 className="text-16px font-bold text-[#111827] mt-3">Access Corporate workspace</h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Acme Global Division CRM Authentication Portal</p>
              </>
            )}
            {panel === 'signup' && (
              <>
                <h3 className="text-16px font-bold text-[#111827] mt-3">Register Sales Tenant</h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Acquire operational database instances instantaneously</p>
              </>
            )}
            {panel === 'forgot' && (
              <>
                <h3 className="text-16px font-bold text-[#111827] mt-3">Request OTP Password Reset</h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Dispatches recovery tokens to registered active personnel</p>
              </>
            )}
            {panel === 'otp' && (
              <>
                <h3 className="text-16px font-bold text-[#111827] mt-3">Verification Multi-Factor OTP</h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Input the 6-digit corporate verification sequence</p>
              </>
            )}
          </div>

          {authError && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 font-medium rounded-[4px] leading-tight">
              {authError}
            </div>
          )}

          {/* PANEL 1: SIGN IN */}
          {panel === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#111827] mb-1.5">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                    placeholder="email@acme.corp"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#111827]">Security Password</label>
                  <button
                    type="button"
                    onClick={() => { setPanel('forgot'); setAuthError(''); }}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="signin-password"
                    type="password"
                    required
                    value={passwordText}
                    onChange={(e) => setPasswordText(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[6px] transition-colors cursor-pointer"
              >
                Authorize Session Access
              </button>

              <div className="text-center pt-2 border-t border-[#E5E7EB] text-[#6B7280]">
                Don't have a registered tenant?{' '}
                <button
                  type="button"
                  onClick={() => { setPanel('signup'); setAuthError(''); }}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Create tenant account
                </button>
              </div>
            </form>
          )}

          {/* PANEL 2: SIGN UP */}
          {panel === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#111827] mb-1">Company Entity Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    id="signup-company"
                    type="text"
                    required
                    value={companyNameText}
                    onChange={(e) => setCompanyNameText(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                    placeholder="e.g. Stark Industries Inc"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">Contact User Fullname</label>
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  value={fullNameText}
                  onChange={(e) => setFullNameText(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                  placeholder="e.g. Miriam Vance"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">Work Email Required</label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                  placeholder="email@company.com"
                />
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[6px] transition-colors mt-3 cursor-pointer"
              >
                Deploy Database Tenant
              </button>

              <div className="text-center pt-2 border-t border-[#E5E7EB] text-[#6B7280]">
                Already verified?{' '}
                <button
                  type="button"
                  onClick={() => { setPanel('signin'); setAuthError(''); }}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Authorized Login
                </button>
              </div>
            </form>
          )}

          {/* PANEL 3: FORGOT PASSWORD */}
          {panel === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-[11px] text-[#6B7280] leading-normal">
                An active OTP recovery token code will be generated to reset registered parameters. Inform operations lead if your address bounces.
              </p>

              <div>
                <label className="block font-semibold text-[#111827] mb-1.5">Registered Work Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] outline-none text-xs focus:border-[#2563EB]"
                  placeholder="name@agency.corp"
                />
              </div>

              <button
                id="btn-submit-forgot"
                type="submit"
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[6px] transition-colors cursor-pointer"
              >
                Request OTP Code File
              </button>

              <button
                type="button"
                onClick={() => { setPanel('signin'); setAuthError(''); }}
                className="w-full h-10 border border-[#E5E7EB] text-[#111827] bg-white rounded-[6px] flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Login
              </button>
            </form>
          )}

          {/* PANEL 4: OTP MULTIFACTOR VERIFICATION */}
          {panel === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-[11px] text-[#6B7280] leading-normal text-center">
                Dispatched code index file to <strong>{emailText}</strong>.<br />
                Expires in <span className="font-mono text-blue-600 font-bold">04:59 minutes</span>.
              </p>

              {/* Number boxes */}
              <div className="flex justify-between items-center gap-1.5 py-2">
                {otpText.map((char, index) => (
                  <input
                    key={index}
                    id={`otp-cell-input-${index}`}
                    type="text"
                    required
                    value={char}
                    onChange={(e) => handleOtpCellChange(index, e.target.value)}
                    className="w-11 h-11 border border-[#E5E7EB] text-center font-bold text-16px text-slate-900 bg-[#F5F6F8] rounded-[6px] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-200"
                  />
                ))}
              </div>

              <button
                id="btn-submit-otp"
                type="submit"
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[6px] transition-colors cursor-pointer"
              >
                Authorize OTP verification
              </button>

              <div className="flex items-center justify-between pt-2 text-[#6B7280] text-[10px]">
                <span>No code received?</span>
                <button
                  type="button"
                  onClick={() => alert('Another security token was queued for dispatch.')}
                  className="text-blue-600 hover:text-[#1d4ed8] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Request Resend
                </button>
              </div>
            </form>
          )}

       </div>

       {/* Exit Preview options */}
       <div className="mt-4 text-center">
         <button
           id="btn-exit-auth-preview"
           onClick={onExitAuthPreview}
           className="text-xs text-[#6B7280] hover:text-[#111827] flex items-center gap-1 text-center font-bold underline"
         >
           Exit security previews, restore core workspace dashboard
         </button>
       </div>
    </div>
  );
}
