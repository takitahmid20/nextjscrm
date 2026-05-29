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

export function UnifiedTable<T>({
  id,
  className,
  data,
  headers,
  renderRow,
  emptyStateText = 'No records matched this query.',
  hideScrollbar = false,
  pagination,
}: UnifiedTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className={cn("bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden", className)}>
        <div className={cn("overflow-x-auto crm-scrollbar", hideScrollbar && "scrollbar-none")}>
          <Table id={id} className="w-full text-left text-xs border-collapse min-w-full">
            <TableHeader className="bg-[#F5F6F8] font-medium text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-[#E5E7EB]">
              <TableRow>
                {headers.map((header) => (
                  <TableHead
                    key={header.key}
                    className={cn("py-3 px-4 text-xs font-semibold text-[#6B7280]", header.className, header.onClick && "cursor-pointer select-none hover:bg-slate-100 transition-colors")}
                    onClick={header.onClick}
                  >
                    {header.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-[#E5E7EB] bg-white text-[#374151]">
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={headers.length}
                    className="py-12 text-center text-slate-400 font-sans italic"
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
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 px-1 py-1 gap-3 select-none">
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
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <span>Rows per page:</span>
              <select
                value={pagination.rowsPerPage}
                onChange={(e) => {
                  pagination.onRowsPerPageChange(Number(e.target.value));
                  pagination.onPageChange(1);
                }}
                className="border border-[#CBD5E1] rounded-[4px] px-1.5 py-1 font-semibold text-slate-700 bg-white outline-none"
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
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(1)}
                className="h-8 px-2.5 border-[#CBD5E1] text-xs font-semibold rounded-[4px] hover:bg-slate-50 text-slate-700 bg-white cursor-pointer disabled:opacity-40"
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(Math.max(pagination.currentPage - 1, 1))}
                className="h-8 px-2.5 border-[#CBD5E1] text-xs font-semibold rounded-[4px] hover:bg-slate-50 text-slate-700 bg-white cursor-pointer disabled:opacity-40"
              >
                Prev
              </Button>
              <span className="font-semibold px-2.5 text-slate-700">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                className="h-8 px-2.5 border-[#CBD5E1] text-xs font-semibold rounded-[4px] hover:bg-slate-50 text-slate-700 bg-white cursor-pointer disabled:opacity-40"
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.totalPages)}
                className="h-8 px-2.5 border-[#CBD5E1] text-xs font-semibold rounded-[4px] hover:bg-slate-50 text-slate-700 bg-white cursor-pointer disabled:opacity-40"
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
