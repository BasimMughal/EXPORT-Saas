import Link from 'next/link';

import { Button } from '@/components/ui/button';

type CustomerPaginationProps = {
  page: number;
  totalPages: number;
  queryString: string;
};

export function CustomerPagination({ page, totalPages, queryString }: CustomerPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams(queryString);
    params.set('page', String(nextPage));
    return `/customers?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            href={buildHref(Math.max(1, page - 1))}
            tabIndex={page <= 1 ? -1 : 0}
          >
            Previous
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
            href={buildHref(Math.min(totalPages, page + 1))}
            tabIndex={page >= totalPages ? -1 : 0}
          >
            Next
          </Link>
        </Button>
      </div>
    </div>
  );
}
