/**
 * Supported trading currencies for ExportFlow.
 * FX rates are approximate units of each currency per 1 USD — used only for
 * dashboard / report rollups into the user's preferred base currency.
 * Within a single order, amounts are never converted.
 */
export const CURRENCY_CODES = [
  'PKR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'CNY',
  'TRY',
  'INR',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** Default for new orders and preferred base currency. */
export const DEFAULT_CURRENCY: CurrencyCode = 'PKR';

export type CurrencyMeta = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
  /** Approximate units of this currency per 1 USD. */
  unitsPerUsd: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  PKR: {
    code: 'PKR',
    label: 'Pakistani Rupee',
    symbol: 'Rs',
    locale: 'en-PK',
    unitsPerUsd: 278,
  },
  USD: {
    code: 'USD',
    label: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    unitsPerUsd: 1,
  },
  EUR: {
    code: 'EUR',
    label: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    unitsPerUsd: 0.92,
  },
  GBP: {
    code: 'GBP',
    label: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    unitsPerUsd: 0.79,
  },
  AED: {
    code: 'AED',
    label: 'UAE Dirham',
    symbol: 'د.إ',
    locale: 'ar-AE',
    unitsPerUsd: 3.67,
  },
  SAR: {
    code: 'SAR',
    label: 'Saudi Riyal',
    symbol: '﷼',
    locale: 'ar-SA',
    unitsPerUsd: 3.75,
  },
  CNY: {
    code: 'CNY',
    label: 'Chinese Yuan',
    symbol: '¥',
    locale: 'zh-CN',
    unitsPerUsd: 7.25,
  },
  TRY: {
    code: 'TRY',
    label: 'Turkish Lira',
    symbol: '₺',
    locale: 'tr-TR',
    unitsPerUsd: 34.5,
  },
  INR: {
    code: 'INR',
    label: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    unitsPerUsd: 84,
  },
};

export const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${CURRENCIES[code].label} (${code})`,
  shortLabel: `${CURRENCIES[code].symbol} ${code}`,
}));

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && CURRENCY_CODES.includes(value as CurrencyCode);
}

export function toUsd(amount: number, currency: CurrencyCode) {
  const meta = CURRENCIES[currency] ?? CURRENCIES.PKR;
  return amount / meta.unitsPerUsd;
}

export function fromUsd(amountUsd: number, currency: CurrencyCode) {
  const meta = CURRENCIES[currency] ?? CURRENCIES.PKR;
  return amountUsd * meta.unitsPerUsd;
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode) {
  if (from === to) return amount;
  return fromUsd(toUsd(amount, from), to);
}
