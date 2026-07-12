import { NextResponse } from 'next/server';

import { hashPassword } from '@/lib/auth/password';
import { connectMongoose } from '@/lib/db/mongoose';
import { getErrorMessage } from '@/lib/errors';
import { signUpSchema } from '@/lib/validations/user';
import { UserModel } from '@/models/user.model';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: 'Invalid request body.',
        },
        { status: 400 },
      );
    }

    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectMongoose();

    const email = parsed.data.email.toLowerCase();
    const existingUser = await UserModel.exists({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          message: 'An account with this email already exists.',
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await UserModel.create({
      name: parsed.data.name,
      email,
      passwordHash,
      role: 'viewer',
      status: 'active',
      organizationId: null,
    });

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const maybeDuplicateKey = error as { code?: number };
    if (maybeDuplicateKey.code === 11000) {
      return NextResponse.json(
        {
          message: 'An account with this email already exists.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: getErrorMessage(error, 'Unable to create account right now.'),
      },
      { status: 500 },
    );
  }
}
