import React from 'react';
import { PublicLayout } from '@/components/layout';
import { AboutContent } from './AboutContent';

export const metadata = {
  title: 'About Us — PitStop Mission & Vision',
  description: 'Learn about PitStop mission to provide rest facilities, deals, and micro-jobs for gig workers across India.',
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <AboutContent />
    </PublicLayout>
  );
}
