'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, Card, Button } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RestStopError({ error, reset }: ErrorProps) {
  return (
    <PublicLayout>
      <main id="main-content" className="py-16 sm:py-24">
        <Container size="md">
          <Card className="p-8 sm:p-10 border border-red-200 bg-white text-center shadow-subtle">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-pitstop-charcoal">
              Rest Stop Service Temporarily Unavailable
            </h1>
            <p className="mt-2 text-sm text-pitstop-muted max-w-md mx-auto">
              We encountered a connection issue while communicating with the rest stop discovery service.
              {error.message ? ` (${error.message})` : ''}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => reset()}
              >
                Retry
              </Button>
              <Link href="/explore">
                <Button variant="outline" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Return to Explore
                </Button>
              </Link>
            </div>
          </Card>
        </Container>
      </main>
    </PublicLayout>
  );
}
