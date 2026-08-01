import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import type { CurrencyCode } from '@/config/currency';

export type ExpenseRow = {
  id: string;
  title: string;
  categoryName: string;
  orderNumber: string;
  amount: number;
  currency?: CurrencyCode | string;
  expenseDate: string;
  notes: string;
};

export function ExpenseTable({ rows }: { rows: ExpenseRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Track fabric, labour, shipping, and customs costs against your orders."
        action={
          <Button asChild className="rounded-xl">
            <Link href="/expenses/new">Add expense</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{row.title}</p>
                  {row.notes ? (
                    <p className="max-w-xs truncate text-xs text-muted-foreground">{row.notes}</p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{row.categoryName}</TableCell>
              <TableCell>{row.orderNumber || '—'}</TableCell>
              <TableCell>{formatDateDisplay(row.expenseDate)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(row.amount, row.currency)}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/expenses/${row.id}/edit`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
