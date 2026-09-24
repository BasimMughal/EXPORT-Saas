/** Upper bound for a stored profile photo. The browser resizes to ~256px first, so real
 * uploads are a few dozen KB; this only guards against oversized or hand-crafted requests. */
export const MAX_AVATAR_BYTES = 512 * 1024;

export type AvatarContentType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Identifies an image by its leading bytes rather than trusting the file name or the
 * browser-supplied type. Only JPEG, PNG and WebP are accepted (never SVG, which can carry script).
 */
export function detectImageType(bytes: Uint8Array): AvatarContentType | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }
  return null;
}

/** URL of the signed-in user's photo, versioned so a new upload is never served from cache. */
export function avatarUrlFor(avatarUpdatedAt: Date | string | null | undefined) {
  if (!avatarUpdatedAt) return null;
  const version = new Date(avatarUpdatedAt).getTime();
  return Number.isNaN(version) ? null : `/api/profile/avatar?v=${version}`;
}
