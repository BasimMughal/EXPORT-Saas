import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Option = {
  id: string;
  label: string;
};

type OrderFiltersProps = {
  q: string;
  status: string;
  customerId: string;
  sort: string;
  order: string;
  limit: number;
  customers: Option[];
};

export function OrderFilters({
  q,
  status,
  customerId,
  sort,
  order,
  limit,
  customers,
}: OrderFiltersProps) {
  return (
    <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto]">
      <Input name="q" placeholder="Search orders" defaultValue={q} />

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="customerId" defaultValue={customerId}>
        <option value="">All customers</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.label}
          </option>
        ))}
      </select>

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="status" defaultValue={status}>
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="abandoned">Abandoned</option>
      </select>

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="sort" defaultValue={sort}>
        <option value="createdAt">Created date</option>
        <option value="orderNumber">Order number</option>
        <option value="productName">Product name</option>
        <option value="quantity">Quantity</option>
        <option value="receivedAmount">Received amount</option>
        <option value="orderDate">Order date</option>
        <option value="deliveryDate">Delivery date</option>
        <option value="status">Status</option>
      </select>

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="order" defaultValue={order}>
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>

      <input type="hidden" name="limit" value={limit} />

      <div className="flex gap-2 xl:justify-end">
        <Button type="submit">Apply</Button>
        <Button asChild variant="outline">
          <Link href="/orders">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
