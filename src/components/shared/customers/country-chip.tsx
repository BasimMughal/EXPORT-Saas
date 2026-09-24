import { cn } from '@/lib/utils';

/**
 * Soft chip colours for countries. Purple (customers) and brand blue (order IDs) are left out
 * so a country chip never looks like one of those.
 */
const COUNTRY_CHIP_COLORS = [
  // Ordered so neighbouring entries (the first countries you add) contrast strongly.
  'border-teal-200 bg-teal-50 text-teal-700',
  'border-orange-200 bg-orange-50 text-orange-700',
  'border-indigo-200 bg-indigo-50 text-indigo-700',
  'border-pink-200 bg-pink-50 text-pink-700',
  'border-lime-200 bg-lime-50 text-lime-700',
  'border-sky-200 bg-sky-50 text-sky-700',
  'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-emerald-200 bg-emerald-50 text-emerald-700',
  'border-cyan-200 bg-cyan-50 text-cyan-700',
] as const;

/** Normalised form used to match countries regardless of case or stray spaces. */
export function countryKey(country: string) {
  return country.trim().toLowerCase();
}

/** Fallback when no palette position is given: a stable colour derived from the name. */
function hashedColor(country: string) {
  const key = countryKey(country);
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return COUNTRY_CHIP_COLORS[hash % COUNTRY_CHIP_COLORS.length];
}

/**
 * `colorIndex` is the country's position in the account's countries (in the order they were
 * first used), so the first ten countries always get distinct colours and adding a new country
 * never recolours existing ones.
 */
export function CountryChip({
  country,
  colorIndex,
  className,
}: {
  country: string;
  colorIndex?: number;
  className?: string;
}) {
  if (!country.trim()) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorIndex === undefined
          ? hashedColor(country)
          : COUNTRY_CHIP_COLORS[colorIndex % COUNTRY_CHIP_COLORS.length],
        className,
      )}
    >
      {country}
    </span>
  );
}
