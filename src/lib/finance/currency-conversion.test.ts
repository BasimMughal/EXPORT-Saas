import { describe, expect, it } from 'vitest';

import {
  convertToOrderCurrency,
  getRateQuote,
  toQuotedRate,
} from '@/lib/finance/currency-conversion';

describe('getRateQuote', () => {
  it('puts the stronger currency first regardless of which side the order is on', () => {
    expect(getRateQuote('USD', 'PKR')).toMatchObject({ base: 'USD', quote: 'PKR', orderIsBase: true });
    expect(getRateQuote('PKR', 'USD')).toMatchObject({ base: 'USD', quote: 'PKR', orderIsBase: false });
  });
});

describe('convertToOrderCurrency', () => {
  it('leaves same-currency amounts untouched', () => {
    const result = convertToOrderCurrency({
      amount: 500,
      enteredCurrency: 'USD',
      orderCurrency: 'USD',
    });
    expect(result).toEqual({
      ok: true,
      value: { amount: 500, originalAmount: null, originalCurrency: null, exchangeRate: null },
    });
  });

  it('converts a PKR expense into a USD order at 1 USD = 278 PKR', () => {
    const result = convertToOrderCurrency({
      amount: 50000,
      enteredCurrency: 'PKR',
      orderCurrency: 'USD',
      quotedRate: 278,
    });
    expect(result).toEqual({
      ok: true,
      value: { amount: 179.86, originalAmount: 50000, originalCurrency: 'PKR', exchangeRate: 278 },
    });
  });

  it('converts a USD payment into a PKR order using the same "1 USD = 278 PKR" quote', () => {
    const result = convertToOrderCurrency({
      amount: 100,
      enteredCurrency: 'USD',
      orderCurrency: 'PKR',
      quotedRate: 278,
    });
    expect(result.ok && result.value.amount).toBe(27800);
    expect(result.ok && toQuotedRate(result.value.exchangeRate!, 'PKR', 'USD')).toBe(278);
  });

  it('requires a positive rate when the currencies differ', () => {
    for (const quotedRate of [undefined, null, 0, -5, Number.NaN]) {
      const result = convertToOrderCurrency({
        amount: 100,
        enteredCurrency: 'PKR',
        orderCurrency: 'USD',
        quotedRate,
      });
      expect(result).toEqual({ ok: false, error: 'Enter the exchange rate: 1 USD = ? PKR.' });
    }
  });
});
