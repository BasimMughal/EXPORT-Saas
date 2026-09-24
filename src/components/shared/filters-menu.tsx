'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const filterSelectClassName =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30';

type FiltersMenuProps = {
  /** Page the filters apply to; changes update its query string, Clear drops it. */
  action: string;
  /** Number of filters currently applied, shown on the button. */
  activeCount: number;
  label: string;
  children: ReactNode;
};

/**
 * "Filters" button that opens a panel of filter fields. Every change applies immediately by
 * updating the page's query string (which also returns to page 1); Clear removes them all.
 */
export function FiltersMenu({ action, activeCount, label, children }: FiltersMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isApplying, startApplying] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  function navigate(href: string) {
    startApplying(() => router.replace(href, { scroll: false }));
  }

  function applyFilters(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string' && value !== '') {
        params.set(key, value);
      }
    }
    const query = params.toString();
    navigate(query ? `${action}?${query}` : action);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Pressing Enter just applies; there is no separate submit step.
    event.preventDefault();
    applyFilters(event.currentTarget);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            'ml-1.5 h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <form
            // Remount the fields whenever the URL's filters change, so uncontrolled selects
            // pick up the new values (e.g. after Clear) instead of keeping stale ones.
            key={searchParams.toString()}
            className="space-y-4"
            onSubmit={handleSubmit}
            onChange={(event) => applyFilters(event.currentTarget)}
          >
            {children}

            <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isApplying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Filters apply as you change them'
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg"
                disabled={activeCount === 0 || isApplying}
                onClick={() => navigate(action)}
              >
                Clear
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

/** Opens the browser's calendar when the date field is clicked anywhere, not just on the icon. */
function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    // Some browsers only allow showPicker in specific contexts; typing still works.
  }
}

/** From/To date inputs (submitted as `from` and `to`), each limited by the other. */
export function DateRangeFields({
  legend,
  from,
  to,
}: {
  legend: string;
  from: string;
  to: string;
}) {
  const uid = useId();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  // Keep the inputs in sync when the URL changes without a remount (e.g. Reset).
  useEffect(() => {
    setFromDate(from);
    setToDate(to);
  }, [from, to]);

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium leading-none">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 pt-1.5">
        <div className="space-y-1">
          <Label htmlFor={`${uid}-from`} className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id={`${uid}-from`}
            name="from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            onClick={openDatePicker}
            className="cursor-pointer rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${uid}-to`} className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id={`${uid}-to`}
            name="to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            onClick={openDatePicker}
            className="cursor-pointer rounded-lg"
          />
        </div>
      </div>
    </fieldset>
  );
}
