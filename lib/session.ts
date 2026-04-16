import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';
import type { SessionClaims } from '@/types/models';

export const SESSION_COOKIE = 'retry_session';

export const signSessionToken = (claims: Omit<SessionClaims, 'iat' | 'exp'>) =>
  jwt.sign(claims, env.supabaseJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '30d'
  });

export const verifySessionToken = (token?: string | null): SessionClaims | null => {
  if (!token) return null;
  try {
    return jwt.verify(token, env.supabaseJwtSecret(), {
      algorithms: ['HS256']
    }) as SessionClaims;
  } catch {
    return null;
  }
};

export const getSessionFromCookies = () => {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const claims = verifySessionToken(token);
  return { token, claims };
};
