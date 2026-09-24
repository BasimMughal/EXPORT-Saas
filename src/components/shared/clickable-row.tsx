'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { TableRow } from '@/components/ui/table';

type ClickableRowProps = {
  href: string;
  label: string;
  children: ReactNode;
};

/** Table row that opens `href` when clicked anywhere, or with Enter when focused. */
export function ClickableRow({ href, label, children }: ClickableRowProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    // Let real links inside the row handle their own clicks.
    if ((event.target as HTMLElement).closest('a')) return;
    // Don't navigate while the user is selecting text in the row.
    if (window.getSelection()?.toString()) return;

    if (event.metaKey || event.ctrlKey) {
      window.open(href, '_blank', 'noopener');
      return;
    }

    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === 'Enter') {
      router.push(href);
    }
  }

  return (
    <TableRow
      role="link"
      tabIndex={0}
      aria-label={label}
      className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </TableRow>
  );
}
