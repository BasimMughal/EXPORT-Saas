import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { detectImageType, MAX_AVATAR_BYTES } from '@/lib/profile/avatar';
import { UserModel } from '@/models/user.model';

export const runtime = 'nodejs';

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** The signed-in user's own photo. Private and cacheable: the URL is versioned (?v=). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!(await tryConnectMongoose())) {
    return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 });
  }

  const user = (await UserModel.findById(userId).select('+avatar').lean()) as {
    avatar?: { data: unknown; contentType: string } | null;
  } | null;
  const avatar = user?.avatar;
  if (!avatar) {
    return new NextResponse(null, { status: 404 });
  }

  // Lean reads return either a Node Buffer or a BSON Binary (whose bytes are in .buffer).
  const body =
    avatar.data instanceof Uint8Array
      ? avatar.data
      : (avatar.data as { buffer: Uint8Array }).buffer;

  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': avatar.contentType,
      'Cache-Control': 'private, max-age=31536000, immutable',
      // Never let the browser treat the upload as anything but the declared image.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}

/** Upload or replace the photo (multipart field "avatar"). */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Choose an image to upload.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ message: 'The image is too large.' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) {
    return NextResponse.json({ message: 'Use a JPG, PNG or WebP image.' }, { status: 415 });
  }

  if (!(await tryConnectMongoose())) {
    return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 });
  }

  const avatarUpdatedAt = new Date();
  await UserModel.updateOne(
    { _id: userId },
    { $set: { avatar: { data: Buffer.from(bytes), contentType }, avatarUpdatedAt } },
  );

  return NextResponse.json({ message: 'Profile photo updated.' });
}

/** Remove the photo; the initials avatar is shown again. */
export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!(await tryConnectMongoose())) {
    return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 });
  }

  await UserModel.updateOne({ _id: userId }, { $set: { avatar: null, avatarUpdatedAt: null } });
  return NextResponse.json({ message: 'Profile photo removed.' });
}
