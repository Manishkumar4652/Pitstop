import React from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth/cookies';
import { getApiBaseUrl } from '@/lib/api/config';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { MerchantDashboardContent } from '@/components/merchant/MerchantDashboardContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Merchant Dashboard — PitStop',
  description:
    'Merchant partner dashboard for authenticated venue owners on the PitStop platform.',
};

export default async function MerchantDashboardPage() {
  const auth = await verifyMerchantAccess('/merchant');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  const { user } = auth;

  // Retrieve authenticated merchant's rest stops, deals, and jobs from the API
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  let restStops: any[] = [];
  let deals: any[] = [];
  let jobs: any[] = [];

  if (token) {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const [stopsRes, dealsRes, jobsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/merchant/rest-stops`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${apiBaseUrl}/merchant/deals`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${apiBaseUrl}/merchant/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      if (stopsRes.ok) {
        const json = await stopsRes.json();
        if (json.success && Array.isArray(json.data?.items)) {
          restStops = json.data.items;
        }
      }
      if (dealsRes.ok) {
        const json = await dealsRes.json();
        if (json.success && Array.isArray(json.data?.items)) {
          deals = json.data.items;
        }
      }
      if (jobsRes.ok) {
        const json = await jobsRes.json();
        if (json.success && Array.isArray(json.data?.items)) {
          jobs = json.data.items;
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  return (
    <MerchantDashboardContent
      user={user}
      restStops={restStops}
      deals={deals}
      jobs={jobs}
    />
  );
}
