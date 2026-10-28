import React from 'react';
import { PublicLayout } from '@/components/layout';
import { HowItWorksContent } from './HowItWorksContent';

export const metadata = {
  title: 'How It Works — PitStop',
  description: 'Learn how PitStop connects delivery riders with verified rest stops, exclusive deals, and local micro-jobs.',
};

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <HowItWorksContent />
    </PublicLayout>
  );
}
