import { Types } from 'mongoose';

import {
  convertCurrency,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { getPreferredCurrency } from '@/lib/currency/preferred';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { computeOrderFinancials, resolveOrderValue } from '@/lib/finance/order-financials';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import type {
  CategoryBreakdown,
  DashboardKpis,
  MonthlyPoint,
} from '@/types/domain';

export function shouldUseDemoData(userId: string) {
  return isDemoUserId(userId);
}

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en', { month: 'short', year: '2-digit' });
}

function resolveCurrency(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

function toPreferred(amount: number, currency: unknown, preferred: CurrencyCode) {
  return convertCurrency(Number(amount ?? 0), resolveCurrency(currency), preferred);
}

export async function getDashboardAnalytics(userId: string) {
  if (shouldUseDemoData(userId)) {
    const data = demoStore.getDashboard();
    return {
      ...data,
      monthly: data.monthly.map((point) => ({
        ...point,
        month: monthLabel(point.month),
      })),
      source: 'demo' as const,
    };
  }

  const db = await tryConnectMongoose();
  if (!db) {
    throw new Error('Database unavailable');
  }

  const userObjectId = new Types.ObjectId(userId);
  const preferred = await getPreferredCurrency(userId);
  const year = new Date().getFullYear();

  const [totalCustomers, orders, expenses, payments, recentOrderDocs, recentCustomerDocs] =
    await Promise.all([
      CustomerModel.countDocuments({ userId: userObjectId }),
      OrderModel.find({ userId: userObjectId }).lean(),
      ExpenseModel.find({ userId: userObjectId }).lean(),
      PaymentModel.find({ userId: userObjectId }).lean(),
      OrderModel.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(5).lean(),
      CustomerModel.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const paymentsByOrder = new Map<string, Array<{ amount: number }>>();
  for (const payment of payments) {
    const key = String(payment.orderId);
    const list = paymentsByOrder.get(key) ?? [];
    list.push({ amount: Number(payment.amount) });
    paymentsByOrder.set(key, list);
  }

  const expensesByOrder = new Map<string, Array<{ amount: number }>>();
  let overheadExpensesPreferred = 0;
  for (const expense of expenses) {
    if (!expense.orderId) {
      overheadExpensesPreferred += toPreferred(expense.amount as number, expense.currency, preferred);
      continue;
    }
    const key = String(expense.orderId);
    const list = expensesByOrder.get(key) ?? [];
    list.push({ amount: Number(expense.amount) });
    expensesByOrder.set(key, list);
  }

  let totalOrderValue = 0;
  let totalPaymentsReceived = 0;
  let totalOutstandingBalance = 0;
  let totalOrderExpenses = 0;
  let totalContractProfit = 0;
  let totalCashProfit = 0;

  for (const order of orders) {
    const orderId = String(order._id);
    const currency = resolveCurrency(order.currency);
    const financials = computeOrderFinancials({
      orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
      payments: paymentsByOrder.get(orderId) ?? [],
      expenses: expensesByOrder.get(orderId) ?? [],
    });
    totalOrderValue += toPreferred(financials.orderValue, currency, preferred);
    totalPaymentsReceived += toPreferred(financials.totalPaymentsReceived, currency, preferred);
    totalOutstandingBalance += toPreferred(financials.outstandingBalance, currency, preferred);
    totalOrderExpenses += toPreferred(financials.totalExpenses, currency, preferred);
    totalContractProfit += toPreferred(financials.contractProfit, currency, preferred);
    totalCashProfit += toPreferred(financials.cashProfit, currency, preferred);
  }

  const totalExpenses = totalOrderExpenses + overheadExpensesPreferred;
  const adjustedContractProfit = totalContractProfit - overheadExpensesPreferred;
  const adjustedCashProfit = totalCashProfit - overheadExpensesPreferred;

  const kpis: DashboardKpis = {
    totalCustomers,
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
  };

  const monthMap = new Map<string, MonthlyPoint>();
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, {
      month: monthLabel(key),
      revenue: 0,
      expenses: 0,
      contractProfit: 0,
      cashProfit: 0,
      profit: 0,
    });
  }

  const orderCurrencyMap = new Map(
    orders.map((o) => [String(o._id), resolveCurrency(o.currency)]),
  );

  for (const payment of payments) {
    const date = new Date(payment.paymentDate as Date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const point = monthMap.get(key);
    if (!point) continue;
    const currency = orderCurrencyMap.get(String(payment.orderId)) ?? DEFAULT_CURRENCY;
    point.revenue += toPreferred(payment.amount as number, currency, preferred);
  }

  for (const expense of expenses) {
    const date = new Date(expense.expenseDate as Date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const point = monthMap.get(key);
    if (point) point.expenses += toPreferred(expense.amount as number, expense.currency, preferred);
  }

  for (const order of orders) {
    const date = new Date(order.orderDate as Date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const point = monthMap.get(key);
    if (!point) continue;
    const orderId = String(order._id);
    const currency = resolveCurrency(order.currency);
    const financials = computeOrderFinancials({
      orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
      payments: paymentsByOrder.get(orderId) ?? [],
      expenses: expensesByOrder.get(orderId) ?? [],
    });
    point.contractProfit += toPreferred(financials.contractProfit, currency, preferred);
    point.cashProfit += toPreferred(financials.cashProfit, currency, preferred);
  }

  const monthly = [...monthMap.values()].map((point) => ({
    ...point,
    profit: point.cashProfit,
  }));

  const yearlyPayments = payments
    .filter((p) => new Date(p.paymentDate as Date).getFullYear() === year)
    .reduce((sum, p) => {
      const currency = orderCurrencyMap.get(String(p.orderId)) ?? DEFAULT_CURRENCY;
      return sum + toPreferred(p.amount as number, currency, preferred);
    }, 0);
  const yearlyExpenses = expenses
    .filter((e) => new Date(e.expenseDate as Date).getFullYear() === year)
    .reduce((sum, e) => sum + toPreferred(e.amount as number, e.currency, preferred), 0);
  const yearlyOrderValue = orders
    .filter((o) => new Date(o.orderDate as Date).getFullYear() === year)
    .reduce(
      (sum, o) =>
        sum +
        toPreferred(
          resolveOrderValue(o as { orderValue?: number; receivedAmount?: number }),
          o.currency,
          preferred,
        ),
      0,
    );

  const categoryIds = [...new Set(expenses.map((e) => e.categoryId?.toString()).filter(Boolean))];
  const categories = await ExpenseCategoryModel.find({
    userId: userObjectId,
    _id: { $in: categoryIds },
  }).lean();
  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));

  const expenseBreakdown: CategoryBreakdown[] = [...categoryMap.entries()]
    .map(([id, name]) => ({
      name,
      amount: expenses
        .filter((e) => String(e.categoryId) === id)
        .reduce((sum, e) => sum + toPreferred(e.amount as number, e.currency, preferred), 0),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const customerIds = recentOrderDocs.map((o) => o.customerId);
  const orderCustomers = await CustomerModel.find({
    userId: userObjectId,
    _id: { $in: customerIds },
  }).lean();
  const orderCustomerMap = new Map(
    orderCustomers.map((c) => [String(c._id), ((c.company as string) || (c.name as string))]),
  );

  return {
    kpis,
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
        const orderId = String(order._id);
        const currency = resolveCurrency(order.currency);
        const financials = computeOrderFinancials({
          orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
          payments: paymentsByOrder.get(orderId) ?? [],
          expenses: expensesByOrder.get(orderId) ?? [],
        });
        const row = map.get(currency) ?? {
          currency,
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
        map.set(currency, row);
      }

      for (const expense of expenses) {
        if (expense.orderId) continue;
        const currency = resolveCurrency(expense.currency);
        const row = map.get(currency) ?? {
          currency,
          orderValue: 0,
          paymentsReceived: 0,
          outstandingBalance: 0,
          expenses: 0,
          contractProfit: 0,
          cashProfit: 0,
          orderCount: 0,
        };
        row.expenses += Number(expense.amount ?? 0);
        row.contractProfit -= Number(expense.amount ?? 0);
        row.cashProfit -= Number(expense.amount ?? 0);
        map.set(currency, row);
      }

      return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
    })(),
    expenseBreakdown,
    displayCurrency: preferred,
    recentOrders: recentOrderDocs.map((order) => {
      const orderId = String(order._id);
      const financials = computeOrderFinancials({
        orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
        payments: paymentsByOrder.get(orderId) ?? [],
        expenses: expensesByOrder.get(orderId) ?? [],
      });
      return {
        id: orderId,
        orderNumber: order.orderNumber as string,
        productName: order.productName as string,
        status: order.status as string,
        orderValue: financials.orderValue,
        currency: resolveCurrency(order.currency),
        financials,
        orderDate: new Date(order.orderDate as Date).toISOString(),
        customerName: orderCustomerMap.get(String(order.customerId)) ?? 'Unknown',
        createdAt: new Date(order.createdAt as Date).toISOString(),
      };
    }),
    recentCustomers: recentCustomerDocs.map((customer) => ({
      id: String(customer._id),
      name: customer.name as string,
      company: (customer.company as string) ?? '',
      country: customer.country as string,
      email: (customer.email as string) ?? '',
      createdAt: new Date(customer.createdAt as Date).toISOString(),
    })),
    timeline: [
      ...recentOrderDocs.map((o) => ({
        id: `ord-${String(o._id)}`,
        title: `Order ${o.orderNumber}`,
        subtitle: `${o.productName} · ${String(o.status).replace('_', ' ')}`,
        at: new Date(o.createdAt as Date).toISOString(),
        type: 'order',
      })),
      ...payments
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime(),
        )
        .slice(0, 5)
        .map((p) => ({
          id: `pay-${String(p._id)}`,
          title: `Payment ${Number(p.amount).toLocaleString()}`,
          subtitle: `Payment · ${String(p.method).replace('_', ' ')}`,
          at: new Date(p.createdAt as Date).toISOString(),
          type: 'payment',
        })),
      ...expenses
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime(),
        )
        .slice(0, 5)
        .map((e) => ({
          id: `exp-${String(e._id)}`,
          title: e.title as string,
          subtitle: `Expense · ${resolveCurrency(e.currency)} ${Number(e.amount).toLocaleString()}`,
          at: new Date(e.createdAt as Date).toISOString(),
          type: 'expense',
        })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10),
    source: 'mongo' as const,
  };
}
