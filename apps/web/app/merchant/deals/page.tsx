import React from 'react';
import { Metadata } from 'next';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { MerchantDealsContent } from '@/components/merchant/MerchantDealsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rider Deals — Merchant Portal',
  description:
    'Create and manage exclusive food, beverage, and service discounts for delivery riders visiting your rest stops.',
};

export default async function MerchantDealsPage() {
  const auth = await verifyMerchantAccess('/merchant/deals');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  return <MerchantDealsContent user={auth.user} />;
}
