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
    <Card className="bg-card border border-border rounded-[8px] shadow-xs">
      <CardHeader className="py-4 border-b border-muted">
        <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3.5 text-xs">
        {hasAddress ? (
          <div className="space-y-3">
            {addressInfo.street && (
              <div className="flex justify-between items-start gap-2 border-b border-muted pb-2">
                <span className="text-muted-foreground">Street</span>
                <span
                  title={addressInfo.street}
                  className="font-semibold text-right text-foreground max-w-[160px] truncate"
                >
                  {addressInfo.street}
                </span>
              </div>
            )}
            {addressInfo.city && (
              <div className="flex justify-between items-center gap-2 border-b border-muted pb-2">
                <span className="text-muted-foreground">City</span>
                <span
                  title={addressInfo.city}
                  className="font-semibold text-right text-foreground max-w-[160px] truncate"
                >
                  {addressInfo.city}
                </span>
              </div>
            )}
            {addressInfo.state && (
              <div className="flex justify-between items-center gap-2 border-b border-muted pb-2">
                <span className="text-muted-foreground">State / Province</span>
                <span
                  title={addressInfo.state}
                  className="font-semibold text-right text-foreground max-w-[160px] truncate"
                >
                  {addressInfo.state}
                </span>
              </div>
            )}
            {addressInfo.postalCode && (
              <div className="flex justify-between items-center gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">Postal Code</span>
                <span
                  title={addressInfo.postalCode}
                  className="font-semibold text-right text-foreground font-mono max-w-[160px] truncate"
                >
                  {addressInfo.postalCode}
                </span>
              </div>
            )}
            {addressInfo.country && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Country</span>
                <span
                  title={addressInfo.country}
                  className="font-semibold text-right text-foreground max-w-[160px] truncate"
                >
                  {addressInfo.country}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-3 italic select-none">
            No address information loaded for this record.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
