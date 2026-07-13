/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ListResult } from '../types';
import { ListQueryValues } from '../validation';

/**
 * Single shared search/filter/sort/paginate implementation used by every
 * list endpoint in src/app/api/**. Previously this logic was hand-duplicated
 * per view (Leads/Contacts/Deals/Tasks) with subtly different sort
 * semantics — this is the one place it lives now.
 */
export function paginateAndFilter<T extends Record<string, any>>(
  items: T[],
  query: ListQueryValues,
  opts: {
    searchFields: (keyof T)[];
    filters?: Partial<Record<keyof T, string>>;
  }
): ListResult<T> {
  let result = items;

  if (opts.filters) {
    for (const [key, value] of Object.entries(opts.filters)) {
      if (value === undefined || value === '' || value === 'All') continue;
      result = result.filter((item) => item[key] === value);
    }
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter((item) =>
      opts.searchFields.some((field) => String(item[field] ?? '').toLowerCase().includes(needle))
    );
  }

  if (query.sortField) {
    const field = query.sortField;
    const direction = query.sortOrder === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * direction;
      return String(valA ?? '').localeCompare(String(valB ?? '')) * direction;
    });
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items_ = result.slice(start, start + pageSize);

  return { items: items_, total, page, pageSize, totalPages };
}
