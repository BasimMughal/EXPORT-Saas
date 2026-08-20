import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { isCurrencyCode } from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { profileSchema } from '@/lib/validations/profile';
import { UserModel } from '@/models/user.model';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (isDemoUserId(session.user.id)) {
    if (isCurrencyCode(parsed.data.preferredCurrency)) {
      demoStore.setPreferredCurrency(parsed.data.preferredCurrency);
    }

    const db = await tryConnectMongoose();
    if (!db) {
      return NextResponse.json({
        message: 'Preferred currency updated for this demo session.',
        preferredCurrency: parsed.data.preferredCurrency,
      });
    }
  }

  const db = await tryConnectMongoose();
  if (!db) {
    return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await UserModel.findOne({
    email,
    _id: { $ne: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ message: 'Email is already in use.' }, { status: 409 });
  }

  await UserModel.updateOne(
    { _id: session.user.id },
    {
      $set: {
        name: parsed.data.name,
        email,
        preferredCurrency: parsed.data.preferredCurrency,
      },
    },
  );

  return NextResponse.json({
    message: 'Profile updated.',
    preferredCurrency: parsed.data.preferredCurrency,
  });
}
