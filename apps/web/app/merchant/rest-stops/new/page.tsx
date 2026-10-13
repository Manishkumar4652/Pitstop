import React from 'react';
import { Metadata } from 'next';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { CreateRestStopContent } from '@/components/merchant/CreateRestStopContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add New Rest Stop — Merchant Portal',
  description:
    'Register your restaurant, tea stall, or store as a community rest facility on PitStop.',
};

export default async function CreateRestStopPage() {
  const auth = await verifyMerchantAccess('/merchant/rest-stops/new');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  return <CreateRestStopContent user={auth.user} />;
}
