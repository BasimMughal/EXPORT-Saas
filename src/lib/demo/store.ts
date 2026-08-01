import {
  convertCurrency,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from '@/config/currency';
import { DEMO_ACCOUNT } from '@/lib/auth/demo';
import { computeOrderFinancials } from '@/lib/finance/order-financials';
import type {
  CategoryBreakdown,
  CustomerRecord,
  DashboardKpis,
  ExpenseCategoryRecord,
  ExpenseRecord,
  MonthlyPoint,
  OrderRecord,
  PaymentRecord,
} from '@/types/domain';

const uid = DEMO_ACCOUNT.id;

function iso(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function monthKey(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toPreferred(amount: number, currency: CurrencyCode, preferred: CurrencyCode) {
  return convertCurrency(amount, currency, preferred);
}

let preferredCurrency: CurrencyCode = DEFAULT_CURRENCY;
let paymentSeq = 100;

const customers: CustomerRecord[] = [
  {
    id: 'c001',
    userId: uid,
    name: 'Hans Mueller',
    company: 'Alpine Apparel GmbH',
    country: 'Germany',
    phone: '+49 30 123456',
    email: 'hans@alpineapparel.de',
    notes: 'Prefers organic cotton. Net 30 terms.',
    createdAt: iso(120),
    updatedAt: iso(20),
  },
  {
    id: 'c002',
    userId: uid,
    name: 'Sophie Laurent',
    company: 'Maison Textile Paris',
    country: 'France',
    phone: '+33 1 445566',
    email: 'sophie@maisontextile.fr',
    notes: 'Seasonal collections. High volume Q3.',
    createdAt: iso(95),
    updatedAt: iso(12),
  },
  {
    id: 'c003',
    userId: uid,
    name: 'James Whitfield',
    company: 'Northbridge Retail UK',
    country: 'United Kingdom',
    phone: '+44 20 7946000',
    email: 'james@northbridge.co.uk',
    notes: 'Strict QC on stitching and labeling.',
    createdAt: iso(80),
    updatedAt: iso(8),
  },
  {
    id: 'c004',
    userId: uid,
    name: 'Emily Carter',
    company: 'Pacific Wear Co.',
    country: 'United States',
    phone: '+1 212 5550199',
    email: 'emily@pacificwear.com',
    notes: 'FOB Karachi. Weekly status calls.',
    createdAt: iso(60),
    updatedAt: iso(5),
  },
  {
    id: 'c005',
    userId: uid,
    name: 'Omar Al-Hassan',
    company: 'Gulf Style Trading',
    country: 'UAE',
    phone: '+971 4 321000',
    email: 'omar@gulfstyle.ae',
    notes: 'Ramadan rush orders. Priority client.',
    createdAt: iso(40),
    updatedAt: iso(3),
  },
];

const categories: ExpenseCategoryRecord[] = [
  { id: 'cat01', userId: uid, name: 'Fabric', nameNormalized: 'fabric', createdAt: iso(130), updatedAt: iso(130) },
  { id: 'cat02', userId: uid, name: 'Labour', nameNormalized: 'labour', createdAt: iso(130), updatedAt: iso(130) },
  { id: 'cat03', userId: uid, name: 'Shipping', nameNormalized: 'shipping', createdAt: iso(130), updatedAt: iso(130) },
  { id: 'cat04', userId: uid, name: 'Customs', nameNormalized: 'customs', createdAt: iso(130), updatedAt: iso(130) },
  { id: 'cat05', userId: uid, name: 'Packaging', nameNormalized: 'packaging', createdAt: iso(130), updatedAt: iso(130) },
  { id: 'cat06', userId: uid, name: 'Printing', nameNormalized: 'printing', createdAt: iso(130), updatedAt: iso(130) },
];

const orders: OrderRecord[] = [
  {
    id: 'o001',
    userId: uid,
    customerId: 'c001',
    orderNumber: 'ORD-20260315-0001',
    productName: 'Men Organic Cotton Polo',
    description: '240gsm, navy/white, sizes S-XXL',
    quantity: 5000,
    orderValue: 39200,
    currency: 'EUR',
    orderDate: iso(90),
    deliveryDate: iso(55),
    status: 'completed',
    notes: 'Shipped via Hamburg.',
    createdAt: iso(90),
    updatedAt: iso(55),
  },
  {
    id: 'o002',
    userId: uid,
    customerId: 'c002',
    orderNumber: 'ORD-20260402-0002',
    productName: 'Women Linen Summer Dress',
    description: 'SS26 capsule, 3 colorways',
    quantity: 3200,
    orderValue: 47100,
    currency: 'EUR',
    orderDate: iso(70),
    deliveryDate: iso(35),
    status: 'completed',
    notes: '',
    createdAt: iso(70),
    updatedAt: iso(35),
  },
  {
    id: 'o003',
    userId: uid,
    customerId: 'c003',
    orderNumber: 'ORD-20260510-0003',
    productName: 'Kids Fleece Hoodie',
    description: 'Brushed inside, schoolwear line',
    quantity: 8000,
    orderValue: 30400,
    currency: 'GBP',
    orderDate: iso(45),
    deliveryDate: iso(10),
    status: 'in_progress',
    notes: 'Label artwork approved.',
    createdAt: iso(45),
    updatedAt: iso(10),
  },
  {
    id: 'o004',
    userId: uid,
    customerId: 'c004',
    orderNumber: 'ORD-20260601-0004',
    productName: 'Unisex Denim Jacket',
    description: 'Mid-wash, metal buttons',
    quantity: 2500,
    orderValue: 67500,
    currency: 'USD',
    orderDate: iso(25),
    deliveryDate: null,
    status: 'in_progress',
    notes: 'Fabric booked.',
    createdAt: iso(25),
    updatedAt: iso(4),
  },
  {
    id: 'o005',
    userId: uid,
    customerId: 'c005',
    orderNumber: 'ORD-20260620-0005',
    productName: 'Abaya Premium Twill',
    description: 'Black & charcoal, size run',
    quantity: 1800,
    orderValue: 8280000,
    currency: 'PKR',
    orderDate: iso(12),
    deliveryDate: null,
    status: 'pending',
    notes: 'Awaiting deposit confirmation.',
    createdAt: iso(12),
    updatedAt: iso(2),
  },
  {
    id: 'o006',
    userId: uid,
    customerId: 'c001',
    orderNumber: 'ORD-20260705-0006',
    productName: 'Sports Jersey Set',
    description: 'Sublimated print, club kits',
    quantity: 4000,
    orderValue: 20200,
    currency: 'EUR',
    orderDate: iso(5),
    deliveryDate: null,
    status: 'pending',
    notes: '',
    createdAt: iso(5),
    updatedAt: iso(1),
  },
];

const payments: PaymentRecord[] = [
  { id: 'p001', userId: uid, orderId: 'o001', amount: 10000, paymentDate: iso(88), method: 'bank_transfer', referenceNumber: 'BT-ALP-001', notes: 'Advance', createdAt: iso(88), updatedAt: iso(88) },
  { id: 'p002', userId: uid, orderId: 'o001', amount: 15000, paymentDate: iso(70), method: 'wise', referenceNumber: 'WISE-9921', notes: 'Second tranche', createdAt: iso(70), updatedAt: iso(70) },
  { id: 'p003', userId: uid, orderId: 'o001', amount: 14200, paymentDate: iso(56), method: 'bank_transfer', referenceNumber: 'BT-ALP-014', notes: 'Final payment', createdAt: iso(56), updatedAt: iso(56) },
  { id: 'p004', userId: uid, orderId: 'o002', amount: 47100, paymentDate: iso(60), method: 'bank_transfer', referenceNumber: 'BT-MTP-220', notes: 'Full payment', createdAt: iso(60), updatedAt: iso(60) },
  { id: 'p005', userId: uid, orderId: 'o003', amount: 10000, paymentDate: iso(40), method: 'wise', referenceNumber: 'WISE-4410', notes: 'Advance', createdAt: iso(40), updatedAt: iso(40) },
  { id: 'p006', userId: uid, orderId: 'o003', amount: 8000, paymentDate: iso(20), method: 'bank_transfer', referenceNumber: 'BT-NB-088', notes: '', createdAt: iso(20), updatedAt: iso(20) },
  { id: 'p007', userId: uid, orderId: 'o004', amount: 20000, paymentDate: iso(22), method: 'bank_transfer', referenceNumber: 'BT-PW-301', notes: 'Deposit', createdAt: iso(22), updatedAt: iso(22) },
  { id: 'p008', userId: uid, orderId: 'o005', amount: 2000000, paymentDate: iso(10), method: 'western_union', referenceNumber: 'WU-77821', notes: 'Advance', createdAt: iso(10), updatedAt: iso(10) },
  { id: 'p009', userId: uid, orderId: 'o006', amount: 5000, paymentDate: iso(3), method: 'cash', referenceNumber: '', notes: 'Sample deposit', createdAt: iso(3), updatedAt: iso(3) },
];

const expenses: ExpenseRecord[] = [
  { id: 'e001', userId: uid, categoryId: 'cat01', orderId: 'o001', title: 'Organic cotton fabric lot', amount: 17000, currency: 'EUR', expenseDate: iso(88), notes: '', createdAt: iso(88), updatedAt: iso(88) },
  { id: 'e002', userId: uid, categoryId: 'cat02', orderId: 'o001', title: 'Cutting & stitching labour', amount: 6600, currency: 'EUR', expenseDate: iso(75), notes: '', createdAt: iso(75), updatedAt: iso(75) },
  { id: 'e003', userId: uid, categoryId: 'cat03', orderId: 'o001', title: 'Sea freight Hamburg', amount: 2850, currency: 'EUR', expenseDate: iso(58), notes: '', createdAt: iso(58), updatedAt: iso(58) },
  { id: 'e004', userId: uid, categoryId: 'cat01', orderId: 'o002', title: 'Linen fabric purchase', amount: 19300, currency: 'EUR', expenseDate: iso(68), notes: '', createdAt: iso(68), updatedAt: iso(68) },
  { id: 'e005', userId: uid, categoryId: 'cat06', orderId: 'o002', title: 'Care label printing', amount: 1290, currency: 'EUR', expenseDate: iso(50), notes: '', createdAt: iso(50), updatedAt: iso(50) },
  { id: 'e006', userId: uid, categoryId: 'cat03', orderId: 'o002', title: 'Air freight Paris', amount: 4420, currency: 'EUR', expenseDate: iso(36), notes: '', createdAt: iso(36), updatedAt: iso(36) },
  { id: 'e007', userId: uid, categoryId: 'cat01', orderId: 'o003', title: 'Fleece roll stock', amount: 12000, currency: 'GBP', expenseDate: iso(42), notes: '', createdAt: iso(42), updatedAt: iso(42) },
  { id: 'e008', userId: uid, categoryId: 'cat02', orderId: 'o003', title: 'Production labour week 1', amount: 4420, currency: 'GBP', expenseDate: iso(30), notes: '', createdAt: iso(30), updatedAt: iso(30) },
  { id: 'e009', userId: uid, categoryId: 'cat05', orderId: 'o003', title: 'Polybags & cartons', amount: 780, currency: 'GBP', expenseDate: iso(18), notes: '', createdAt: iso(18), updatedAt: iso(18) },
  { id: 'e010', userId: uid, categoryId: 'cat01', orderId: 'o004', title: 'Denim fabric booking', amount: 26800, currency: 'USD', expenseDate: iso(22), notes: '', createdAt: iso(22), updatedAt: iso(22) },
  { id: 'e011', userId: uid, categoryId: 'cat04', orderId: null, title: 'Export documentation fees', amount: 180000, currency: 'PKR', expenseDate: iso(15), notes: 'General export costs', createdAt: iso(15), updatedAt: iso(15) },
  { id: 'e012', userId: uid, categoryId: 'cat03', orderId: 'o005', title: 'Courier sample shipment', amount: 116000, currency: 'PKR', expenseDate: iso(9), notes: '', createdAt: iso(9), updatedAt: iso(9) },
  { id: 'e013', userId: uid, categoryId: 'cat02', orderId: 'o004', title: 'Sample room labour', amount: 2100, currency: 'USD', expenseDate: iso(7), notes: '', createdAt: iso(7), updatedAt: iso(7) },
  { id: 'e014', userId: uid, categoryId: 'cat05', orderId: null, title: 'Warehouse packing supplies', amount: 890, currency: 'USD', expenseDate: iso(4), notes: '', createdAt: iso(4), updatedAt: iso(4) },
];

function filterByQuery<T extends { [key: string]: unknown }>(items: T[], q: string, fields: (keyof T)[]) {
  const term = q.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(term)),
  );
}

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page: currentPage,
    limit,
    totalPages,
  };
}

