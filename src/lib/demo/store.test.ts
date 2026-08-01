import { describe, expect, it } from 'vitest';

import { computeOrderFinancials } from '@/lib/finance/order-financials';
import { demoStore } from '@/lib/demo/store';
import { formatCurrency } from '@/lib/formatters';
import type { CustomerRecord } from '@/types/domain';

describe('demoStore', () => {
  it('returns profitable dashboard KPIs', () => {
    const dashboard = demoStore.getDashboard();
    expect(dashboard.kpis.totalCustomers).toBeGreaterThan(0);
    expect(dashboard.kpis.totalOrders).toBeGreaterThan(0);
    expect(dashboard.kpis.totalPaymentsReceived).toBeGreaterThan(0);
    expect(dashboard.kpis.totalContractProfit).toBeDefined();
    expect(dashboard.kpis.totalCashProfit).toBeDefined();
  });

  it('filters customers by country', () => {
    const result = demoStore.listCustomers({ country: 'Germany', page: 1, limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item: CustomerRecord) => item.country === 'Germany')).toBe(true);
  });

  it('paginates expenses', () => {
    const page1 = demoStore.listExpenses({ page: 1, limit: 5 });
    expect(page1.items).toHaveLength(5);
    expect(page1.totalPages).toBeGreaterThan(1);
  });

  it('lists payments against orders', () => {
    const result = demoStore.listPayments({ page: 1, limit: 20 });
    expect(result.items.length).toBeGreaterThan(0);
  });
});

describe('computeOrderFinancials', () => {
  it('derives outstanding and both profit metrics', () => {
    const financials = computeOrderFinancials({
      orderValue: 10000,
      payments: [{ amount: 2000 }, { amount: 3000 }],
      expenses: [{ amount: 4000 }],
    });
    expect(financials.totalPaymentsReceived).toBe(5000);
    expect(financials.outstandingBalance).toBe(5000);
    expect(financials.totalExpenses).toBe(4000);
    expect(financials.contractProfit).toBe(6000);
    expect(financials.cashProfit).toBe(1000);
  });
});

describe('formatCurrency', () => {
  it('formats USD values', () => {
    expect(formatCurrency(1200)).toContain('1,200');
  });

  it('formats EUR, GBP, and PKR', () => {
    expect(formatCurrency(1200, 'EUR')).toMatch(/1[.,]200/);
    expect(formatCurrency(1200, 'GBP')).toMatch(/1[.,]200/);
    expect(formatCurrency(1200, 'PKR')).toMatch(/1[.,]200/);
  });
});
