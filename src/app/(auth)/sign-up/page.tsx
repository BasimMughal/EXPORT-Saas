import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { SignUpForm } from '@/components/shared/auth/sign-up-form';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Sign Up | ${siteConfig.name}`,
};

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-md">
      <SignUpForm />
    </div>
  );
}
