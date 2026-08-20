import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteCustomerButton } from '@/components/shared/customers/delete-customer-button';

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
};

export function CustomerTable({ rows }: CustomerTableProps) {
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                    {customer.notes ? (
                      <p className="max-w-[360px] truncate text-xs text-muted-foreground">{customer.notes}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No notes</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{customer.company || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{customer.country}</Badge>
                </TableCell>
                <TableCell>{customer.phone || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{customer.email || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{customer.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/customers/${customer.id}`}>History</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/customers/${customer.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteCustomerButton customerId={customer.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={7}>
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
