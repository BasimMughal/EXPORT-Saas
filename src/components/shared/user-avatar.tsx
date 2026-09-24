import Image from 'next/image';

import { cn } from '@/lib/utils';

export function initialsOf(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  );
}

/** The user's profile photo when they've uploaded one, otherwise their initials. */
export function UserAvatar({
  name,
  avatarUrl,
  size,
  className,
  fallbackClassName,
}: {
  name: string;
  avatarUrl: string | null;
  /** Rendered pixel size (square). */
  size: number;
  className?: string;
  /** Styles for the initials version (background, text colour). */
  fallbackClassName?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        // Private, already-resized image served by our own API; skip the optimizer.
        unoptimized
        className={cn('shrink-0 object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-bold',
        fallbackClassName,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initialsOf(name)}
    </span>
  );
}
