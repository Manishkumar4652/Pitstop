import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  QrCode, 
  Coffee, 
  Briefcase, 
  Store, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Badge, SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'How It Works — PitStop',
  description: 'Learn how PitStop connects delivery riders with verified rest stops, exclusive deals, and local micro-jobs.',
};

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="How PitStop Works"
        description="A simple, transparent platform bringing gig workers and local merchants together for mutual benefit."
        badge="Platform Guide"
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Rider Workflow Section */}
          <SectionHeading
            title="For Delivery Riders & Gig Drivers"
            subtitle="Four easy steps to find rest, recharge your phone, save on food, and earn extra income."
            badge="Rider Journey"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">Step 1</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Discover Rest Stops</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Use the PitStop map or list search to find nearby rest stops with free drinking water, seating, charging, and restrooms.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <QrCode className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">Step 2</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Quick Check-In</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Arrive at the merchant rest stop, scan the unique QR code or share your 4-digit OTP at the desk to verify your visit.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <Coffee className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">Step 3</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Rest &amp; Redeem Deals</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Enjoy clean amenities and unlock rider-exclusive discounts on chai, snacks, and lunch deals offered by the merchant.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                  <Briefcase className="h-6 w-6" />
                </div>
                <Badge variant="yellow" size="sm" className="mb-2">Step 4</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Apply for Micro-Jobs</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  During quiet afternoon hours (2 PM – 5 PM), apply for short-term helper tasks to earn extra cash while waiting for orders.
                </p>
              </div>
            </Card>
          </div>

          {/* Merchant Workflow Section */}
          <SectionHeading
            title="For Partner Merchants & Local Businesses"
            subtitle="Drive steady footfall during slow hours and hire verified local gig workers for short tasks."
            badge="Merchant Journey"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <Store className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">Step 1</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Register Facility</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Create your merchant profile, list available rider amenities (water, seating, charging, WC), and set operating hours.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <UserCheck className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">Step 2</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Display QR Standee</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Place your PitStop QR code at your counter. Riders scan or share an OTP upon arrival to verify check-ins.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">Step 3</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Publish Rider Deals</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Offer special discounts on snacks or beverages to attract delivery drivers to your business during non-peak hours.
                </p>
              </div>
            </Card>

            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-bg text-pitstop-charcoal mb-4 border border-pitstop-border">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <Badge variant="neutral" size="sm" className="mb-2">Step 4</Badge>
                <h3 className="text-lg font-bold text-pitstop-charcoal">Post Off-Peak Tasks</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Need help with parcel loading, inventory sorting, or flyer delivery? Post short jobs for verified riders resting nearby.
                </p>
              </div>
            </Card>
          </div>

          {/* CTA Banner */}
          <div className="rounded-2xl border border-pitstop-border bg-white p-8 text-center shadow-subtle sm:p-12">
            <h3 className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">Ready to join the PitStop network?</h3>
            <p className="mt-3 text-sm text-pitstop-muted max-w-xl mx-auto">
              Start discovering rest stops or register your business in under 2 minutes.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Rest Stops
                </Button>
              </Link>
              <Link href="/for-merchants" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth>
                  For Merchants
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
