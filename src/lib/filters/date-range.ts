import { z } from 'zod';

/** A YYYY-MM-DD date from the URL; anything else is ignored rather than failing the page. */
export const filterDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()))
  .optional()
  .default('')
  .catch('');

/**
 * Mongo filter for an inclusive YYYY-MM-DD range (UTC days). Returns null when neither end is
 * set; swaps the ends if they were entered the wrong way round.
 */
export function buildDateRangeFilter(from: string, to: string) {
  if (!from && !to) return null;

  const [start, end] = from && to && from > to ? [to, from] : [from, to];
  const filter: { $gte?: Date; $lt?: Date } = {};
  if (start) {
    filter.$gte = new Date(`${start}T00:00:00.000Z`);
  }
  if (end) {
    const dayAfterEnd = new Date(`${end}T00:00:00.000Z`);
    dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);
    filter.$lt = dayAfterEnd;
  }
  return filter;
}
