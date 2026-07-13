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

function formatSafeDate(value?: string): string {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString();
}

export default function CRMDemographicsCard({
  entity,
  onUpdateRepresentative,
  onUpdateDealValue,
}: CRMDemographicsCardProps) {
  const assignedToSelectId = 'crm-demographics-assigned-to';

  return (
    <Card className="bg-card border border-border rounded-[8px] shadow-xs">
      <CardHeader className="py-4 border-b border-muted">
        <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
          Account Demographics
        </CardTitle>
        <CardDescription className="text-[11px]">Primary operational touchpoints in CRM filesystem</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">

        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Email
            </span>
            {entity.email ? (
              <a href={`mailto:${entity.email}`} title={entity.email} className="font-semibold text-primary hover:underline truncate max-w-[160px] select-all">
                {entity.email}
              </a>
            ) : (
              <span className="text-muted-foreground italic">None listed</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              Phone
            </span>
            <span className="font-semibold text-foreground">{entity.phone || 'None listed'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Acquisition Sourcing
            </span>
            <span className="font-mono bg-muted text-foreground px-1.5 py-0.5 rounded">
              {entity.source || 'Unknown'}
            </span>
          </div>

          {/* Website Link */}
          {entity.companyWebsite && (
            <div className="flex items-center justify-between border-t border-muted pt-2.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Website
              </span>
              <a
                href={entity.companyWebsite.startsWith('http') ? entity.companyWebsite : `https://${entity.companyWebsite}`}
                target="_blank"
                rel="noreferrer"
                title={entity.companyWebsite}
                className="font-semibold text-primary hover:underline truncate max-w-[160px]"
              >
                {entity.companyWebsite.replace(/https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* Facebook Link */}
          {entity.facebook && (
            <div className="flex items-center justify-between border-t border-muted pt-2.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <FacebookIcon className="h-3.5 w-3.5 text-primary" />
                Facebook
              </span>
              <a
                href={entity.facebook.startsWith('http') ? entity.facebook : `https://${entity.facebook}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline truncate max-w-[160px]"
              >
                View Profile
              </a>
            </div>
          )}

          {/* Email Opt Out / Marketing Sub status */}
          <div className="flex items-center justify-between border-t border-muted pt-2.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Marketing Mail
            </span>
            {entity.emailOptOut ? (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                Opted Out
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Subscribed
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-muted pt-2.5">
            <label htmlFor={assignedToSelectId} className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Assigned Owner
            </label>
            <FormSelect
              id={assignedToSelectId}
              value={entity.assignedTo}
              onChange={onUpdateRepresentative}
              options={CRM_USERS.map(u => ({ value: u.name, label: u.name }))}
              className="w-36 text-right font-semibold text-foreground"
            />
          </div>
        </div>

        <div className="h-[1px] bg-muted my-2" />

        {/* Deal Valuation */}
        <div className="space-y-2.5">
          <label htmlFor="crm-demographics-deal-value" className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Calculated Deal Size (USD)
          </label>
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-bold text-sm">$</span>
            <Input
              id="crm-demographics-deal-value"
              type="number"
              value={entity.dealValue || 0}
              onChange={(e) => onUpdateDealValue(Number(e.target.value) || 0)}
              className="h-8 py-1 px-2 border border-border text-xs font-bold text-foreground bg-muted rounded"
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">Adjust lead value estimate to sync forecasting models.</p>
        </div>

        {/* Additional Timestamps */}
        {entity.createdAt && (
          <>
            <div className="h-[1px] bg-muted my-2" />
            <div className="text-[11px] text-muted-foreground space-y-1 block leading-relaxed bg-muted p-2 rounded">
              <div>
                <span className="font-semibold">Registered:</span> {formatSafeDate(entity.createdAt)} ({formatRelativeTime(entity.createdAt)})
              </div>
              <div>
                <span className="font-semibold">Last Audited:</span> {formatSafeDate(entity.lastActivity)}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
