import { redirect } from 'next/navigation';
import { UserPublicProfile, UserRole } from 'shared-types';
import { getServerSession } from './server-session';
import { sanitizeReturnUrl } from './return-url';

export type MerchantAccessResult =
  | { authorized: true; user: UserPublicProfile }
  | { authorized: false; user: UserPublicProfile };

/**
 * Server-side authorization verification for Merchant routes.
 * 
 * 1. If unauthenticated -> redirects immediately to /merchant/login?returnUrl=...
 * 2. If authenticated as a RIDER or non-MERCHANT -> returns { authorized: false, user }
 * 3. If authenticated as a MERCHANT -> returns { authorized: true, user }
 */
export async function verifyMerchantAccess(returnUrl: string): Promise<MerchantAccessResult> {
  const session = await getServerSession();

  if (!session) {
    const safeReturn = sanitizeReturnUrl(returnUrl, '/merchant');
    redirect(`/merchant/login?returnUrl=${encodeURIComponent(safeReturn)}`);
  }

  if (session.role !== UserRole.MERCHANT) {
    return { authorized: false, user: session };
  }

  return { authorized: true, user: session };
}
