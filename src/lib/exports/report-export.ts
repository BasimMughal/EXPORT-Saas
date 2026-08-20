import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import type { CurrencyCode } from '@/config/currency';
import type { DashboardKpis, MonthlyPoint } from '@/types/domain';

type ReportPayload = {
  generatedAt: string;
  displayCurrency?: CurrencyCode | string;
  kpis: DashboardKpis;
  yearly?: {
    year: number;
    revenue: number;
    expenses: number;
    contractProfit: number;
    cashProfit: number;
  };
  monthly?: MonthlyPoint[];
  customers: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  payments?: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
};

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function money(value: unknown, currency?: string) {
  return formatCurrency(Number(value ?? 0), currency);
}

export function exportReportCsv(payload: ReportPayload) {
  const currency = String(payload.displayCurrency ?? 'PKR');
  const lines = [
    'ExportFlow Business Report',
    `Generated,${payload.generatedAt}`,
    `Display Currency,${currency}`,
    '',
    'KPI,Value',
    `Customers,${payload.kpis.totalCustomers}`,
    `Orders,${payload.kpis.totalOrders}`,
    `Pending,${payload.kpis.pendingOrders}`,
    `In Progress,${payload.kpis.inProgressOrders}`,
    `Completed,${payload.kpis.completedOrders}`,
    `Abandoned,${payload.kpis.abandonedOrders}`,
    `Order Value,${payload.kpis.totalOrderValue}`,
    `Payments Received,${payload.kpis.totalPaymentsReceived}`,
    `Outstanding Balance,${payload.kpis.totalOutstandingBalance}`,
    `Expenses,${payload.kpis.totalExpenses}`,
    `Contract Profit,${payload.kpis.totalContractProfit}`,
    `Cash Profit,${payload.kpis.totalCashProfit}`,
    '',
    'Orders',
    'Order Number,Customer,Product,Status,Order Value,Payments,Outstanding,Contract Profit,Cash Profit,Currency,Order Date',
    ...payload.orders.map((order) => {
      const financials = (order.financials ?? {}) as Record<string, number>;
      return [
        order.orderNumber,
        order.customerName,
        order.productName,
        order.status,
        financials.orderValue ?? order.orderValue ?? '',
        financials.totalPaymentsReceived ?? '',
        financials.outstandingBalance ?? '',
        financials.contractProfit ?? '',
        financials.cashProfit ?? '',
        order.currency ?? currency,
        formatDateDisplay(String(order.orderDate)),
      ].join(',');
    }),
    '',
    'Payments',
    'Order,Customer,Date,Method,Reference,Amount,Currency',
    ...(payload.payments ?? []).map((payment) =>
      [
        payment.orderNumber,
        payment.customerName,
        formatDateDisplay(String(payment.paymentDate)),
        payment.method,
        payment.referenceNumber || '',
        payment.amount,
        payment.currency ?? currency,
      ].join(','),
    ),
    '',
    'Expenses',
    'Title,Category,Order,Amount,Currency,Date',
    ...payload.expenses.map((expense) =>
      [
        `"${String(expense.title).replaceAll('"', '""')}"`,
        expense.categoryName,
        expense.orderNumber || '',
        expense.amount,
        expense.currency ?? currency,
        formatDateDisplay(String(expense.expenseDate)),
      ].join(','),
    ),
  ];

  downloadBlob(
    `exportflow-report-${Date.now()}.csv`,
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
  );
}

