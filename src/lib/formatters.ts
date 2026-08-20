import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from '@/config/currency';

export function formatCurrency(
  value: number,
  currency: CurrencyCode | string | null | undefined = DEFAULT_CURRENCY,
) {
  const code = isCurrencyCode(currency) ? currency : DEFAULT_CURRENCY;
  const meta = CURRENCIES[code];

  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'PKR' ? 0 : 2,
  }).format(value);
}

export function formatDateDisplay(value: Date | string | null | undefined) {
  if (value == null || value === '') {
    return '-';
  }

  // Already-rendered placeholder from a previous format pass
  if (typeof value === 'string' && value.trim() === '-') {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

/** Date + time for signup / login audit records. */
export function formatDateTimeDisplay(value: Date | string | null | undefined) {
  if (value == null || value === '') {
    return '-';
  }

  if (typeof value === 'string' && value.trim() === '-') {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateInput(value: Date | string | null | undefined) {
  if (value == null || value === '') {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
