import { describe, expect, it } from 'vitest';

import { avatarUrlFor, detectImageType } from '@/lib/profile/avatar';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by their signatures', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(
      'image/png',
    );
    const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
    expect(detectImageType(webp)).toBe('image/webp');
  });

  it('rejects anything else, including SVG and renamed files', () => {
    expect(
      detectImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')),
    ).toBeNull();
    expect(detectImageType(new TextEncoder().encode('<html><script>'))).toBeNull();
    expect(detectImageType(new TextEncoder().encode('RIFF\0\0\0\0WAVE'))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe('avatarUrlFor', () => {
  it('versions the URL by upload time and returns null without a photo', () => {
    expect(avatarUrlFor(new Date('2026-09-25T10:00:00.000Z'))).toBe(
      `/api/profile/avatar?v=${Date.parse('2026-09-25T10:00:00.000Z')}`,
    );
    expect(avatarUrlFor(null)).toBeNull();
    expect(avatarUrlFor('not a date')).toBeNull();
  });
});
