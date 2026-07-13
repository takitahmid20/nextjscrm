/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />,
  info: <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />,
};

const BORDER = {
  success: 'border-emerald-300 dark:border-emerald-800',
  error: 'border-destructive/40',
  info: 'border-border',
};

export default function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border ${BORDER[toast.variant]} bg-popover text-popover-foreground px-3.5 py-3 shadow-lg text-sm`}
        >
          {ICONS[toast.variant]}
          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
