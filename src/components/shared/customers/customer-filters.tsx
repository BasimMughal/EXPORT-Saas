import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CustomerFiltersProps = {
  q: string;
  country: string;
  sort: string;
  order: string;
  limit: number;
  countries: string[];
};

export function CustomerFilters({ q, country, sort, order, limit, countries }: CustomerFiltersProps) {
  return (
    <form className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
      <Input name="q" placeholder="Search customers" defaultValue={q} />

      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        name="country"
        defaultValue={country}
      >
        <option value="">All countries</option>
        {countries.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="sort" defaultValue={sort}>
        <option value="createdAt">Created date</option>
        <option value="name">Name</option>
        <option value="company">Company</option>
        <option value="country">Country</option>
        <option value="email">Email</option>
      </select>

      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="order" defaultValue={order}>
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>

      <input type="hidden" name="limit" value={limit} />

      <div className="flex gap-2 md:col-start-5">
        <Button type="submit">Apply</Button>
        <Button asChild variant="outline">
          <Link href="/customers">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
