"use client";

import React from 'react';
import { Mail, Phone, Sparkles, User, Globe, Facebook as FacebookIcon, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormSelect } from '../forms/FormControls';
import { CRM_USERS, formatRelativeTime } from '../../utils';

interface CRMDemographicsCardProps {
  entity: {
    name: string;
    email: string;
    phone: string;
    source: string;
    assignedTo: string;
    dealValue?: number;
    companyWebsite?: string;
    facebook?: string;
    emailOptOut?: boolean;
    createdAt: string;
    lastActivity: string;
  };
  onUpdateRepresentative: (assignedTo: string) => void;
  onUpdateDealValue: (value: number) => void;
}

export default function CRMDemographicsCard({
  entity,
  onUpdateRepresentative,
  onUpdateDealValue,
}: CRMDemographicsCardProps) {
  return (
    <Card className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-xs">
      <CardHeader className="py-4 border-b border-[#F5F6F8]">
        <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500">
          Account Demographics
        </CardTitle>
        <CardDescription className="text-[11px]">Primary operational touchpoints in CRM filesystem</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">
        
        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Email
            </span>
            {entity.email ? (
              <a href={`mailto:${entity.email}`} className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px] select-all">
                {entity.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">None listed</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              Phone
            </span>
            <span className="font-semibold text-slate-800">{entity.phone || 'None listed'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Acquisition Sourcing
            </span>
            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
              {entity.source}
            </span>
          </div>

          {/* Website Link */}
          {entity.companyWebsite && (
            <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Website
              </span>
              <a 
                href={entity.companyWebsite.startsWith('http') ? entity.companyWebsite : `https://${entity.companyWebsite}`}
                target="_blank" 
                rel="noreferrer" 
                className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px]"
              >
                {entity.companyWebsite.replace(/https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Facebook Link */}
          {entity.facebook && (
            <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 flex items-center gap-1">
                <FacebookIcon className="h-3.5 w-3.5 text-blue-500" />
                Facebook
              </span>
              <a 
                href={entity.facebook.startsWith('http') ? entity.facebook : `https://${entity.facebook}`}
                target="_blank" 
                rel="noreferrer" 
                className="font-semibold text-[#2563EB] hover:underline truncate max-w-[160px]"
              >
                View Profile
              </a>
            </div>
          )}

          {/* Email Opt Out / Marketing Sub status */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Marketing Mail
            </span>
            {entity.emailOptOut ? (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                Opted Out
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Subscribed
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
            <span className="text-slate-400 flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Assigned Owner
            </span>
            <FormSelect
              value={entity.assignedTo}
              onChange={onUpdateRepresentative}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              className="w-36 text-right font-semibold text-[#111827]"
            />
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 my-2" />

        {/* Deal Valuation */}
        <div className="space-y-2.5">
          <label className="text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Calculated Deal Size (USD)
          </label>
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-bold text-sm">$</span>
            <Input
              type="number"
              value={entity.dealValue || 0}
              onChange={(e) => onUpdateDealValue(Number(e.target.value) || 0)}
              className="h-8 py-1 px-2 border border-[#E5E7EB] text-xs font-bold text-slate-800 bg-[#F9FAFB] rounded"
            />
          </div>
          <p className="text-[10px] text-slate-400 italic">Adjust lead value estimate to sync forecasting models.</p>
        </div>

        {/* Additional Timestamps */}
        {entity.createdAt && (
          <>
            <div className="h-[1px] bg-slate-100 my-2" />
            <div className="text-[11px] text-slate-500 space-y-1 block leading-relaxed bg-[#F8FAFC] p-2 rounded">
              <div>
                <span className="font-semibold">Registered:</span> {new Date(entity.createdAt).toLocaleDateString()} ({formatRelativeTime(entity.createdAt)})
              </div>
              <div>
                <span className="font-semibold">Last Audited:</span> {new Date(entity.lastActivity).toLocaleDateString()}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