export async function exportReportExcel(payload: ReportPayload) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const currency = String(payload.displayCurrency ?? 'PKR');
  const summary = XLSX.utils.aoa_to_sheet([
    ['ExportFlow Business Report'],
    ['Generated', payload.generatedAt],
    ['Display Currency', currency],
    [],
    ['Metric', 'Value'],
    ['Customers', payload.kpis.totalCustomers],
    ['Orders', payload.kpis.totalOrders],
    ['Pending', payload.kpis.pendingOrders],
    ['In Progress', payload.kpis.inProgressOrders],
    ['Completed', payload.kpis.completedOrders],
    ['Abandoned', payload.kpis.abandonedOrders],
    ['Order Value', payload.kpis.totalOrderValue],
    ['Payments Received', payload.kpis.totalPaymentsReceived],
    ['Outstanding Balance', payload.kpis.totalOutstandingBalance],
    ['Expenses', payload.kpis.totalExpenses],
    ['Contract Profit', payload.kpis.totalContractProfit],
    ['Cash Profit', payload.kpis.totalCashProfit],
    ...(payload.yearly
      ? [
          [],
          [`Year ${payload.yearly.year}`],
          ['Yearly Revenue', payload.yearly.revenue],
          ['Yearly Expenses', payload.yearly.expenses],
          ['Yearly Contract Profit', payload.yearly.contractProfit],
          ['Yearly Cash Profit', payload.yearly.cashProfit],
        ]
      : []),
  ]);
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

  const ordersSheet = XLSX.utils.json_to_sheet(
    payload.orders.map((order) => {
      const financials = (order.financials ?? {}) as Record<string, number>;
      return {
        orderNumber: order.orderNumber,
        customer: order.customerName,
        product: order.productName,
        status: order.status,
        orderValue: financials.orderValue ?? order.orderValue,
        paymentsReceived: financials.totalPaymentsReceived,
        outstanding: financials.outstandingBalance,
        contractProfit: financials.contractProfit,
        cashProfit: financials.cashProfit,
        currency: order.currency ?? currency,
        orderDate: formatDateDisplay(String(order.orderDate)),
      };
    }),
  );
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

  const paymentsSheet = XLSX.utils.json_to_sheet(
    (payload.payments ?? []).map((payment) => ({
      order: payment.orderNumber,
      customer: payment.customerName,
      date: formatDateDisplay(String(payment.paymentDate)),
      method: payment.method,
      reference: payment.referenceNumber,
      amount: payment.amount,
      currency: payment.currency ?? currency,
    })),
  );
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');

  const expensesSheet = XLSX.utils.json_to_sheet(
    payload.expenses.map((expense) => ({
      title: expense.title,
      category: expense.categoryName,
      order: expense.orderNumber,
      amount: expense.amount,
      currency: expense.currency ?? currency,
      date: formatDateDisplay(String(expense.expenseDate)),
    })),
  );
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

  const customersSheet = XLSX.utils.json_to_sheet(
    payload.customers.map((customer) => ({
      name: customer.name,
      company: customer.company,
      country: customer.country,
      email: customer.email,
      phone: customer.phone,
    })),
  );
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');

  if (payload.monthly?.length) {
    const monthlySheet = XLSX.utils.json_to_sheet(
      payload.monthly.map((point) => ({
        month: point.month,
        revenue: point.revenue,
        expenses: point.expenses,
        contractProfit: point.contractProfit,
        cashProfit: point.cashProfit,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly');
  }

  XLSX.writeFile(workbook, `exportflow-report-${Date.now()}.xlsx`);
}

export async function exportReportPdf(payload: ReportPayload) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const display = String(payload.displayCurrency ?? 'PKR');

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('ExportFlow Business Report', 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDateDisplay(payload.generatedAt)}`, 14, 26);
  doc.text(
    `Payments ${money(payload.kpis.totalPaymentsReceived, display)} · Outstanding ${money(payload.kpis.totalOutstandingBalance, display)} · Cash profit ${money(payload.kpis.totalCashProfit, display)}`,
    14,
    32,
  );
  doc.text(
    `Contract profit ${money(payload.kpis.totalContractProfit, display)} · Expenses ${money(payload.kpis.totalExpenses, display)}`,
    14,
    38,
  );

  autoTable(doc, {
    startY: 46,
    head: [['Order', 'Customer', 'Value', 'Received', 'Outstanding', 'Status']],
    body: payload.orders.slice(0, 20).map((order) => {
      const financials = (order.financials ?? {}) as Record<string, number>;
      const currency = String(order.currency ?? display);
      return [
        String(order.orderNumber ?? ''),
        String(order.customerName ?? ''),
        money(financials.orderValue ?? order.orderValue, currency),
        money(financials.totalPaymentsReceived, currency),
        money(financials.outstandingBalance, currency),
        String(order.status ?? ''),
      ];
    }),
    styles: { fontSize: 7 },
  });

  autoTable(doc, {
    // @ts-expect-error autotable extends jsPDF
    startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 8 || 120,
    head: [['Payment', 'Order', 'Method', 'Amount', 'Date']],
    body: (payload.payments ?? []).slice(0, 20).map((payment) => [
      String(payment.referenceNumber || payment.method || ''),
      String(payment.orderNumber ?? ''),
      String(payment.method ?? ''),
      money(payment.amount, String(payment.currency ?? display)),
      formatDateDisplay(String(payment.paymentDate ?? '')),
    ]),
    styles: { fontSize: 7 },
  });

  doc.save(`exportflow-report-${Date.now()}.pdf`);
}
