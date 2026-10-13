import { cookies } from 'next/headers';
import { UserPublicProfile } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME } from './cookies';

/**
 * Server-side helper to retrieve the authenticated user profile in Server Components.
 * Reads the secure HttpOnly cookie and validates with Express backend.
 */
export async function getServerSession(): Promise<UserPublicProfile | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const apiBaseUrl = getApiBaseUrl();
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.success || !data.data?.user) {
      return null;
    }

    return data.data.user as UserPublicProfile;
  } catch {
    return null;
  }
}
