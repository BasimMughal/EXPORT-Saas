'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <Button
      className={className}
      variant="ghost"
      onClick={() => {
        void signOut({ callbackUrl: '/sign-in' });
      }}
    >
      Sign out
    </Button>
  );
}
