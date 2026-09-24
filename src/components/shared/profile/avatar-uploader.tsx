'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const OUTPUT_SIZE = 256;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Centre-crops the picture to a square and re-encodes it as a small JPEG in the browser. */
async function toSquareJpeg(file: File): Promise<Blob> {
  // createImageBitmap applies the photo's EXIF orientation, so phone pictures stay upright.
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');

  // White behind transparent PNGs instead of JPEG's default black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      'image/jpeg',
      0.88,
    ),
  );
}

/**
 * Photo + identity block for the profile page: click the avatar (or the button) to upload,
 * Remove to go back to initials. Renders without card chrome; the page supplies the card.
 */
export function AvatarUploader({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error('That image is larger than 10 MB. Choose a smaller one.');
      return;
    }

    setBusy('upload');
    try {
      let resized: Blob;
      try {
        resized = await toSquareJpeg(file);
      } catch {
        toast.error("Couldn't read this image. Use a JPG, PNG or WebP file.");
        return;
      }

      const body = new FormData();
      body.append('avatar', resized, 'avatar.jpg');
      const response = await fetch('/api/profile/avatar', { method: 'POST', body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.message ?? 'Unable to upload the photo.');
        return;
      }
      toast.success(result.message ?? 'Profile photo updated.');
      router.refresh();
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setBusy('remove');
    try {
      const response = await fetch('/api/profile/avatar', { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.message ?? 'Unable to remove the photo.');
        return;
      }
      toast.success(result.message ?? 'Profile photo removed.');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy !== null}
          aria-label={avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <UserAvatar
            name={name}
            avatarUrl={avatarUrl}
            size={72}
            className="rounded-full ring-4 ring-primary/10"
            fallbackClassName="bg-gradient-to-br from-blue-500 to-indigo-600 text-xl text-white"
          />
          {/* Hover hint, or a spinner while uploading. */}
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 text-white transition-opacity',
              busy === 'upload' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            {busy === 'upload' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </span>
          <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>

        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg"
              disabled={busy !== null}
              onClick={openPicker}
            >
              {avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                disabled={busy !== null}
                onClick={handleRemove}
              >
                {busy === 'remove' ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
