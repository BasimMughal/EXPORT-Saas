'use client';

import { useId } from 'react';

import {
  DateRangeFields,
  FiltersMenu,
  filterSelectClassName,
} from '@/components/shared/filters-menu';
import { Label } from '@/components/ui/label';

type Option = {
  id: string;
  label: string;
};

type OrderFiltersProps = {
  status: string;
  customerId: string;
  /** Order date range (YYYY-MM-DD), inclusive. */
  from: string;
  to: string;
  limit: number;
  customers: Option[];
};

/** "Filters" button that opens a panel with date, customer and status filters. */
export function OrderFilters({
  status,
  customerId,
  from,
  to,
  limit,
  customers,
}: OrderFiltersProps) {
  const uid = useId();
  const activeCount =
    Number(Boolean(from || to)) + Number(Boolean(status)) + Number(Boolean(customerId));

  return (
    <FiltersMenu action="/orders" activeCount={activeCount} label="Filter orders">
      <DateRangeFields legend="Order date" from={from} to={to} />

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-customer`}>Customer</Label>
        <select
          id={`${uid}-customer`}
          name="customerId"
          defaultValue={customerId}
          className={filterSelectClassName}
        >
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-status`}>Status</Label>
        <select
          id={`${uid}-status`}
          name="status"
          defaultValue={status}
          className={filterSelectClassName}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      <input type="hidden" name="limit" value={limit} />
    </FiltersMenu>
  );
}
