import React from 'react';
import Link from 'next/link';
import { 
  HeartHandshake, 
  Target, 
  ShieldCheck, 
  MapPin, 
  Coffee, 
  Briefcase,
  Navigation
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Badge } from '@/components/ui';

export const metadata = {
  title: 'About Us — PitStop Mission & Vision',
  description: 'Learn about PitStop mission to provide rest facilities, deals, and micro-jobs for gig workers across India.',
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="About PitStop"
        description="We are building India's dedicated rest-stop discovery and local opportunity platform for delivery riders, ride drivers, and local merchants."
        badge="Our Mission"
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Mission Quote Banner */}
          <div className="mb-16 rounded-2xl border border-pitstop-yellow/50 bg-pitstop-yellow-light p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-pitstop-yellow text-pitstop-charcoal mb-4 shadow-subtle">
              <Navigation className="h-7 w-7 fill-pitstop-charcoal stroke-pitstop-charcoal" />
            </div>
            <h2 className="text-2xl font-extrabold text-pitstop-charcoal sm:text-4xl">
              &quot;Every rider deserves a place to stop.&quot;
            </h2>
            <p className="mt-4 text-sm text-pitstop-muted sm:text-base max-w-2xl mx-auto">
              India&apos;s gig economy powers millions of daily doorstep deliveries for Zomato, Swiggy, Blinkit, Zepto, Amazon, Uber, Ola, and Rapido. Yet, gig workers endure harsh weather, lack of clean amenities, and unpaid afternoon downtime. PitStop exists to change that.
            </p>
          </div>

          {/* Problem & Solution Grid */}
          <div className="grid gap-8 md:grid-cols-2 mb-16">
            <Card variant="default" className="border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-pitstop-charcoal">The Challenge Facing Gig Workers</h3>
              </div>
              <ul className="space-y-3 text-sm text-pitstop-muted">
                <li>• <strong>Severe Fatigue &amp; Heat:</strong> Delivery riders spend 10+ hours on 2-wheelers without access to shade, clean water, or restrooms.</li>
                <li>• <strong>Unproductive Downtime:</strong> Afternoon hours (2 PM – 5 PM) suffer from low order volumes, forcing riders to wait uncomfortably on street corners.</li>
                <li>• <strong>High Daily Costs:</strong> Buying water, chai, and meals on shift significantly cuts into gig earnings.</li>
              </ul>
            </Card>

            <Card variant="default" className="border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-pitstop-charcoal">The PitStop Solution</h3>
              </div>
              <ul className="space-y-3 text-sm text-pitstop-muted">
                <li>• <strong>Verified Rest Stops:</strong> A searchable map of merchant partners offering free drinking water, seating, charging, and clean washrooms.</li>
                <li>• <strong>Rider Discounts:</strong> Merchant-sponsored food &amp; beverage deals that save riders money every single shift.</li>
                <li>• <strong>Off-Peak Micro-Jobs:</strong> Verified short-term helper tasks (parcel sorting, store prep) published by local merchants during quiet hours.</li>
              </ul>
            </Card>
          </div>

          {/* Core Pillars */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-pitstop-charcoal text-center mb-8">Our Four Core Pillars</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">1. Physical Dignity</h4>
                <p className="mt-1 text-xs text-pitstop-muted">Clean drinking water, seating, phone charging, and restrooms accessible to all verified riders.</p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <Coffee className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">2. Everyday Savings</h4>
                <p className="mt-1 text-xs text-pitstop-muted">Single-use merchant coupons providing discounts on daily chai, refreshments, and meals.</p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">3. Income Enhancement</h4>
                <p className="mt-1 text-xs text-pitstop-muted">Short-term helper tasks enabling riders to earn income during quiet afternoon order windows.</p>
              </Card>

              <Card variant="flat" className="bg-white border-pitstop-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-3">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-pitstop-charcoal text-sm">4. Community Trust</h4>
                <p className="mt-1 text-xs text-pitstop-muted">Server-verified QR check-ins, transparent ratings, and respectful merchant partnerships.</p>
              </Card>
            </div>
          </div>

          {/* Action Footer */}
          <div className="text-center bg-white rounded-xl border border-pitstop-border p-8">
            <h3 className="text-lg font-bold text-pitstop-charcoal">Want to support the PitStop mission?</h3>
            <p className="text-xs text-pitstop-muted mt-1">Whether you ride or run a local business, get started today.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/explore">
                <Button variant="primary" size="sm">Explore Rest Stops</Button>
              </Link>
              <Link href="/for-merchants">
                <Button variant="outline" size="sm">Merchant Partner Info</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
