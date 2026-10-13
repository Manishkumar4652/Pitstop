import { redirect } from 'next/navigation';
import { sanitizeReturnUrl } from '@/lib/auth/return-url';

export default function RegisterPage({
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
    redirect(`/merchant/register${query}`);
  }

  redirect(`/rider/register${query}`);
}
