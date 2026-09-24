'use client';

import { useId } from 'react';

import {
  DateRangeFields,
  FiltersMenu,
  filterSelectClassName,
} from '@/components/shared/filters-menu';
import { Label } from '@/components/ui/label';

type CustomerFiltersProps = {
  country: string;
  /** Created-date range (YYYY-MM-DD), inclusive. */
  from: string;
  to: string;
  limit: number;
  countries: string[];
};

/** "Filters" button that opens a panel with created-date and country filters. */
export function CustomerFilters({ country, from, to, limit, countries }: CustomerFiltersProps) {
  const uid = useId();
  const activeCount = Number(Boolean(from || to)) + Number(Boolean(country));

  return (
    <FiltersMenu action="/customers" activeCount={activeCount} label="Filter customers">
      <DateRangeFields legend="Created date" from={from} to={to} />

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-country`}>Country</Label>
        <select
          id={`${uid}-country`}
          name="country"
          defaultValue={country}
          className={filterSelectClassName}
        >
          <option value="">All countries</option>
          {countries.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="limit" value={limit} />
    </FiltersMenu>
  );
}
