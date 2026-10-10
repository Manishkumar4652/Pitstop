import React from 'react';
import Link from 'next/link';
import { Briefcase, Search, Filter, Info, ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Input, Select, EmptyState, Badge } from '@/components/ui';

export const metadata = {
  title: 'Micro-Jobs Marketplace — PitStop',
  description: 'Search short-term paid helper jobs published by local merchants during off-peak afternoon hours.',
};

export default function JobsPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Off-Peak Micro-Jobs Marketplace"
        description="Earn extra cash during quiet afternoon delivery slots (2 PM – 5 PM) with verified short-term helper tasks published by local merchants."
        badge="Rider Earnings"
      />

      <section className="py-8 border-b border-pitstop-border bg-white">
        <Container size="xl">
          {/* Search & Filter Bar */}
          <div className="grid gap-4 sm:grid-cols-12 items-center">
            <div className="sm:col-span-6">
              <Input
                placeholder="Search jobs by keyword or location (e.g. Indiranagar, Sorting)..."
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                placeholder="All Job Categories"
                options={[
                  { label: 'All Job Categories', value: 'all' },
                  { label: '📦 Parcel Sorting', value: 'parcel_sorting' },
                  { label: '🚚 Loading & Unloading', value: 'loading_unloading' },
                  { label: '📄 Flyer Distribution', value: 'flyer_distribution' },
                  { label: '🧹 Cleaning & Prep', value: 'cleaning_prep' },
                  { label: '🏪 Store Assistant', value: 'store_assistant' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="primary" fullWidth leftIcon={<Filter className="h-4 w-4" />}>
                Filter
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Backend Connection Notice */}
          <div className="mb-8 rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-pitstop-charcoal">Live Backend Integration Coming in Phase 7</h4>
                <p className="text-xs text-pitstop-muted mt-0.5">
                  Local merchants will publish live job listings with hourly pay rates, duration, and instructions once the job marketplace API is initialized.
                </p>
              </div>
            </div>
            <Link href="/for-merchants" className="shrink-0">
              <Button variant="outline" size="sm">
                Post a Job as Merchant
              </Button>
            </Link>
          </div>

          {/* Empty State Component Demonstration */}
          <EmptyState
            title="No Active Micro-Jobs Found Nearby"
            description="There are currently no active job postings matching your search criteria. Merchants publish new off-peak tasks daily between 1:00 PM and 5:00 PM."
            icon={<Briefcase className="h-7 w-7 text-pitstop-yellow-dark" />}
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/explore">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Browse Nearby Rest Stops Instead
                  </Button>
                </Link>
                <Link href="/rider/dashboard">
                  <Button variant="outline" size="sm">
                    Go to Rider Dashboard
                  </Button>
                </Link>
              </div>
            }
          />
        </Container>
      </section>
    </PublicLayout>
  );
}
