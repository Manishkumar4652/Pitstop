'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Bike, Store, ArrowRight } from 'lucide-react';
import { UserPublicProfile, UserRole } from 'shared-types';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { Container, Card, Button, Badge } from '@/components/ui';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface MerchantAccessDeniedProps {
  user: UserPublicProfile;
}

export const MerchantAccessDenied: React.FC<MerchantAccessDeniedProps> = ({ user }) => {
  const roleName = user.role === UserRole.RIDER ? 'Rider' : user.role === UserRole.ADMIN ? 'Administrator' : user.role;
  const formattedPhone = user.phone
    ? `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`
    : 'Not provided';

  return (
    <PublicLayout>
      <MerchantNav />

      <main id="main-content" className="py-12 sm:py-16">
        <Container size="md">
          <Card className="p-6 sm:p-10 border-pitstop-border shadow-elevation text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldAlert className="h-7 w-7" aria-hidden="true" />
            </div>

            <Badge variant="warning" size="sm" className="mb-3">
              HTTP 403 — Access Restricted
            </Badge>

            <h1 className="text-xl sm:text-2xl font-bold text-pitstop-charcoal">
              Merchant Portal Restricted
            </h1>

            <p className="mt-2 text-sm text-pitstop-muted max-w-lg mx-auto leading-relaxed">
              You are currently authenticated as{' '}
              <strong className="text-pitstop-charcoal">{user.name}</strong> ({formattedPhone}) with the{' '}
              <span className="font-semibold text-pitstop-charcoal bg-pitstop-bg px-2 py-0.5 rounded border border-pitstop-border">
                {roleName}
              </span>{' '}
              role. The Merchant Portal is strictly reserved for verified local merchant partners.
            </p>

            <div className="mt-6 rounded-xl border border-pitstop-border bg-pitstop-bg/50 p-4 text-xs text-pitstop-muted text-left max-w-lg mx-auto space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pitstop-charcoal">Active Session:</span>
                <span>{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pitstop-charcoal">Current Role:</span>
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pitstop-charcoal">Required Role:</span>
                <span className="font-bold text-pitstop-charcoal">Merchant</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {user.role === UserRole.RIDER && (
                <Link href="/rider/dashboard">
                  <Button variant="primary" size="md" leftIcon={<Bike className="h-4 w-4" />}>
                    Go to Rider Dashboard
                  </Button>
                </Link>
              )}
              <Link href="/merchant/login">
                <Button variant="outline" size="md" leftIcon={<Store className="h-4 w-4" />}>
                  Switch to Merchant Account
                </Button>
              </Link>
              <LogoutButton variant="ghost" size="md" />
            </div>

            <div className="mt-6 pt-6 border-t border-pitstop-border text-xs text-pitstop-muted">
              Interested in partnering as a merchant?{' '}
              <Link href="/for-merchants" className="font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark underline">
                Learn about the Partner Program
              </Link>
            </div>
          </Card>
        </Container>
      </main>
    </PublicLayout>
  );
};
