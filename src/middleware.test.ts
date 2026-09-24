import { encode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';

import { middleware } from '@/middleware';

const originalSecret = process.env.AUTH_SECRET;

afterEach(() => {
  process.env.AUTH_SECRET = originalSecret;
});

async function createSessionRequest(cookieName: string) {
  const secret = 'middleware-test-secret-that-is-long-enough';
  process.env.AUTH_SECRET = secret;

  const token = await encode({
    salt: cookieName,
    secret,
    token: {
      sub: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    },
  });

  return new NextRequest('https://example.com/dashboard', {
    headers: {
      cookie: `${cookieName}=${token}`,
    },
  });
}

describe('auth middleware', () => {
  it('accepts the secure session cookie issued in production', async () => {
    const response = await middleware(await createSessionRequest('__Secure-authjs.session-token'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('continues to accept the unprefixed local-development cookie', async () => {
    const response = await middleware(await createSessionRequest('authjs.session-token'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated dashboard requests to sign in', async () => {
    process.env.AUTH_SECRET = 'middleware-test-secret-that-is-long-enough';

    const response = await middleware(new NextRequest('https://example.com/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://example.com/sign-in?callbackUrl=%2Fdashboard',
    );
  });
});
