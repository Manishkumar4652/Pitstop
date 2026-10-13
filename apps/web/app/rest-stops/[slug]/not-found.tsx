import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, EmptyState, Button } from '@/components/ui';

export default function RestStopNotFound() {
  return (
    <PublicLayout>
      <main id="main-content" className="py-16 sm:py-24">
        <Container size="md">
          <EmptyState
            title="Rest Stop Not Found"
            description="The rest stop you are searching for does not exist in our catalog or the link may have expired."
            icon={<Search className="h-7 w-7 text-pitstop-yellow-dark" aria-hidden="true" />}
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/explore">
                  <Button variant="primary" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Return to Explore Stops
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="md">
                    Go to Homepage
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
