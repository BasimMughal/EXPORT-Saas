'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpSchema, type SignUpValues } from '@/lib/validations/user';

export function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const payload: {
      message?: string;
      errors?: Record<string, string[] | undefined>;
    } = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (payload.errors) {
        Object.entries(payload.errors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof SignUpValues, {
              message: messages[0],
            });
          }
        });
      }

      setFormError(payload.message ?? 'Unable to create account right now.');
      return;
    }

    const signInResult = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (signInResult?.error) {
      router.push('/sign-in?registered=1');
      return;
    }

    router.push(signInResult?.url ?? '/dashboard');
    router.refresh();
  });

  return (
    <div className="glass-panel w-full max-w-md rounded-3xl p-7 text-foreground md:p-8">
      <div className="mb-7 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Get started</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Create account</h2>
        <p className="text-sm text-muted-foreground">Set up secure access to your export workspace.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Basim Mughal"
            className="h-11 rounded-xl bg-white"
            {...form.register('name')}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
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
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="h-11 rounded-xl bg-white"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            className="h-11 rounded-xl bg-white"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <Button
          className="h-11 w-full rounded-xl shadow-md shadow-primary/20"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
