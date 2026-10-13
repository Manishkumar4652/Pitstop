import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Check, 
  ShieldCheck,
  Info
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Input, Select, Badge, SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'For Merchants — PitStop Partner Program',
  description: 'List your business facility, publish rider deals, and hire local gig workers during off-peak hours.',
};

export default function ForMerchantsPage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Partner With PitStop"
        description="Transform quiet afternoon hours into steady footfall and gain flexible local helper support by listing your restaurant, cafe, or store as a verified rest stop."
        badge="Merchant Portal"
        action={
          <Link href="/merchant">
            <Button variant="primary" size="md" leftIcon={<Store className="h-4 w-4" />}>
              Open Merchant Portal Demo
            </Button>
          </Link>
        }
      />

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Value Proposition Grid */}
          <SectionHeading
            title="Why Join the PitStop Merchant Network?"
            subtitle="Local merchants across India are building customer loyalty and boosting revenue with gig riders."
            badge="Merchant Benefits"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">Boost Afternoon Footfall</h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                Attract Zomato, Swiggy, and Rapido riders to your venue during slow 2 PM – 5 PM slots with exclusive chai and meal offers.
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">Flexible Micro-Jobs</h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                Need extra hands for store cleaning, parcel sorting, or flyer delivery? Post short paid tasks for riders resting at your shop.
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">Rider Community Goodwill</h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                Build a positive reputation among local gig workers who frequently deliver for platforms surrounding your neighborhood.
              </p>
            </Card>

            <Card variant="default">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-pitstop-charcoal">Verified Check-Ins</h3>
              <p className="mt-2 text-sm text-pitstop-muted">
                QR and OTP check-ins ensure only verified gig riders access your deals and rest facilities, protecting your business.
              </p>
            </Card>
          </div>

          {/* Facility Guidelines & Onboarding Form Section */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Col: Facility Requirements */}
            <div className="lg:col-span-5 space-y-6">
              <Card variant="default" className="bg-gradient-to-b from-white to-pitstop-bg">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="h-5 w-5 text-pitstop-yellow-dark" />
                  <h3 className="text-lg font-bold text-pitstop-charcoal">Rest Stop Facility Guidelines</h3>
                </div>
                <p className="text-sm text-pitstop-muted mb-4">
                  To maintain quality standards, partner merchants should provide at least 2 of the following amenities:
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Drinking Water:</strong> Free clean RO or filtered drinking water for riders.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Seating Area:</strong> Shaded indoor or outdoor seating for 2+ riders.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Mobile Charging:</strong> Accessible multi-pin charging outlets or extension cords.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Restroom Access:</strong> Clean, accessible washroom facilities.</span>
                  </li>
                </ul>
              </Card>

              <Card variant="flat" className="border-pitstop-yellow/40 bg-pitstop-yellow-light p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-pitstop-charcoal">Zero Upfront Listing Fee</h4>
                    <p className="mt-1 text-xs text-pitstop-muted">
                      Listing your facility on PitStop is completely free during our initial merchant onboarding phase in India.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Merchant Onboarding Interest Form */}
            <div className="lg:col-span-7">
              <Card variant="default">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-pitstop-charcoal">Merchant Partner Onboarding</h3>
                    <p className="text-xs text-pitstop-muted mt-1">Submit your details to express interest in joining the PitStop rest network.</p>
                  </div>
                  <Badge variant="yellow">Phase 1 Onboarding</Badge>
                </div>

                {/* Form Notice */}
                <div className="mb-6 rounded-lg border border-pitstop-border bg-pitstop-bg p-3.5 text-xs text-pitstop-muted flex items-start gap-2">
                  <Info className="h-4 w-4 text-pitstop-charcoal shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Form submissions will connect to the server API during merchant authentication setup (Phase 2B+). This form layout demonstrates input validation standards.
                  </span>
                </div>

                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Business Name" placeholder="e.g. Chai Point Express" required />
                    <Select
                      label="Business Category"
                      required
                      options={[
                        { label: 'Restaurant / Eatery', value: 'restaurant' },
                        { label: 'Tea Stall / Cafe', value: 'tea_stall' },
                        { label: 'Supermarket / Grocery', value: 'supermarket' },
                        { label: 'Garage / Service Center', value: 'garage' },
                        { label: 'Other Retail Store', value: 'other' },
                      ]}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Contact Person Name" placeholder="Owner or Manager Name" required />
                    <Input label="Mobile Phone Number" placeholder="10-digit Indian phone number" required />
                  </div>

                  <Input label="Business Address" placeholder="Street address, area, city, pincode" required />

                  <div>
                    <label className="text-xs font-semibold text-pitstop-charcoal block mb-2">Available Amenities at Your Business</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 border rounded border-pitstop-border bg-pitstop-bg cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-pitstop-border text-pitstop-yellow focus:ring-pitstop-yellow" />
                        <span>Drinking Water</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border rounded border-pitstop-border bg-pitstop-bg cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-pitstop-border text-pitstop-yellow focus:ring-pitstop-yellow" />
                        <span>Seating Area</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border rounded border-pitstop-border bg-pitstop-bg cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-pitstop-border text-pitstop-yellow focus:ring-pitstop-yellow" />
                        <span>Phone Charging</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border rounded border-pitstop-border bg-pitstop-bg cursor-pointer">
                        <input type="checkbox" className="rounded border-pitstop-border text-pitstop-yellow focus:ring-pitstop-yellow" />
                        <span>Clean Restroom</span>
                      </label>
                    </div>
                  </div>

                  <Button variant="primary" fullWidth className="mt-4">
                    Submit Partner Registration Request
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
