/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Save, Database, ShieldAlert, Cpu, HeartHandshake, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from './forms/FormControls';

interface SettingsViewProps {
  onResetData: () => void;
  currentUser: { name: string; role: string };
  onUpdateCurrentUser: (name: string, role: string) => void;
}

export default function SettingsView({ onResetData, currentUser, onUpdateCurrentUser }: SettingsViewProps) {
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileRole, setProfileRole] = useState(currentUser.role);
  const [companyName, setCompanyName] = useState('Acme Agency Systems Ltd');
  const [leadThreshold, setLeadThreshold] = useState('15000');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [saveAlert, setSaveAlert] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser(profileName, profileRole);
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl select-none text-xs text-[#111827]">
      <div>
        <h1 className="text-28px font-semibold text-[#111827] tracking-tight">System & Tenant Settings</h1>
        <p className="text-sm text-[#6B7280]">
          Configure core workspace details, reassign primary sales operators, and execute data backups.
        </p>
      </div>

      {saveAlert && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3 rounded-[6px] font-semibold flex items-center space-x-2.5">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
          <span>Workspace preferences written to system storage successfully.</span>
        </div>
      )}

      {/* Main Form block */}
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden">
        <form onSubmit={handleSaveSettings}>
          <div className="p-5 space-y-5">
            
            <div className="pb-3 border-b border-[#E5E7EB] flex items-center space-x-2 font-bold select-none text-[#111827]">
              <Cpu className="h-4.5 w-4.5 text-[#2563EB]" />
              <span className="text-xs uppercase tracking-wider">Tenant Identity Configurations</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1.5">Company Tenancy Display Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F5F6F8] border border-[#E5E7EB] rounded-[6px] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 select-none">Base Operating Currency</label>
                <FormSelect
                  value={currencyCode}
                  onChange={(val) => setCurrencyCode(val)}
                  options={[
                    { value: 'USD', label: 'USD ($) - United States Dollar' },
                    { value: 'EUR', label: 'EUR (€) - European Euro' },
                    { value: 'GBP', label: 'GBP (£) - British Pound Sterling' }
                  ]}
                  placeholder="Choose Currency"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1.5">User Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Corporate Position Title</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1.5">Trigger Limit Threshold for high-value Leads ($)</label>
              <input
                type="number"
                value={leadThreshold}
                onChange={(e) => setLeadThreshold(e.target.value)}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-[#6B7280] block mt-1.5">
                Acme leads with high contract values will trigger executive indicators on the core monitor cards automatically.
              </span>
            </div>

          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-between">
            <span className="text-[10px] text-[#6B7280]">Saved preferences sync across sessions automatically</span>
            <Button
              type="submit"
              className="h-9 px-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold rounded-[6px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Disaster Recovery Box */}
      <Card className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 space-y-4">
        <div className="pb-2 border-b border-[#E5E7EB] flex items-center space-x-2 text-red-650 font-bold">
          <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
          <span className="text-xs uppercase tracking-wider text-red-650">Disaster Recovery & Redundancy</span>
        </div>

        <p className="leading-relaxed text-[#6B7280]">
          Running operational database checks or resetting data overrides mock entries, rebuilding core pipelines back onto default corporate seeds. This is an irreversible transaction.
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm('Permanently wipe and reset the mock corporate accounts database? This cannot be undone.')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-red-650 text-white font-bold rounded-[6px] hover:bg-red-700 transition-colors cursor-pointer border-none"
          >
            Wipe & Restore Defaults
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const state = getLocalStorageJSONString();
              const blob = new Blob([state], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `centric_crm_full_backup_${Date.now()}.json`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-4 py-2.5 border border-[#E5E7EB] bg-white text-[#111827] font-semibold rounded-[6px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-[#2563EB]" />
            Download DB State JSON
          </Button>
        </div>
      </Card>

    </div>
  );
}

function getLocalStorageJSONString(): string {
  if (typeof window === 'undefined') return '{}';
  return JSON.stringify({
    leads: localStorage.getItem('crm_leads'),
    deals: localStorage.getItem('crm_deals'),
    tasks: localStorage.getItem('crm_tasks'),
    activities: localStorage.getItem('crm_activities')
  }, null, 2);
}
