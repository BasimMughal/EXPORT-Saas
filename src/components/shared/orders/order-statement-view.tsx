'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { PAYMENT_METHOD_LABELS } from '@/lib/validations/payment';
import type { OrderFinancials } from '@/lib/finance/order-financials';

export type StatementPayload = {
  orderNumber: string;
  productName: string;
  description: string;
  quantity: number;
  status: string;
  currency: string;
  orderDate: string;
  deliveryDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    company: string;
    country: string;
    phone: string;
    email: string;
  };
  payments: Array<{
    amount: number;
    paymentDate: string;
    method: string;
    referenceNumber: string;
    notes: string;
  }>;
  expenses: Array<{
    title: string;
    categoryName: string;
    amount: number;
    expenseDate: string;
    notes: string;
  }>;
  financials: OrderFinancials;
};

export function OrderStatementView({ payload }: { payload: StatementPayload }) {
  const printRef = useRef<HTMLDivElement>(null);

  async function downloadPdf() {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      const { financials: f, currency } = payload;

      doc.setFontSize(16);
      doc.text('ExportFlow Order Statement', 14, 18);
      doc.setFontSize(10);
      doc.text(`Order ${payload.orderNumber} · ${payload.status.replace('_', ' ')}`, 14, 26);
      doc.text(
        `Customer: ${payload.customer.company || payload.customer.name} · ${payload.customer.country}`,
        14,
        32,
      );
      doc.text(
        `Order value ${formatCurrency(f.orderValue, currency)} · Received ${formatCurrency(f.totalPaymentsReceived, currency)} · Outstanding ${formatCurrency(f.outstandingBalance, currency)}`,
        14,
        38,
      );
      doc.text(
        `Expenses ${formatCurrency(f.totalExpenses, currency)} · Contract profit ${formatCurrency(f.contractProfit, currency)} · Cash profit ${formatCurrency(f.cashProfit, currency)}`,
        14,
        44,
      );

      autoTable(doc, {
        startY: 52,
        head: [['Date', 'Method', 'Reference', 'Amount']],
        body: payload.payments.map((p) => [
          formatDateDisplay(p.paymentDate),
          PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS] ?? p.method,
          p.referenceNumber || '—',
          formatCurrency(p.amount, currency),
        ]),
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        // @ts-expect-error autotable extends jsPDF
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 8 || 120,
        head: [['Expense', 'Category', 'Date', 'Amount']],
        body: payload.expenses.map((e) => [
          e.title,
          e.categoryName,
          formatDateDisplay(e.expenseDate),
          formatCurrency(e.amount, currency),
        ]),
        styles: { fontSize: 8 },
      });

      doc.save(`${payload.orderNumber}-statement.pdf`);
      toast.success('Statement PDF downloaded.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to generate PDF.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button className="rounded-xl" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => void downloadPdf()}>
          Download PDF
        </Button>
      </div>

      <div
        ref={printRef}
        className="surface-card space-y-6 p-6 text-sm print:border-0 print:bg-white print:text-black print:shadow-none"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Order statement</p>
            <h1 className="font-display mt-1 text-2xl font-semibold">{payload.orderNumber}</h1>
            <p className="text-muted-foreground">{payload.productName}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Created {formatDateDisplay(payload.createdAt)}</p>
            <p>Updated {formatDateDisplay(payload.updatedAt)}</p>
            <p className="mt-1 capitalize">Status: {payload.status.replace('_', ' ')}</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="font-semibold">Customer</h2>
            <p>{payload.customer.company || payload.customer.name}</p>
            <p>{payload.customer.name}</p>
            <p>{payload.customer.country}</p>
            <p>{payload.customer.email}</p>
            <p>{payload.customer.phone}</p>
          </div>
          <div>
            <h2 className="font-semibold">Order</h2>
            <p>Quantity: {payload.quantity.toLocaleString()}</p>
            <p>Currency: {payload.currency}</p>
            <p>Order date: {formatDateDisplay(payload.orderDate)}</p>
            <p>Delivery: {formatDateDisplay(payload.deliveryDate)}</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Order value', payload.financials.orderValue],
            ['Payments received', payload.financials.totalPaymentsReceived],
            ['Outstanding balance', payload.financials.outstandingBalance],
            ['Total expenses', payload.financials.totalExpenses],
            ['Contract profit', payload.financials.contractProfit],
            ['Cash profit', payload.financials.cashProfit],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold">{formatCurrency(Number(value), payload.currency)}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Payment history</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payload.payments.map((payment, index) => (
                <tr key={`${payment.paymentDate}-${index}`} className="border-b border-border/60">
                  <td className="py-2">{formatDateDisplay(payment.paymentDate)}</td>
                  <td>
                    {PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS] ??
                      payment.method}
                  </td>
                  <td>{payment.referenceNumber || '—'}</td>
                  <td className="text-right">
                    {formatCurrency(payment.amount, payload.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Expense breakdown</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">Expense</th>
                <th>Category</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payload.expenses.map((expense) => (
                <tr key={expense.title + expense.expenseDate} className="border-b border-border/60">
                  <td className="py-2">{expense.title}</td>
                  <td>{expense.categoryName}</td>
                  <td>{formatDateDisplay(expense.expenseDate)}</td>
                  <td className="text-right">
                    {formatCurrency(expense.amount, payload.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
