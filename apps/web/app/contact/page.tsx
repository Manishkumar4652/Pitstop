import React from 'react';
import { PublicLayout } from '@/components/layout';
import { ContactContent } from './ContactContent';

export const metadata = {
  title: 'Contact Us — PitStop Support',
  description: 'Get in touch with the PitStop team for support, merchant partnerships, or platform feedback.',
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactContent />
    </PublicLayout>
  );
}
