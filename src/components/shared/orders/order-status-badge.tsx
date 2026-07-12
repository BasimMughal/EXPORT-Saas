import { Badge } from '@/components/ui/badge';

type OrderStatusBadgeProps = {
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
} as const;

const STATUS_CLASSNAMES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  in_progress:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  completed:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  abandoned:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200',
} as const;

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge className={STATUS_CLASSNAMES[status]}>{STATUS_LABELS[status]}</Badge>;
}
