/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm {
  opts: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

/**
 * Drop-in async replacement for window.confirm(): `if (await confirm('Delete this?'))`.
 * Renders through the shared shadcn Dialog so it's themeable/accessible,
 * unlike the blocking native dialog it replaces.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts: ConfirmOptions = typeof options === 'string' ? { description: options } : options;
    return new Promise<boolean>((resolve) => setPending({ opts, resolve }));
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open) settle(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.opts.title ?? 'Are you sure?'}</DialogTitle>
            <DialogDescription>{pending?.opts.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {pending?.opts.cancelLabel ?? 'Cancel'}
            </Button>
            <Button variant={pending?.opts.destructive ? 'destructive' : 'default'} onClick={() => settle(true)}>
              {pending?.opts.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx.confirm;
}
