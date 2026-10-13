import React from 'react';
import { Metadata } from 'next';
import { verifyAdminAccess } from '@/lib/auth/admin-session';
import { PublicLayout, AdminNav } from '@/components/layout';
import { Card, Button, Container } from '@/components/ui';
import { ShieldAlert } from 'lucide-react';
import { LogoutButton } from '@/components/auth/LogoutButton';
import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Console — PitStop Platform',
  description:
    'Platform administration console and moderation overview for rest stops, merchants, micro-jobs, and deals on the PitStop network.',
};

export default async function AdminDashboardPage() {
  const access = await verifyAdminAccess('/admin');

  if (!access.authorized) {
    return (
      <PublicLayout>
        <AdminNav />
        <main id="main-content" className="py-12 bg-pitstop-bg min-h-[70vh] flex items-center justify-center">
          <Container size="md">
            <Card className="p-8 text-center border-amber-200 bg-amber-50/50 shadow-subtle max-w-md mx-auto">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-pitstop-charcoal mb-2">
                Administrator Privileges Required
              </h2>
              <p className="text-sm text-pitstop-secondary mb-6">
                You are currently signed in as <strong>{access.user.name}</strong> ({access.user.role}).
                The administration console is restricted strictly to authorized platform administrators.
              </p>
              <div className="flex flex-col gap-3">
                <LogoutButton 
                  variant="outline" 
                  className="w-full justify-center"
                />
              </div>
            </Card>
          </Container>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <AdminNav />
      <AdminDashboardClient adminUser={access.user} />
    </PublicLayout>
  );
}
