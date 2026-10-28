import React from 'react';
import { PublicLayout } from '@/components/layout';
import { ForMerchantsContent } from './ForMerchantsContent';

export const metadata = {
  title: 'For Merchants — PitStop Partner Program',
  description: 'List your business facility, publish rider deals, and hire local gig workers during off-peak hours.',
};

export default function ForMerchantsPage() {
  return (
    <PublicLayout>
      <ForMerchantsContent />
    </PublicLayout>
  );
}
