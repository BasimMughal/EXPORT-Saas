import { Types } from 'mongoose';

import { CounterModel } from '@/models/counter.model';

export async function generateOrderNumber(userId: string) {
  const counterId = `order:${userId}`;
  const counter = (await CounterModel.findOneAndUpdate(
    { _id: counterId },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { _id: counterId, sequence: 0 },
    },
    { new: true, upsert: true },
  ).lean()) as unknown as { sequence?: number } | null;

  const sequence = Number(counter?.sequence ?? 0);
  const datePrefix = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ORD-${datePrefix}-${String(sequence).padStart(4, '0')}`;
}

export function toObjectId(value: string) {
  return new Types.ObjectId(value);
}
