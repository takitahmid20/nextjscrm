/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export interface UnifiedTableHeader {
  key: string;
  label: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface UnifiedTableProps<T> {
  id?: string;
  className?: string; // custom classes for the inner table scroll area
  data: T[];
  headers: UnifiedTableHeader[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyStateText?: string;
  hideScrollbar?: boolean;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    rowsPerPageOptions?: number[];
    recordTypeLabel?: string; // e.g., "records", "qualified accounts", "leads"
  };
}

const SKELETON_ROW_COUNT = 5;

export function UnifiedTable<T>({
  id,
  className,
  data,
  headers,
  renderRow,
  emptyStateText = 'No records matched this query.',
  hideScrollbar = false,
  loading = false,
  pagination,
}: UnifiedTableProps<T>) {
  const hasPages = !!pagination && pagination.totalPages > 0;
  const displayTotalPages = pagination ? Math.max(pagination.totalPages, 1) : 1;
  const displayCurrentPage = pagination ? (hasPages ? pagination.currentPage : 1) : 1;

  return (
    <div className="space-y-4">
      <div className={cn("bg-card border border-border rounded-[8px] overflow-hidden", className)}>
        <div className={cn("overflow-x-auto crm-scrollbar", hideScrollbar && "scrollbar-none")}>
          <Table id={id} className="w-full text-left text-xs border-collapse min-w-full">
            <TableHeader className="bg-muted font-medium text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border">
              <TableRow>
                {headers.map((header) => (
                  <TableHead
                    key={header.key}
                    className={cn("py-3 px-4 text-xs font-semibold text-muted-foreground", header.className, header.onClick && "cursor-pointer select-none hover:bg-accent transition-colors")}
                    onClick={header.onClick}
                  >
                    {header.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-border bg-card text-foreground">
              {loading ? (
                Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    {headers.map((header) => (
                      <TableCell key={header.key} className="py-3 px-4">
                        <div className="h-3.5 w-full max-w-[160px] rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={headers.length}
                    className="py-12 text-center text-muted-foreground font-sans italic"
                  >
                    {emptyStateText}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => renderRow(item, index))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination component rendered globally if configured */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground px-1 py-1 gap-3 select-none">
          <div>
            Showing{' '}
            <strong>
              {pagination.totalRecords === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.rowsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(
                pagination.currentPage * pagination.rowsPerPage,
                pagination.totalRecords
              )}
            </strong>{' '}
            of <strong>{pagination.totalRecords}</strong>{' '}
            {pagination.recordTypeLabel || 'records'}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span>Rows per page:</span>
              <select
                aria-label="Rows per page"
                value={pagination.rowsPerPage}
                onChange={(e) => {
                  pagination.onRowsPerPageChange(Number(e.target.value));
                  pagination.onPageChange(1);
                }}
                className="border border-border rounded-[4px] px-1.5 py-1 font-semibold text-foreground bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(pagination.rowsPerPageOptions || [5, 10, 20, 25, 50]).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                aria-label="First page"
                disabled={!hasPages || pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(1)}
                className="h-8 px-2.5 border-border text-xs font-semibold rounded-[4px] hover:bg-muted text-foreground bg-background cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                First
              </Button>
              <Button
                variant="outline"
                aria-label="Previous page"
                disabled={!hasPages || pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(Math.max(pagination.currentPage - 1, 1))}
                className="h-8 px-2.5 border-border text-xs font-semibold rounded-[4px] hover:bg-muted text-foreground bg-background cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Prev
              </Button>
              <span className="font-semibold px-2.5 text-foreground">
                {displayCurrentPage} / {displayTotalPages}
              </span>
              <Button
                variant="outline"
                aria-label="Next page"
                disabled={!hasPages || pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                className="h-8 px-2.5 border-border text-xs font-semibold rounded-[4px] hover:bg-muted text-foreground bg-background cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Next
              </Button>
              <Button
                variant="outline"
                aria-label="Last page"
                disabled={!hasPages || pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.totalPages)}
                className="h-8 px-2.5 border-border text-xs font-semibold rounded-[4px] hover:bg-muted text-foreground bg-background cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
