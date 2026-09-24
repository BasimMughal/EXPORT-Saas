import { cn } from '@/lib/utils';

/**
 * The one look for an order ID chip across the app: brand blue, monospaced.
 * (Purple is reserved for customers; amber/green/red belong to statuses.)
 */
export function OrderNumberChip({
  orderNumber,
  className,
}: {
  orderNumber: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-xs font-medium text-primary',
        className,
      )}
    >
      {orderNumber}
    </span>
  );
}
