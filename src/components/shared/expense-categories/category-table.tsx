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
import { deleteExpenseCategoryAction } from '@/app/(app)/expense-categories/actions';
import { DeleteCategoryButton as DeleteCategorySubmitButton } from '@/components/shared/expense-categories/delete-category-button';

type CategoryRow = {
  id: string;
  name: string;
  createdAt: string;
};

type CategoryTableProps = {
  rows: CategoryRow[];
};

function DeleteCategoryForm({ categoryId }: { categoryId: string }) {
  return (
    <form action={deleteExpenseCategoryAction.bind(null, categoryId)}>
      <DeleteCategorySubmitButton />
    </form>
  );
}

export function CategoryTable({ rows }: CategoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/expense-categories/${row.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteCategoryForm categoryId={row.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                No expense categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
