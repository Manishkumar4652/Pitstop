import React from 'react';
import { Metadata } from 'next';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { MerchantRestStopsContent } from '@/components/merchant/MerchantRestStopsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Rest Stops — Merchant Portal',
  description:
    'Manage your merchant rest-stop facilities, operating hours, capacity status, and amenities on PitStop.',
};

export default async function MerchantRestStopsPage() {
  const auth = await verifyMerchantAccess('/merchant/rest-stops');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  return (
    <PublicLayout>
      <MerchantNav />
      <MerchantRestStopsContent user={auth.user} />
    </PublicLayout>
  );
}
