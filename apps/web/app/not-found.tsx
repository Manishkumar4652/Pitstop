import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, EmptyState, Button } from '@/components/ui';

export default function NotFound() {
  return (
    <PublicLayout>
      <main id="main-content" className="py-16 sm:py-24">
        <Container size="md">
          <EmptyState
            title="Page Not Found"
            description="We could not find the page you were looking for. It may have been moved, removed, or the URL might be mistyped."
            icon={<Compass className="h-7 w-7 text-pitstop-yellow-dark" aria-hidden="true" />}
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/explore">
                  <Button variant="primary" size="md" leftIcon={<Compass className="h-4 w-4" />}>
                    Explore Rest Stops
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            }
          />
        </Container>
      </main>
    </PublicLayout>
  );
}
