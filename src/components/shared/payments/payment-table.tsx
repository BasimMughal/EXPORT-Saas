import Link from 'next/link';

import { deletePaymentAction } from '@/app/(app)/payments/actions';
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
import { PAYMENT_METHOD_LABELS, type PAYMENT_METHODS } from '@/lib/validations/payment';

export type PaymentRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentDate: string;
  method: (typeof PAYMENT_METHODS)[number] | string;
  referenceNumber: string;
  notes: string;
  customerName?: string;
};

export function PaymentTable({
  rows,
  showOrder = true,
  returnOrderId,
}: {
  rows: PaymentRow[];
  showOrder?: boolean;
  returnOrderId?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No payments recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {showOrder ? <TableHead>Order</TableHead> : null}
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {showOrder ? (
                <TableCell>
                  <Link href={`/orders/${row.orderId}`} className="font-medium hover:underline">
                    {row.orderNumber || row.orderId}
                  </Link>
                  {row.customerName ? (
                    <p className="text-xs text-muted-foreground">{row.customerName}</p>
                  ) : null}
                </TableCell>
              ) : null}
              <TableCell>{formatDateDisplay(row.paymentDate)}</TableCell>
              <TableCell>
                {PAYMENT_METHOD_LABELS[row.method as keyof typeof PAYMENT_METHOD_LABELS] ??
                  row.method}
              </TableCell>
              <TableCell className="max-w-[160px] truncate">
                {row.referenceNumber || '—'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(row.amount, row.currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/payments/${row.id}/edit`}>Edit</Link>
                  </Button>
                  <form
                    action={
                      deletePaymentAction.bind(null, row.id) as unknown as (
                        formData: FormData,
                      ) => Promise<void>
                    }
                  >                    {returnOrderId ? (
                      <input type="hidden" name="orderId" value={returnOrderId} />
                    ) : null}
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
