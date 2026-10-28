import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { RiderProfileContent } from '@/components/rider/RiderProfileContent';

export const metadata: Metadata = {
  title: 'Rider Profile & Account — PitStop',
  description:
    'Rider profile, work platform associations, vehicle registration, and activity details for authenticated delivery partners.',
};

export const dynamic = 'force-dynamic';

export default async function RiderProfilePage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/rider/login?returnUrl=/rider/profile');
  }
  if (session.role === 'merchant') {
    redirect('/merchant');
  }

  return <RiderProfileContent user={session} />;
}
