import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Compass,
  Droplet,
  Armchair,
  BatteryCharging,
  DoorClosed,
  Wifi,
  SquareParking,
  Bookmark,
  QrCode,
  Info,
  ArrowRight,
  Briefcase,
  FileText,
  Store,
  Sparkles,
  Users,
  User,
  ShieldCheck,
  Bike
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState
} from '@/components/ui';
import { RestStopCard } from '@/components/rest-stops/RestStopCard';
import { RiderCheckInSection } from '@/components/rider/RiderCheckInSection';
import { fetchPublicRestStops, RestStopDisplayItem } from '@/lib/api/rest-stops';
import { Facility } from 'shared-types';
import { getServerSession } from '@/lib/auth/server-session';

export const metadata: Metadata = {
  title: 'Rider Dashboard — PitStop',
  description:
    'Rider dashboard for authenticated gig delivery partners. Jump to amenity shortcuts, explore rest stops, and manage shifts in Jaipur.',
};

export default async function RiderDashboardPage() {
  // Enforce server-side authentication
  const session = await getServerSession();
  if (!session) {
    redirect('/rider/login?returnUrl=/rider/dashboard');
  }
  if (session.role === 'merchant') {
    redirect('/merchant');
  }

  // Fetch active rest stops from backend API
  let activeStops: RestStopDisplayItem[] = [];
  try {
    const stopsResult = await fetchPublicRestStops({ page: 1, limit: 6, sort: 'newest' });
    activeStops = stopsResult.items || [];
  } catch {
    activeStops = [];
  }

  const recommendedStops = activeStops.slice(0, 3);

  // Compute facility counts from active rest stops
  const getFacilityCount = (fac: Facility) =>
    activeStops.filter((stop) => stop.facilities.includes(fac)).length;

  const facilityShortcuts = [
    {
      facility: Facility.DRINKING_WATER,
      label: 'Drinking Water',
      description: 'Free filtered RO water refills',
      icon: <Droplet className="h-5 w-5 text-blue-600" aria-hidden="true" />,
      count: getFacilityCount(Facility.DRINKING_WATER),
      href: `/explore?facilities=${Facility.DRINKING_WATER}`,
    },
    {
      facility: Facility.SEATING,
      label: 'Seating Area',
      description: 'Rest benches and shaded chairs',
      icon: <Armchair className="h-5 w-5 text-amber-700" aria-hidden="true" />,
      count: getFacilityCount(Facility.SEATING),
      href: `/explore?facilities=${Facility.SEATING}`,
    },
    {
      facility: Facility.CHARGING,
      label: 'Phone Charging',
      description: 'Multi-pin fast charge sockets',
      icon: <BatteryCharging className="h-5 w-5 text-emerald-600" aria-hidden="true" />,
      count: getFacilityCount(Facility.CHARGING),
      href: `/explore?facilities=${Facility.CHARGING}`,
    },
    {
      facility: Facility.RESTROOM,
      label: 'Clean Restroom',
      description: 'Maintained hygienic washrooms',
      icon: <DoorClosed className="h-5 w-5 text-indigo-600" aria-hidden="true" />,
      count: getFacilityCount(Facility.RESTROOM),
      href: `/explore?facilities=${Facility.RESTROOM}`,
    },
    {
      facility: Facility.WIFI,
      label: 'High-Speed Wi-Fi',
      description: 'Free order dispatch connectivity',
      icon: <Wifi className="h-5 w-5 text-cyan-600" aria-hidden="true" />,
      count: getFacilityCount(Facility.WIFI),
      href: `/explore?facilities=${Facility.WIFI}`,
    },
    {
      facility: Facility.PARKING,
      label: 'Bike Parking',
      description: 'Safe two-wheeler parking spots',
      icon: <SquareParking className="h-5 w-5 text-purple-600" aria-hidden="true" />,
      count: getFacilityCount(Facility.PARKING),
      href: `/explore?facilities=${Facility.PARKING}`,
    },
  ];

  const platformLabel = session.riderProfile?.platform
    ? session.riderProfile.platform.toUpperCase()
    : 'DELIVERY PARTNER';

  const vehicleLabel = session.riderProfile?.vehicleType
    ? session.riderProfile.vehicleType.replace('-', ' ').toUpperCase()
    : '2-WHEELER';

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title={`Welcome back, ${session.name}`}
          description="Your central station for taking breaks, charging phones, accessing clean washrooms, and discovering off-peak micro-jobs between delivery runs."
          badge="Authenticated Rider"
        />

        <section className="py-6 sm:py-8" aria-label="Rider hub overview">
          <Container size="xl">
            {/* Authenticated Session Card */}
            <div className="mb-8 rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold text-base shadow-subtle shrink-0">
                  {session.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-pitstop-charcoal text-sm">
                      {session.name}
                    </span>
                    <Badge variant="yellow" size="sm" icon={<Bike className="h-3 w-3" />}>
                      {platformLabel}
                    </Badge>
                    <span className="text-xs text-pitstop-muted">
                      • {vehicleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-pitstop-muted mt-0.5">
                    Phone: +91 {session.phone.slice(0, 5)} {session.phone.slice(5)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/rider/profile">
                  <Button variant="outline" size="sm" leftIcon={<User className="h-3.5 w-3.5" />}>
                    View Profile
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="primary" size="sm" leftIcon={<Compass className="h-3.5 w-3.5" />}>
                    Explore Rest Stops
                  </Button>
                </Link>
              </div>
            </div>

            {/* Primary Action Hero Card */}
            <div className="mb-10 rounded-2xl border border-pitstop-border bg-gradient-to-br from-white via-white to-pitstop-yellow-light/30 p-6 sm:p-8 shadow-subtle">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-pitstop-yellow-light border border-pitstop-yellow/50 px-2.5 py-0.5 text-xs font-semibold text-pitstop-charcoal">
                  <Sparkles className="h-3.5 w-3.5 text-pitstop-yellow-dark" aria-hidden="true" />
                  <span>Every rider deserves a place to stop</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl">
                  Need to take a breather during your shift?
                </h2>
                <p className="text-sm text-pitstop-muted leading-relaxed">
                  Browse rest stops across Bengaluru where you can refill drinking water, rest comfortably, and charge your phone before your next order drop.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link href="/explore">
                    <Button variant="primary" size="md" leftIcon={<Compass className="h-4 w-4" />}>
                      Explore All Rest Stops
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline" size="md" leftIcon={<Briefcase className="h-4 w-4" />}>
                      Browse Off-Peak Micro-Jobs
                    </Button>
                  </Link>
                  <Link href="/rider/applications">
                    <Button variant="outline" size="md" leftIcon={<FileText className="h-4 w-4" />}>
                      My Applications
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Facility Shortcuts */}
            <div className="mb-12">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h2 className="text-lg font-bold text-pitstop-charcoal">
                    Quick Facility Shortcuts
                  </h2>
                  <p className="text-xs text-pitstop-muted">
                    Click any amenity to filter rest stops offering that specific facility.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View all facilities</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div
                className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                role="list"
                aria-label="Amenity shortcuts"
              >
                {facilityShortcuts.map((item) => (
                  <Link
                    key={item.facility}
                    href={item.href}
                    role="listitem"
                    className="group rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle hover:border-pitstop-yellow hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[120px] focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                    aria-label={`Filter by ${item.label} (${item.count} sample stops available)`}
                  >
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-bg group-hover:bg-pitstop-yellow-light transition-colors mb-3">
                        {item.icon}
                      </div>
                      <h3 className="text-xs font-bold text-pitstop-charcoal group-hover:text-pitstop-charcoal">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-pitstop-muted mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-pitstop-muted flex items-center justify-between">
                      <span>{item.count} stops</span>
                      <ArrowRight className="h-3 w-3 text-pitstop-muted group-hover:text-pitstop-yellow-dark group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommended Rest Stops */}
            <div className="mb-12">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h2 className="text-lg font-bold text-pitstop-charcoal">
                    Recommended Rest Stops
                  </h2>
                  <p className="text-xs text-pitstop-muted">
                    Curated rest stops in Jaipur with amenities and rider perks.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Explore all stops</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {recommendedStops.length > 0 ? (
                <div
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
                  role="feed"
                  aria-label="Recommended rest stops grid"
                >
                  {recommendedStops.map((stop) => (
                    <RestStopCard key={stop.id} stop={stop} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Store className="h-8 w-8 text-pitstop-muted" />}
                  title="No active rest stops found"
                  description="When partner merchants register rest stops and get approved, they will appear right here."
                />
              )}
            </div>

            {/* Rider Activity & Saved Stops (Real Authenticated State) */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Saved Stops Column */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      Saved Rest Stops
                    </h3>
                  </div>
                  <Badge variant="neutral" size="sm">0 Saved</Badge>
                </div>

                <EmptyState
                  title="No Saved Stops Yet"
                  description="Bookmark your favorite rest stops for one-tap access during busy shift hours. Bookmarking will link with your profile in Phase 5B."
                  icon={<Bookmark className="h-6 w-6 text-pitstop-muted" aria-hidden="true" />}
                  action={
                    <Link href="/explore">
                      <Button variant="outline" size="sm" leftIcon={<Compass className="h-3.5 w-3.5" />}>
                        Browse Rest Stops
                      </Button>
                    </Link>
                  }
                />
              </Card>

              {/* Recent Check-Ins Activity Column */}
              <RiderCheckInSection />
            </div>
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
}
