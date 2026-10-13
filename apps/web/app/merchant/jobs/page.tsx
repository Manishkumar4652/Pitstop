import React from 'react';
import { Metadata } from 'next';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { MerchantJobsContent } from '@/components/merchant/MerchantJobsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Micro-Jobs — Merchant Portal',
  description:
    'Publish quick on-demand tasks during quiet hours to help delivery riders earn extra income while resting.',
};

export default async function MerchantJobsPage() {
  const auth = await verifyMerchantAccess('/merchant/jobs');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  return <MerchantJobsContent user={auth.user} />;
}
