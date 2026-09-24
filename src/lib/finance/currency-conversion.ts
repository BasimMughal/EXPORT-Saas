/**
 * Converting a payment or expense entered in another currency into its order's currency,
 * using the exchange rate the user types in.
 *
 * Stored convention: `exchangeRate` = units of the entered (original) currency per 1 unit of
 * the order currency. Order in USD, expense paid in PKR at 1 USD = 278 PKR → 278.
 *
 * The user is always asked for the rate the way it is normally quoted — stronger currency
 * first ("1 USD = 278 PKR") — whichever side the order is on.
 */

import { CURRENCIES, type CurrencyCode } from '@/config/currency';

export type RateQuote = {
  /** The "1 X" side of "1 X = ? Y". */
  base: CurrencyCode;
  /** The "? Y" side. */
  quote: CurrencyCode;
  /** True when the order currency is the base, i.e. the typed rate already matches the stored convention. */
  orderIsBase: boolean;
};

/** Which way round to ask for the rate, so it reads like "1 USD = 278 PKR" rather than "1 PKR = 0.0036 USD". */
export function getRateQuote(orderCurrency: CurrencyCode, enteredCurrency: CurrencyCode): RateQuote {
  // Fewer units per USD means a stronger currency; it goes first. The reference table is only
  // used to pick the direction, never for the rate itself.
  const orderIsBase =
    CURRENCIES[orderCurrency].unitsPerUsd <= CURRENCIES[enteredCurrency].unitsPerUsd;
  return orderIsBase
    ? { base: orderCurrency, quote: enteredCurrency, orderIsBase }
    : { base: enteredCurrency, quote: orderCurrency, orderIsBase };
}

/** Stored rate → the number to show in the "1 X = ? Y" field. */
export function toQuotedRate(
  storedRate: number,
  orderCurrency: CurrencyCode,
  enteredCurrency: CurrencyCode,
) {
  const { orderIsBase } = getRateQuote(orderCurrency, enteredCurrency);
  const quoted = orderIsBase ? storedRate : 1 / storedRate;
  // Undo floating-point noise from the inversion (e.g. 278.00000000000006).
  return Number(quoted.toPrecision(10));
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export type AmountInOrderCurrency = {
  /** Amount in the order currency — what every total and profit figure uses. */
  amount: number;
  /** What was actually paid, when it was in another currency; otherwise null. */
  originalAmount: number | null;
  originalCurrency: CurrencyCode | null;
  /** Stored-convention rate (see top of file); null when no conversion happened. */
  exchangeRate: number | null;
};

/**
 * Converts `amount` entered in `enteredCurrency` into `orderCurrency` using the rate the user
 * typed (`quotedRate`, in the direction given by getRateQuote).
 */
export function convertToOrderCurrency(input: {
  amount: number;
  enteredCurrency: CurrencyCode;
  orderCurrency: CurrencyCode;
  quotedRate?: number | null;
}): { ok: true; value: AmountInOrderCurrency } | { ok: false; error: string } {
  const { amount, enteredCurrency, orderCurrency } = input;

  if (enteredCurrency === orderCurrency) {
    return {
      ok: true,
      value: { amount, originalAmount: null, originalCurrency: null, exchangeRate: null },
    };
  }

  const quotedRate = Number(input.quotedRate);
  const { base, quote, orderIsBase } = getRateQuote(orderCurrency, enteredCurrency);
  if (!Number.isFinite(quotedRate) || quotedRate <= 0) {
    return { ok: false, error: `Enter the exchange rate: 1 ${base} = ? ${quote}.` };
  }

  return {
    ok: true,
    value: {
      amount: roundMoney(orderIsBase ? amount / quotedRate : amount * quotedRate),
      originalAmount: amount,
      originalCurrency: enteredCurrency,
      exchangeRate: orderIsBase ? quotedRate : 1 / quotedRate,
    },
  };
}
