import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { JobsContent } from '@/components/jobs/JobsContent';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader } from '@/components/ui';
import { RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Micro-Jobs Marketplace — PitStop',
  description:
    'Search short-term paid helper jobs published by local merchants during off-peak afternoon hours.',
};

export const dynamic = 'force-dynamic';

function JobsLoadingFallback() {
  return (
    <PublicLayout>
      <PageHeader
        title="Off-Peak Micro-Jobs Marketplace"
        description="Earn extra cash during quiet afternoon delivery slots with verified short-term helper tasks."
        badge="Rider Earnings"
      />
      <section className="py-16">
        <Container size="xl">
          <div className="flex flex-col items-center justify-center text-pitstop-muted py-12">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-pitstop-yellow-dark" />
            <p className="text-sm font-medium">Loading marketplace...</p>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsLoadingFallback />}>
      <JobsContent />
    </Suspense>
  );
}
