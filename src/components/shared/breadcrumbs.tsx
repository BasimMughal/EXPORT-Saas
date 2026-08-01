import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 opacity-60" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-foreground' : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
