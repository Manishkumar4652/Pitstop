import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { PublicLayout } from '@/components/layout';
import { LoadingState, PageHeader } from '@/components/ui';
import { fetchPublicRestStops, PublicRestStopsResult } from '@/lib/api/rest-stops';
import { ExploreContent } from './ExploreContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore Rest Stops — PitStop Discovery',
  description:
    'Search and filter rest stops for gig workers and delivery riders. Drinking water, seating, mobile charging, clean restrooms, Wi-Fi, and parking in Bengaluru.',
  keywords: [
    'rest stop discovery',
    'delivery rider rest points',
    'free drinking water',
    'mobile charging stations',
    'Bengaluru rest stops',
    'PitStop',
  ],
};

export default async function ExplorePage() {
  let initialData: PublicRestStopsResult | null = null;
  let initialError: string | null = null;

  try {
    initialData = await fetchPublicRestStops({ page: 1, limit: 12, sort: 'newest' });
  } catch (err: any) {
    initialError = err.message || 'Unable to connect to the rest stops API service.';
  }

  const badgeText = initialData?.isDemoFallback
    ? 'Sample Catalog (Offline Mode)'
    : initialError
      ? 'Service Offline'
      : 'Rest Stop Catalog';

  return (
    <PublicLayout>
      <main id="main-content">
        <PageHeader
          title="Find your next pit stop"
          description="Browse rest stop locations in Bengaluru designed for delivery partners to drink water, sit down, charge phones, and use restrooms between shifts."
          badge={badgeText}
        />
        <Suspense fallback={<LoadingState text="Loading rest stop catalog..." />}>
          <ExploreContent initialData={initialData} initialError={initialError} />
        </Suspense>
      </main>
    </PublicLayout>
  );
}
