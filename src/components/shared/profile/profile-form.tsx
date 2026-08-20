'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CurrencySelect } from '@/components/shared/currency-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CurrencyCode } from '@/config/currency';

type ProfileFormProps = {
  name: string;
  email: string;
  preferredCurrency?: CurrencyCode | string;
  readOnly?: boolean;
};

export function ProfileForm({
  name,
  email,
  preferredCurrency = 'PKR',
  readOnly,
}: ProfileFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      preferredCurrency: formData.get('preferredCurrency') || 'PKR',
    };

    if (readOnly) {
      // Demo mode without Mongo can still update display currency in-memory.
      setPending(true);
      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(body.message ?? 'Unable to update preferred currency.');
          return;
        }
        toast.success(body.message ?? 'Preferred currency updated.');
        router.refresh();
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.message ?? 'Unable to update profile.');
        return;
      }
      toast.success('Profile updated.');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card space-y-4 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Profile details</h2>
        <p className="text-sm text-muted-foreground">
          Keep your account information and reporting currency up to date.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          required
          disabled={readOnly}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          disabled={readOnly}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredCurrency">Preferred currency</Label>
        <CurrencySelect
          id="preferredCurrency"
          name="preferredCurrency"
          defaultValue={(preferredCurrency as CurrencyCode) ?? 'PKR'}
        />
        <p className="text-xs text-muted-foreground">
          Dashboard and report totals convert into this base currency. Individual orders never
          convert — they stay in their own currency.
        </p>
      </div>
      <Button type="submit" className="rounded-xl" disabled={pending}>
        {pending ? 'Saving...' : readOnly ? 'Save currency' : 'Save changes'}
      </Button>
    </form>
  );
}
