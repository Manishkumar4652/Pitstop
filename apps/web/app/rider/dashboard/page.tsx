import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RiderDashboardContent } from '@/components/rider/RiderDashboardContent';
import { fetchPublicRestStops, RestStopDisplayItem } from '@/lib/api/rest-stops';
import { getServerSession } from '@/lib/auth/server-session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rider Station Dashboard — PitStop',
  description:
    'Dedicated hub for delivery partners. Verified rest stops, mobile QR check-ins, amenity filters, and off-peak micro-jobs in Bengaluru.',
};

export default async function RiderDashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/rider/login?returnUrl=/rider/dashboard');
  }

  if (session.role === 'merchant') {
    redirect('/merchant');
  }

  let recommendedStops: RestStopDisplayItem[] = [];
  try {
    const stopsRes = await fetchPublicRestStops({ limit: 3, sort: 'rating' });
    recommendedStops = stopsRes.items || [];
  } catch {
    recommendedStops = [];
  }

  return (
    <RiderDashboardContent
      user={session}
      recommendedStops={recommendedStops}
    />
  );
}
