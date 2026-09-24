import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClickableRow } from '@/components/shared/clickable-row';
import { CountryChip, countryKey } from '@/components/shared/customers/country-chip';

type CustomerRow = {
  id: string;
  name: string;
  company: string;
  country: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

type CustomerTableProps = {
  rows: CustomerRow[];
  /** Country key → palette position, so every country gets a consistent, distinct colour. */
  countryColors?: Record<string, number>;
};

export function CustomerTable({ rows, countryColors }: CustomerTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((customer) => (
              <ClickableRow
                key={customer.id}
                href={`/customers/${customer.id}`}
                label={`Open customer ${customer.company || customer.name}`}
              >
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="whitespace-nowrap text-primary hover:underline"
                    >
                      {customer.name}
                    </Link>
                    {customer.notes ? (
                      <p className="max-w-[360px] truncate text-xs text-muted-foreground">
                        {customer.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No notes</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {customer.company || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <CountryChip
                    country={customer.country}
                    colorIndex={countryColors?.[countryKey(customer.country)]}
                  />
                </TableCell>
                <TableCell>
                  {customer.phone || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  {customer.email || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="whitespace-nowrap">{customer.createdAt}</TableCell>
              </ClickableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