function orderPayments(orderId: string) {
  return payments.filter((p) => p.orderId === orderId);
}

function orderExpenses(orderId: string) {
  return expenses.filter((e) => e.orderId === orderId);
}

function orderFinancials(order: OrderRecord) {
  return computeOrderFinancials({
    orderValue: order.orderValue,
    payments: orderPayments(order.id),
    expenses: orderExpenses(order.id),
  });
}

function convertFinancials(
  financials: ReturnType<typeof computeOrderFinancials>,
  from: CurrencyCode,
  preferred: CurrencyCode,
) {
  return {
    orderValue: toPreferred(financials.orderValue, from, preferred),
    totalPaymentsReceived: toPreferred(financials.totalPaymentsReceived, from, preferred),
    outstandingBalance: toPreferred(financials.outstandingBalance, from, preferred),
    totalExpenses: toPreferred(financials.totalExpenses, from, preferred),
    contractProfit: toPreferred(financials.contractProfit, from, preferred),
    cashProfit: toPreferred(financials.cashProfit, from, preferred),
  };
}

export const demoStore = {
  getPreferredCurrency() {
    return preferredCurrency;
  },

  setPreferredCurrency(currency: CurrencyCode) {
    preferredCurrency = currency;
  },

  listCustomers(params: {
    q?: string;
    country?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let rows = [...customers];
    if (params.country) rows = rows.filter((r) => r.country === params.country);
    rows = filterByQuery(rows, params.q ?? '', ['name', 'company', 'email', 'country', 'notes']);
    const sortKey = (params.sort ?? 'name') as keyof CustomerRecord;
    const dir = params.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * dir);
    const page = paginate(rows, params.page ?? 1, params.limit ?? 10);
    return {
      ...page,
      countries: [...new Set(customers.map((c) => c.country))].sort(),
    };
  },

  getCustomer(id: string) {
    return customers.find((c) => c.id === id) ?? null;
  },

  getCustomerHistory(customerId: string) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;
    const preferred = preferredCurrency;
    const customerOrders = orders.filter((o) => o.customerId === customerId);
    const orderIds = new Set(customerOrders.map((o) => o.id));
    const customerPayments = payments.filter((p) => orderIds.has(p.orderId));
    const customerExpenses = expenses.filter((e) => e.orderId && orderIds.has(e.orderId));

    const totals = customerOrders.reduce(
      (acc, order) => {
        const native = orderFinancials(order);
        const converted = convertFinancials(native, order.currency, preferred);
        acc.totalOrderValue += converted.orderValue;
        acc.totalPaymentsReceived += converted.totalPaymentsReceived;
        acc.totalOutstandingBalance += converted.outstandingBalance;
        acc.totalExpenses += converted.totalExpenses;
        acc.totalContractProfit += converted.contractProfit;
        acc.totalCashProfit += converted.cashProfit;
        return acc;
      },
      {
        totalOrderValue: 0,
        totalPaymentsReceived: 0,
        totalOutstandingBalance: 0,
        totalExpenses: 0,
        totalContractProfit: 0,
        totalCashProfit: 0,
      },
    );

    return {
      customer,
      orders: customerOrders.map((order) => ({
        ...order,
        financials: orderFinancials(order),
      })),
      payments: customerPayments.map((payment) => ({
        ...payment,
        orderNumber: orders.find((o) => o.id === payment.orderId)?.orderNumber ?? '',
        currency: orders.find((o) => o.id === payment.orderId)?.currency ?? DEFAULT_CURRENCY,
      })),
      expenses: customerExpenses.map((expense) => ({
        ...expense,
        orderNumber: orders.find((o) => o.id === expense.orderId)?.orderNumber ?? '',
        categoryName: categories.find((c) => c.id === expense.categoryId)?.name ?? '',
      })),
      totals,
      displayCurrency: preferred,
    };
  },

  listOrders(params: {
    q?: string;
    status?: string;
    customerId?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const preferred = preferredCurrency;
    let rows = [...orders];
    if (params.status) rows = rows.filter((r) => r.status === params.status);
    if (params.customerId) rows = rows.filter((r) => r.customerId === params.customerId);
    rows = filterByQuery(rows, params.q ?? '', ['orderNumber', 'productName', 'description', 'notes']);
    const sortKey = (params.sort ?? 'orderDate') as keyof OrderRecord;
    const dir = params.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * dir);

    const aggregated = orders.reduce(
      (acc, order) => {
        const converted = convertFinancials(orderFinancials(order), order.currency, preferred);
        acc.totalOrderValue += converted.orderValue;
        acc.totalPaymentsReceived += converted.totalPaymentsReceived;
        acc.totalOutstandingBalance += converted.outstandingBalance;
        return acc;
      },
      { totalOrderValue: 0, totalPaymentsReceived: 0, totalOutstandingBalance: 0 },
    );

    return {
      ...paginate(rows, params.page ?? 1, params.limit ?? 10),
      customers: customers.map((c) => ({
        id: c.id,
        label: c.company ? `${c.name} — ${c.company}` : c.name,
      })),
      stats: {
        totalOrders: orders.length,
        totalReceivedAmount: aggregated.totalPaymentsReceived,
        totalOrderValue: aggregated.totalOrderValue,
        totalOutstandingBalance: aggregated.totalOutstandingBalance,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        inProgressOrders: orders.filter((o) => o.status === 'in_progress').length,
        completedOrders: orders.filter((o) => o.status === 'completed').length,
        abandonedOrders: orders.filter((o) => o.status === 'abandoned').length,
      },
      displayCurrency: preferred,
    };
  },

  getOrder(id: string) {
    const order = orders.find((o) => o.id === id) ?? null;
    if (!order) return null;
    const customer = customers.find((c) => c.id === order.customerId) ?? null;
    const orderPaymentRows = orderPayments(id);
    const orderExpenseRows = orderExpenses(id).map((expense) => ({
      ...expense,
      categoryName: categories.find((c) => c.id === expense.categoryId)?.name ?? '',
    }));
    return {
      order,
      customer,
      payments: orderPaymentRows,
      expenses: orderExpenseRows,
      financials: orderFinancials(order),
    };
  },

  listCategories(params: { q?: string }) {
    let rows = [...categories];
    rows = filterByQuery(rows, params.q ?? '', ['name']);
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return { items: rows, total: rows.length };
  },

  listExpenses(params: {
    q?: string;
    categoryId?: string;
    orderId?: string;
    from?: string;
    to?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const preferred = preferredCurrency;
    let rows = [...expenses];
    if (params.categoryId) rows = rows.filter((r) => r.categoryId === params.categoryId);
    if (params.orderId) rows = rows.filter((r) => r.orderId === params.orderId);
    if (params.from) rows = rows.filter((r) => r.expenseDate >= new Date(params.from!).toISOString());
    if (params.to) {
      const end = new Date(params.to);
      end.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => r.expenseDate <= end.toISOString());
    }
    rows = filterByQuery(rows, params.q ?? '', ['title', 'notes']);
    const sortKey = (params.sort ?? 'expenseDate') as keyof ExpenseRecord;
    const dir = params.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * dir);
    return {
      ...paginate(rows, params.page ?? 1, params.limit ?? 10),
      categories,
      orders: orders.map((o) => ({ id: o.id, label: `${o.orderNumber} — ${o.productName}` })),
      totalAmount: expenses.reduce(
        (sum, e) => sum + toPreferred(e.amount, e.currency, preferred),
        0,
      ),
      displayCurrency: preferred,
    };
  },

  listPayments(params: {
    q?: string;
    orderId?: string;
    method?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let rows = [...payments];
    if (params.orderId) rows = rows.filter((r) => r.orderId === params.orderId);
    if (params.method) rows = rows.filter((r) => r.method === params.method);
    rows = filterByQuery(rows, params.q ?? '', ['referenceNumber', 'notes']);
    const sortKey = (params.sort ?? 'paymentDate') as keyof PaymentRecord;
    const dir = params.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * dir);

    return {
      ...paginate(rows, params.page ?? 1, params.limit ?? 20),
      orders: orders.map((o) => ({
        id: o.id,
        label: `${o.orderNumber} — ${o.productName}`,
        currency: o.currency,
      })),
      itemsEnriched: paginate(rows, params.page ?? 1, params.limit ?? 20).items.map((payment) => {
        const order = orders.find((o) => o.id === payment.orderId);
        return {
          ...payment,
          orderNumber: order?.orderNumber ?? '',
          currency: order?.currency ?? DEFAULT_CURRENCY,
          customerName:
            customers.find((c) => c.id === order?.customerId)?.company ||
            customers.find((c) => c.id === order?.customerId)?.name ||
            '',
        };
      }),
    };
  },

  getPayment(id: string) {
    return payments.find((p) => p.id === id) ?? null;
  },

  createPayment(input: Omit<PaymentRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    paymentSeq += 1;
    const now = new Date().toISOString();
    const row: PaymentRecord = {
      id: `p${paymentSeq}`,
      userId: uid,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    payments.unshift(row);
    return row;
  },

  updatePayment(id: string, input: Partial<PaymentRecord>) {
    const index = payments.findIndex((p) => p.id === id);
    if (index < 0) return null;
    payments[index] = {
      ...payments[index],
      ...input,
      id,
      userId: uid,
      updatedAt: new Date().toISOString(),
    };
    return payments[index];
  },

  deletePayment(id: string) {
    const index = payments.findIndex((p) => p.id === id);
    if (index < 0) return false;
    payments.splice(index, 1);
    return true;
  },

  getDashboard(): {
    kpis: DashboardKpis;
    monthly: MonthlyPoint[];
    yearly: {
      year: number;
      revenue: number;
      expenses: number;
      contractProfit: number;
      cashProfit: number;
    };
    byCurrency: Array<{
      currency: CurrencyCode;
      orderValue: number;
      paymentsReceived: number;
      outstandingBalance: number;
      expenses: number;
      contractProfit: number;
      cashProfit: number;
      orderCount: number;
    }>;
    expenseBreakdown: CategoryBreakdown[];
    recentOrders: Array<OrderRecord & { customerName: string; financials: ReturnType<typeof computeOrderFinancials> }>;
    recentCustomers: CustomerRecord[];
    timeline: Array<{ id: string; title: string; subtitle: string; at: string; type: string }>;
    displayCurrency: CurrencyCode;
  } {
    const preferred = preferredCurrency;
    const now = new Date();
    const year = now.getFullYear();

    let totalOrderValue = 0;
    let totalPaymentsReceived = 0;
    let totalOutstandingBalance = 0;
    let totalOrderExpenses = 0;
    let totalContractProfit = 0;
    let totalCashProfit = 0;

    for (const order of orders) {
      const converted = convertFinancials(orderFinancials(order), order.currency, preferred);
      totalOrderValue += converted.orderValue;
      totalPaymentsReceived += converted.totalPaymentsReceived;
      totalOutstandingBalance += converted.outstandingBalance;
      totalOrderExpenses += converted.totalExpenses;
      totalContractProfit += converted.contractProfit;
      totalCashProfit += converted.cashProfit;
    }

    const overheadExpenses = expenses
      .filter((e) => !e.orderId)
      .reduce((sum, e) => sum + toPreferred(e.amount, e.currency, preferred), 0);
    const totalExpenses = totalOrderExpenses + overheadExpenses;
    const adjustedContractProfit = totalContractProfit - overheadExpenses;
    const adjustedCashProfit = totalCashProfit - overheadExpenses;

    const monthMap = new Map<string, MonthlyPoint>();
    for (let i = 5; i >= 0; i -= 1) {
      const key = monthKey(i * 30);
      monthMap.set(key, {
        month: key,
        revenue: 0,
        expenses: 0,
        contractProfit: 0,
        cashProfit: 0,
        profit: 0,
      });
    }

    for (const payment of payments) {
      const order = orders.find((o) => o.id === payment.orderId);
      if (!order) continue;
      const key = payment.paymentDate.slice(0, 7);
      const point = monthMap.get(key);
      if (point) point.revenue += toPreferred(payment.amount, order.currency, preferred);
    }
    for (const expense of expenses) {
      const key = expense.expenseDate.slice(0, 7);
      const point = monthMap.get(key);
      if (point) point.expenses += toPreferred(expense.amount, expense.currency, preferred);
    }
    for (const order of orders) {
      const key = order.orderDate.slice(0, 7);
      const point = monthMap.get(key);
      if (!point) continue;
      const converted = convertFinancials(orderFinancials(order), order.currency, preferred);
      // Spread contract/cash into months by order date for trend visibility
      point.contractProfit += converted.contractProfit;
      point.cashProfit += converted.cashProfit;
    }
    const monthly = [...monthMap.values()].map((point) => ({
      ...point,
      profit: point.cashProfit,
    }));

    const yearlyPayments = payments
      .filter((p) => new Date(p.paymentDate).getFullYear() === year)
      .reduce((sum, p) => {
        const order = orders.find((o) => o.id === p.orderId);
        if (!order) return sum;
        return sum + toPreferred(p.amount, order.currency, preferred);
      }, 0);
    const yearlyExpenses = expenses
      .filter((e) => new Date(e.expenseDate).getFullYear() === year)
      .reduce((sum, e) => sum + toPreferred(e.amount, e.currency, preferred), 0);
    const yearlyOrderValue = orders
      .filter((o) => new Date(o.orderDate).getFullYear() === year)
      .reduce((sum, o) => sum + toPreferred(o.orderValue, o.currency, preferred), 0);

    const expenseBreakdown = categories
      .map((category) => ({
        name: category.name,
        amount: expenses
          .filter((e) => e.categoryId === category.id)
          .reduce((sum, e) => sum + toPreferred(e.amount, e.currency, preferred), 0),
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const customerMap = new Map(customers.map((c) => [c.id, c.company || c.name]));
    const recentOrders = [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((order) => ({
        ...order,
        customerName: customerMap.get(order.customerId) ?? 'Unknown',
        financials: orderFinancials(order),
      }));

    const recentCustomers = [...customers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    const timeline = [
      ...orders.map((o) => ({
        id: `ord-${o.id}`,
        title: `Order ${o.orderNumber}`,
        subtitle: `${o.productName} · ${o.status.replace('_', ' ')}`,
        at: o.createdAt,
        type: 'order',
      })),
      ...payments.slice(0, 6).map((p) => ({
        id: `pay-${p.id}`,
        title: `Payment ${p.amount.toLocaleString()}`,
        subtitle: `Payment · ${p.method.replace('_', ' ')}`,
        at: p.createdAt,
        type: 'payment',
      })),
      ...expenses.slice(0, 6).map((e) => ({
        id: `exp-${e.id}`,
        title: e.title,
        subtitle: `Expense · ${e.currency} ${e.amount.toLocaleString()}`,
        at: e.createdAt,
        type: 'expense',
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10);

    return {
      kpis: {
        totalCustomers: customers.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        inProgressOrders: orders.filter((o) => o.status === 'in_progress').length,
        completedOrders: orders.filter((o) => o.status === 'completed').length,
        abandonedOrders: orders.filter((o) => o.status === 'abandoned').length,
        totalOrderValue,
        totalPaymentsReceived,
        totalOutstandingBalance,
        totalExpenses,
        totalContractProfit: adjustedContractProfit,
        totalCashProfit: adjustedCashProfit,
        totalRevenue: totalPaymentsReceived,
        totalProfit: adjustedCashProfit,
      },
      monthly,
      yearly: {
        year,
        revenue: yearlyPayments,
        expenses: yearlyExpenses,
        contractProfit: yearlyOrderValue - yearlyExpenses,
        cashProfit: yearlyPayments - yearlyExpenses,
      },
      byCurrency: (() => {
        const map = new Map<
          CurrencyCode,
          {
            currency: CurrencyCode;
            orderValue: number;
            paymentsReceived: number;
            outstandingBalance: number;
            expenses: number;
            contractProfit: number;
            cashProfit: number;
            orderCount: number;
          }
        >();
        for (const order of orders) {
          const financials = orderFinancials(order);
          const row = map.get(order.currency) ?? {
            currency: order.currency,
            orderValue: 0,
            paymentsReceived: 0,
            outstandingBalance: 0,
            expenses: 0,
            contractProfit: 0,
            cashProfit: 0,
            orderCount: 0,
          };
          row.orderValue += financials.orderValue;
          row.paymentsReceived += financials.totalPaymentsReceived;
          row.outstandingBalance += financials.outstandingBalance;
          row.expenses += financials.totalExpenses;
          row.contractProfit += financials.contractProfit;
          row.cashProfit += financials.cashProfit;
          row.orderCount += 1;
          map.set(order.currency, row);
        }
        for (const expense of expenses) {
          if (expense.orderId) continue;
          const row = map.get(expense.currency) ?? {
            currency: expense.currency,
            orderValue: 0,
            paymentsReceived: 0,
            outstandingBalance: 0,
            expenses: 0,
            contractProfit: 0,
            cashProfit: 0,
            orderCount: 0,
          };
          row.expenses += expense.amount;
          row.contractProfit -= expense.amount;
          row.cashProfit -= expense.amount;
          map.set(expense.currency, row);
        }
        return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
      })(),
      expenseBreakdown,
      recentOrders,
      recentCustomers,
      timeline,
      displayCurrency: preferred,
    };
  },

  getReportData() {
    const dashboard = this.getDashboard();
    return {
      generatedAt: new Date().toISOString(),
      kpis: dashboard.kpis,
      yearly: dashboard.yearly,
      displayCurrency: dashboard.displayCurrency,
      customers,
      orders: orders.map((o) => ({
        ...o,
        customerName:
          customers.find((c) => c.id === o.customerId)?.company ||
          customers.find((c) => c.id === o.customerId)?.name ||
          '',
        financials: orderFinancials(o),
      })),
      payments: payments.map((p) => ({
        ...p,
        orderNumber: orders.find((o) => o.id === p.orderId)?.orderNumber ?? '',
        currency: orders.find((o) => o.id === p.orderId)?.currency ?? DEFAULT_CURRENCY,
        customerName:
          customers.find((c) => c.id === orders.find((o) => o.id === p.orderId)?.customerId)?.company ||
          customers.find((c) => c.id === orders.find((o) => o.id === p.orderId)?.customerId)?.name ||
          '',
      })),
      expenses: expenses.map((e) => ({
        ...e,
        categoryName: categories.find((c) => c.id === e.categoryId)?.name ?? '',
        orderNumber: orders.find((o) => o.id === e.orderId)?.orderNumber ?? '',
      })),
      monthly: dashboard.monthly,
    };
  },
};
