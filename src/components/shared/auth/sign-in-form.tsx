'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInSchema, type SignInValues } from '@/lib/validations/auth';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

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
      callbackUrl,
    }).then((result) => {
      if (!result) {
        setFormError('Unable to sign in right now. Please try again.');
        return;
      }

      if (result.error) {
        setFormError('Invalid email or password.');
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    });
  });

  return (
    <Card className="border-border/70 bg-card/90 shadow-2xl backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Access your export operations workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
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
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-up">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
