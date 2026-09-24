'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInSchema, type SignInValues } from '@/lib/validations/auth';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  // Arrived here straight after creating an account.
  const justRegistered = searchParams.get('registered') === '1';
  const requestedCallback = searchParams.get('callbackUrl');
  const callbackUrl =
    requestedCallback?.startsWith('/') && !requestedCallback.startsWith('//')
      ? requestedCallback
      : '/dashboard';

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    return signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      redirectTo: callbackUrl,
    }).then((result) => {
      if (!result) {
        setFormError('Unable to sign in right now. Please try again.');
        return;
      }

      if (result.error) {
        setFormError('Invalid email or password.');
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    });
  });

  return (
    <div className="glass-panel w-full max-w-md rounded-3xl p-7 text-foreground md:p-8">
      <div className="mb-7 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Welcome back</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Sign in</h2>
        <p className="text-sm text-muted-foreground">Access your export operations workspace.</p>
      </div>

      {justRegistered ? (
        <div
          role="status"
          className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800">Account created</p>
            <p className="text-emerald-700">
              Sign in with the email and password you just set up.
            </p>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoFocus={justRegistered}
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 rounded-xl bg-white"
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-xl bg-white"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <Button className="h-11 w-full rounded-xl shadow-md shadow-primary/20" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in to workspace'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/sign-up">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
