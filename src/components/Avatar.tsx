/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

const PALETTE = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-purple-600',
  'bg-cyan-600',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  /** Override the deterministic name-based color, e.g. to keep one user's color stable across a session. */
  colorClass?: string;
  className?: string;
}

/**
 * Deterministic initials avatar — same `name` always renders the same color,
 * so a person's avatar looks consistent everywhere it appears without
 * needing a stored/assigned color field.
 */
export default function Avatar({ name, size = 'md', colorClass, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0',
        SIZE_CLASSES[size],
        colorClass || colorForName(name),
        className
      )}
      title={name}
      aria-hidden="true"
    >
      {initialsForName(name)}
    </span>
  );
}

export { colorForName, initialsForName };
