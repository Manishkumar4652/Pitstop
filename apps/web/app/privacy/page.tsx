import React from 'react';
import { PublicLayout } from '@/components/layout';
import { PrivacyContent } from './PrivacyContent';

export const metadata = {
  title: 'Privacy Policy (Draft) — PitStop',
  description: 'Draft privacy policy detailing data handling, opt-in location rules, and user protections for PitStop.',
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <PrivacyContent />
    </PublicLayout>
  );
}
