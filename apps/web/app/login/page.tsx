import { redirect } from 'next/navigation';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { returnUrl?: string; role?: string };
}) {
  const safeReturn = searchParams?.returnUrl ? sanitizeReturnUrl(searchParams.returnUrl, '') : '';
  const isMerchant =
    searchParams?.role === 'merchant' ||
    (safeReturn && safeReturn.startsWith('/merchant'));

  const query = safeReturn ? `?returnUrl=${encodeURIComponent(safeReturn)}` : '';

  if (isMerchant) {
    redirect(`/merchant/login${query}`);
  }

  redirect(`/rider/login${query}`);
}
