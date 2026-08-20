import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { UserModel } from '@/models/user.model';

export async function getPreferredCurrency(userId: string): Promise<CurrencyCode> {
  if (isDemoUserId(userId)) {
    return demoStore.getPreferredCurrency();
  }

  const db = await tryConnectMongoose();
  if (!db) {
    return DEFAULT_CURRENCY;
  }

  const user = (await UserModel.findById(userId).select('preferredCurrency').lean()) as {
    preferredCurrency?: string;
  } | null;
  const value = user?.preferredCurrency;
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}
