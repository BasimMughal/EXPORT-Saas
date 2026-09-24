import 'server-only';

import { tryConnectMongoose } from '@/lib/db/mongoose';
import { avatarUrlFor } from '@/lib/profile/avatar';
import { UserModel } from '@/models/user.model';

/** URL of the user's profile photo, or null when they haven't uploaded one. */
export async function getAvatarUrl(userId: string) {
  if (!(await tryConnectMongoose())) return null;
  const user = (await UserModel.findById(userId).select('avatarUpdatedAt').lean()) as {
    avatarUpdatedAt?: Date | null;
  } | null;
  return avatarUrlFor(user?.avatarUpdatedAt);
}
