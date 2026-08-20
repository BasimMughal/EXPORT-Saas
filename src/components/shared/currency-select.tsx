'use client';

import { CURRENCY_OPTIONS, type CurrencyCode } from '@/config/currency';
import { cn } from '@/lib/utils';

type CurrencySelectProps = {
  name?: string;
  id?: string;
  defaultValue?: CurrencyCode | string;
  value?: CurrencyCode | string;
  onChange?: (value: CurrencyCode) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CurrencySelect({
  name = 'currency',
  id,
  defaultValue = 'PKR',
  value,
  onChange,
  className,
  required,
  disabled,
}: CurrencySelectProps) {
  return (
    <select
      id={id ?? name}
      name={name}
      required={required}
      disabled={disabled}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={
        onChange
          ? (event) => onChange(event.target.value as CurrencyCode)
          : undefined
      }
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm',
        disabled ? 'opacity-70' : '',
        className,
      )}
    >
      {CURRENCY_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
