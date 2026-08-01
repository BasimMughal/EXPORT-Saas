/**
 * Domain types shared across Mongo and demo data adapters.
 */

import type { CurrencyCode } from '@/config/currency';
import type { OrderFinancials } from '@/lib/finance/order-financials';

export type CustomerRecord = {
  id: string;
  userId: string;
  name: string;
  company: string;
  country: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'abandoned';

export type OrderRecord = {
  id: string;
  userId: string;
  customerId: string;
  orderNumber: string;
  productName: string;
  description: string;
  quantity: number;
  orderValue: number;
  currency: CurrencyCode;
  orderDate: string;
  deliveryDate: string | null;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod =
  | 'bank_transfer'
  | 'wise'
  | 'western_union'
  | 'cash'
  | 'other';

export type PaymentRecord = {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategoryRecord = {
  id: string;
  userId: string;
  name: string;
  nameNormalized: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseRecord = {
  id: string;
  userId: string;
  categoryId: string;
  orderId: string | null;
  title: string;
  amount: number;
  currency: CurrencyCode;
  expenseDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardKpis = {
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  abandonedOrders: number;
  totalOrderValue: number;
  totalPaymentsReceived: number;
  totalOutstandingBalance: number;
  totalExpenses: number;
  totalContractProfit: number;
  totalCashProfit: number;
  /** @deprecated Prefer totalPaymentsReceived / totalContractProfit */
  totalRevenue: number;
  totalProfit: number;
};

export type MonthlyPoint = {
  month: string;
  revenue: number;
  expenses: number;
  contractProfit: number;
  cashProfit: number;
  /** @deprecated Prefer contractProfit */
  profit: number;
};

export type CategoryBreakdown = {
  name: string;
  amount: number;
};

export type OrderWithFinancials = OrderRecord & {
  customerName?: string;
  financials: OrderFinancials;
};
