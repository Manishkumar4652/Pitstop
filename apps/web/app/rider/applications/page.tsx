import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { RiderApplicationsContent } from '@/components/rider/RiderApplicationsContent';

export const metadata: Metadata = {
  title: 'My Applications — Rider Portal',
  description:
    'Track your micro-job application status, review shift instructions, and manage pending applications.',
};

export const dynamic = 'force-dynamic';

export default async function RiderApplicationsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/rider/login?returnUrl=/rider/applications');
  }

  if (session.role === 'merchant') {
    redirect('/merchant');
  }

  return <RiderApplicationsContent user={session} />;
}
