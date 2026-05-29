"use client";

import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CRMAddressCardProps {
  addressInfo?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export default function CRMAddressCard({ addressInfo }: CRMAddressCardProps) {
  const hasAddress = addressInfo && (
    addressInfo.street ||
    addressInfo.city ||
    addressInfo.state ||
    addressInfo.postalCode ||
    addressInfo.country
  );

  return (
    <Card className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-xs">
      <CardHeader className="py-4 border-b border-[#F5F6F8]">
        <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1.5 select-none">
          <MapPin className="h-4 w-4 text-slate-500" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3.5 text-xs">
        {hasAddress ? (
          <div className="space-y-3">
            {addressInfo.street && (
              <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-2">
                <span className="text-slate-400">Street</span>
                <span className="font-semibold text-right text-slate-800 break-words max-w-[160px]">
                  {addressInfo.street}
                </span>
              </div>
            )}
            {addressInfo.city && (
              <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                <span className="text-slate-400">City</span>
                <span className="font-semibold text-right text-slate-800">
                  {addressInfo.city}
                </span>
              </div>
            )}
            {addressInfo.state && (
              <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                <span className="text-slate-400">State / Province</span>
                <span className="font-semibold text-right text-slate-800">
                  {addressInfo.state}
                </span>
              </div>
            )}
            {addressInfo.postalCode && (
              <div className="flex justify-between items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="text-slate-400">Postal Code</span>
                <span className="font-semibold text-right text-slate-800 font-mono">
                  {addressInfo.postalCode}
                </span>
              </div>
            )}
            {addressInfo.country && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Country</span>
                <span className="font-semibold text-right text-[#111827]">
                  {addressInfo.country}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-3 italic select-none">
            No address information loaded for this record.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
