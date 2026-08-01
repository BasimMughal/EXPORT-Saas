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
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  in_progress: 'border-sky-200 bg-sky-50 text-sky-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  abandoned: 'border-rose-200 bg-rose-50 text-rose-800',
} as const;

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge className={STATUS_CLASSNAMES[status]}>{STATUS_LABELS[status]}</Badge>;
}
