import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Store, 
  MapPin, 
  Tag, 
  Briefcase, 
  Plus, 
  ArrowRight, 
  Info, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Clock,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Badge,
  EmptyState 
} from '@/components/ui';
import { verifyMerchantAccess } from '@/lib/auth/merchant-session';
import { MerchantAccessDenied } from '@/components/merchant/MerchantAccessDenied';
import { LogoutButton } from '@/components/auth/LogoutButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Merchant Dashboard — PitStop',
  description:
    'Merchant partner dashboard for authenticated venue owners on the PitStop platform.',
};

export default async function MerchantDashboardPage() {
  const auth = await verifyMerchantAccess('/merchant');

  if (!auth.authorized) {
    return <MerchantAccessDenied user={auth.user} />;
  }

  const { user } = auth;
  const profile = user.merchantProfile;

  const formattedPhone = user.phone
    ? `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`
    : 'Not provided';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const businessTypeName = profile?.businessType
    ? profile.businessType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'General Merchant';

  return (
    <PublicLayout>
      <MerchantNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title={profile?.businessName ? profile.businessName : `${user.name}'s Merchant Station`}
          description="Manage your verified rest-stop presence, configure amenities, and review partner operations on the PitStop network."
          badge={user.isVerified ? 'Verified Partner' : 'Verification In Progress'}
          action={
            <div className="flex items-center gap-2">
              <LogoutButton variant="outline" size="sm" />
            </div>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Merchant hub overview">
          <Container size="xl">
            {/* Authenticated Merchant Business Card */}
            <div className="mb-8 rounded-xl border border-pitstop-border bg-white p-6 shadow-subtle">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pitstop-yellow text-pitstop-charcoal font-bold text-xl shadow-subtle">
                    <Store className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-pitstop-charcoal">
                        {profile?.businessName || user.name}
                      </h2>
                      <Badge variant={user.isVerified ? 'success' : 'warning'} size="sm">
                        {user.isVerified ? 'Verified Merchant' : 'Pending Verification'}
                      </Badge>
                      <span className="text-xs bg-pitstop-bg border border-pitstop-border px-2 py-0.5 rounded text-pitstop-muted">
                        {businessTypeName}
                      </span>
                    </div>

                    <p className="text-xs text-pitstop-muted flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{profile?.address || 'Physical venue address pending in business profile'}</span>
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-pitstop-muted">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {formattedPhone}
                      </span>
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {user.email}
                        </span>
                      )}
                      {profile?.gstNumber && (
                        <span>GSTIN: <strong>{profile.gstNumber}</strong></span>
                      )}
                      <span>Member since {memberSince}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
                  <Link href="/merchant/rest-stops/new">
                    <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                      Register Rest Stop
                    </Button>
                  </Link>
                  <Link href="/for-merchants">
                    <Button variant="outline" size="sm">
                      Partner Guidelines
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Status & Phase Scope Notice */}
            <div className="mb-8 rounded-xl border border-pitstop-border bg-pitstop-bg/60 p-4 shadow-subtle flex items-start gap-3">
              <Info className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-pitstop-muted space-y-1">
                <p>
                  <strong>Phase 6B Active:</strong> Rest stop venue management and cryptographic venue QR check-in posters are live.
                </p>
                <p>
                  Register new rest stop facilities, update capacity and operating hours, and download desk QR posters directly from the portal. Deals and micro-jobs marketplace features are scheduled for Phase 6C &amp; Phase 7.
                </p>
              </div>
            </div>

            {/* Metric Summary Cards (Live Truthful Zero States) */}
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Rest Stops Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      Rest Stop Locations
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">0</span>
                    <span className="text-xs text-pitstop-muted">Registered Venues</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">Onboarding in Phase 6B</span>
                  <Link href="/merchant/rest-stops" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    Manage <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              {/* Active Deals Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      Active Rider Deals
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Tag className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">0</span>
                    <span className="text-xs text-pitstop-muted">Active Offers</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">Connects in Phase 6C</span>
                  <Link href="/merchant/deals" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    Deals <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              {/* Open Micro-Jobs Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      Open Micro-Jobs
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">0</span>
                    <span className="text-xs text-pitstop-muted">Off-Peak Tasks</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">Connects in Phase 7</span>
                  <Link href="/merchant/jobs" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    Tasks <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </div>

            {/* My Rest Stops Section (Truthful Zero-Record State) */}
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-pitstop-charcoal">
                    My Rest Stop Locations
                  </h2>
                  <p className="text-xs text-pitstop-muted">
                    Venues owned and managed by your merchant account.
                  </p>
                </div>
                <Link href="/merchant/rest-stops" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <Card className="p-8 text-center border-dashed border-2 border-pitstop-border">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pitstop-bg text-pitstop-muted">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-pitstop-charcoal">
                  No Rest Stops Registered Yet
                </h3>
                <p className="mt-1 text-xs text-pitstop-muted max-w-md mx-auto">
                  Your merchant partner account currently has no rest stop facilities listed in the database. In Phase 6B, you will be able to register your physical venue, configure available amenities, and activate live capacity indicators.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/merchant/rest-stops/new">
                    <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                      Register Rest Stop (Preview)
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline" size="sm" leftIcon={<Compass className="h-4 w-4" />}>
                      Explore Sample Catalog
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Deals & Jobs Snapshots */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Deals Snapshot */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      Rider Deals Manager
                    </h3>
                  </div>
                  <Link href="/merchant/deals" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark">
                    View Manager
                  </Link>
                </div>

                <div className="rounded-lg border border-dashed border-pitstop-border p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-pitstop-charcoal">Manage Promotional Deals</p>
                  <p className="text-[11px] text-pitstop-muted max-w-sm mx-auto">
                    Publish exclusive discounts (e.g. 50% Chai & Samosa) for approved rest stops to drive gig rider footfall to your venue.
                  </p>
                  <div className="pt-2">
                    <Link href="/merchant/deals">
                      <Button variant="primary" size="sm">
                        Manage Deals
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Micro-Jobs Snapshot */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      Micro-Jobs Marketplace
                    </h3>
                  </div>
                  <Link href="/merchant/jobs" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark">
                    View Marketplace
                  </Link>
                </div>

                <div className="rounded-lg border border-dashed border-pitstop-border p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-pitstop-charcoal">No Open Helper Tasks Posted</p>
                  <p className="text-[11px] text-pitstop-muted max-w-sm mx-auto">
                    Hire reliable delivery riders for quick 1-hour helper tasks (sorting, loading, prep) during slow afternoon hours. Database micro-jobs connect in Phase 7.
                  </p>
                  <div className="pt-2">
                    <Link href="/merchant/jobs">
                      <Button variant="outline" size="sm">
                        Post Micro-Job (Preview)
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
}
