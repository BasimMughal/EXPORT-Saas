/**
 * Derived order financials — never persist these values.
 */

export type OrderFinancials = {
  orderValue: number;
  totalPaymentsReceived: number;
  outstandingBalance: number;
  totalExpenses: number;
  contractProfit: number;
  cashProfit: number;
};

export function computeOrderFinancials(input: {
  orderValue: number;
  payments: Array<{ amount: number }>;
  expenses: Array<{ amount: number }>;
}): OrderFinancials {
  const orderValue = Number(input.orderValue) || 0;
  const totalPaymentsReceived = input.payments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0,
  );
  const totalExpenses = input.expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0,
  );

  return {
    orderValue,
    totalPaymentsReceived,
    outstandingBalance: orderValue - totalPaymentsReceived,
    totalExpenses,
    contractProfit: orderValue - totalExpenses,
    cashProfit: totalPaymentsReceived - totalExpenses,
  };
}

/** Prefer orderValue; fall back to legacy receivedAmount during migration. */
export function resolveOrderValue(order: {
  orderValue?: number | null;
  receivedAmount?: number | null;
}): number {
  if (order.orderValue != null && !Number.isNaN(Number(order.orderValue))) {
    return Number(order.orderValue);
  }
  return Number(order.receivedAmount ?? 0);
}
