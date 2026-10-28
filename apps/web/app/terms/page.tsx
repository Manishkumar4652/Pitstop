import React from 'react';
import { PublicLayout } from '@/components/layout';
import { TermsContent } from './TermsContent';

export const metadata = {
  title: 'Terms of Service (Draft) — PitStop',
  description: 'Draft terms of service specifying user conduct, merchant rules, and platform guidelines for PitStop.',
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <TermsContent />
    </PublicLayout>
  );
}
