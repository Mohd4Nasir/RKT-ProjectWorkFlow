import { useMemo, useState } from 'react';
import { FilterValues } from '../ProjectsFilterDrawer';

export const emptyFilterValues: FilterValues = { match: 'all', values: {} };

export function matchPredicates(predicates: boolean[], mode: 'any' | 'all') {
  if (predicates.length === 0) return true;
  return mode === 'all' ? predicates.every(Boolean) : predicates.some(Boolean);
}

export interface UseProjectsFilterOptions<T> {
  items: T[];
  query: string;
  filters: FilterValues;
  searchOf: (item: T) => string;
  predicates: (item: T, values: Record<string, string>) => boolean[];
}

export function useProjectsFilter<T>({
  items, query, filters, searchOf, predicates,
}: UseProjectsFilterOptions<T>) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (q && !searchOf(it).toLowerCase().includes(q)) return false;
      return matchPredicates(predicates(it, filters.values), filters.match);
    });
  }, [items, query, filters, searchOf, predicates]);
}

/** `initial` = filters already applied when the page opens (reset() still clears everything) */
export function useFilterState(initial: FilterValues = emptyFilterValues) {
  const [values, setValues] = useState<FilterValues>(initial);
  const reset = () => setValues(emptyFilterValues);
  return { values, setValues, reset };
}
