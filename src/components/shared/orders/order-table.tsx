import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteOrderButton } from '@/components/shared/orders/delete-order-button';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { deleteOrderAction } from '@/app/(app)/orders/actions';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import type { CurrencyCode } from '@/config/currency';

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  orderValue: number;
  currency?: CurrencyCode | string;
  orderDate: string;
  deliveryDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  notes: string;
};

type OrderTableProps = {
  rows: OrderRow[];
};

export function OrderTable({ rows }: OrderTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Order Value</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
                      {order.orderNumber}
                    </Link>
                    {order.notes ? (
                      <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                        {order.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No notes</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <p className="font-medium">{order.productName}</p>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{formatCurrency(order.orderValue, order.currency)}</TableCell>
                <TableCell>{formatDateDisplay(order.orderDate)}</TableCell>
                <TableCell>{formatDateDisplay(order.deliveryDate)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${order.id}/edit`}>Edit</Link>
                    </Button>
                    <form action={deleteOrderAction.bind(null, order.id)}>
                      <DeleteOrderButton />
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={9}>
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
