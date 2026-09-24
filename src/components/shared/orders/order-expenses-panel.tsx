'use client';

import { useState, useTransition } from 'react';
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteOrderExpenseAction, saveOrderExpenseAction } from '@/app/(app)/expenses/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ExpenseForm } from '@/components/shared/expenses/expense-form';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';

export type OrderExpenseRow = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  expenseDate: string;
  notes: string;
};

type OrderExpensesPanelProps = {
  orderId: string;
  orderLabel: string;
  currency: string;
  categories: Array<{ id: string; label: string }>;
  expenses: OrderExpenseRow[];
  /** Count + total band above the table; hide it where totals are already shown. */
  showSummary?: boolean;
};

export function OrderExpensesPanel({
  orderId,
  orderLabel,
  currency,
  categories,
  expenses,
  showSummary = true,
}: OrderExpensesPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrderExpenseRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderExpenseRow | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(expense: OrderExpenseRow) {
    setEditing(expense);
    setFormOpen(true);
  }

  function openDelete(expense: OrderExpenseRow) {
    setDeleteTarget(expense);
    setDeleteOpen(true);
  }

  async function handleSave(formData: FormData) {
    const result = await saveOrderExpenseAction(orderId, editing?.id ?? null, formData);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setFormOpen(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    const expenseId = deleteTarget.id;
    startDelete(async () => {
      const result = await deleteOrderExpenseAction(orderId, expenseId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setDeleteOpen(false);
    });
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">
              Order expenses
              {expenses.length ? (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                  {expenses.length}
                </span>
              ) : null}
            </h2>
            <p className="text-sm text-muted-foreground">
              Costs linked to this order, recorded in {currency}.
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No expenses yet"
            description="Record freight, fabric, packaging and other costs to see this order's real profit."
            action={
              <Button variant="outline" className="rounded-xl" onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add first expense
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {showSummary ? (
            <div className="flex flex-wrap gap-x-10 gap-y-2 border-b border-border/70 bg-muted/30 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Expenses
                </p>
                <p className="font-display text-lg font-semibold">{expenses.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Total cost
                </p>
                <p className="font-display text-lg font-semibold">
                  {formatCurrency(total, currency)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Expense</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pl-0 pr-4 text-right sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        <span className="sm:hidden">{expense.categoryName} · </span>
                        {formatDateDisplay(expense.expenseDate)}
                      </p>
                      {expense.notes ? (
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {expense.notes}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="whitespace-nowrap font-normal">
                        {expense.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                      {formatDateDisplay(expense.expenseDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatCurrency(expense.amount, currency)}
                    </TableCell>
                    <TableCell className="pl-0 pr-4 sm:pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit ${expense.title}`}
                          title="Edit expense"
                          onClick={() => openEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${expense.title}`}
                          title="Delete expense"
                          onClick={() => openDelete(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? 'Edit expense' : 'Add expense'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the details of this expense.'
                : `Add a cost to ${orderLabel}. It is recorded in the order currency (${currency}).`}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            key={editing?.id ?? 'new'}
            variant="plain"
            action={handleSave}
            onCancel={() => setFormOpen(false)}
            categories={categories}
            orders={[{ id: orderId, label: orderLabel, currency }]}
            lockOrderId
            submitLabel={editing ? 'Save changes' : 'Add expense'}
            defaultValues={
              editing
                ? {
                    title: editing.title,
                    amount: editing.amount,
                    categoryId: editing.categoryId,
                    orderId,
                    currency,
                    expenseDate: editing.expenseDate,
                    notes: editing.notes,
                  }
                : { orderId, currency, expenseDate: new Date() }
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !isDeleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.title}” (${formatCurrency(deleteTarget.amount, currency)}) will be permanently removed from this order and its profit figures. This can't be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete expense'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
