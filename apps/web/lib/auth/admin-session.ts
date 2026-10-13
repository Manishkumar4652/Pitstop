import { redirect } from 'next/navigation';
import { UserPublicProfile, UserRole } from 'shared-types';
import { getServerSession } from './server-session';
import { sanitizeReturnUrl } from './return-url';

export type AdminAccessResult =
  | { authorized: true; user: UserPublicProfile }
  | { authorized: false; user: UserPublicProfile };

/**
 * Server-side authorization verification for Admin console pages.
 * 
 * 1. If unauthenticated -> redirects immediately to /admin/login?returnUrl=...
 * 2. If authenticated as non-ADMIN -> returns { authorized: false, user }
 * 3. If authenticated as ADMIN -> returns { authorized: true, user }
 */
export async function verifyAdminAccess(returnUrl: string): Promise<AdminAccessResult> {
  const session = await getServerSession();

  if (!session) {
    const safeReturn = sanitizeReturnUrl(returnUrl, '/admin');
    redirect(`/admin/login?returnUrl=${encodeURIComponent(safeReturn)}`);
  }

  if (session.role !== UserRole.ADMIN) {
    return { authorized: false, user: session };
  }

  return { authorized: true, user: session };
}
