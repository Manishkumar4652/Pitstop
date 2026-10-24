import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  MapPin, 
  Store, 
  Star, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  Info, 
  QrCode, 
  Navigation,
  ShieldCheck,
  Users,
  ExternalLink
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import { Container, Card, Badge, Button } from '@/components/ui';
import { getAllRestStopSlugs } from '@/lib/data/rest-stops';
import { 
  fetchPublicRestStopBySlug, 
  ApiNotFoundError, 
  RestStopDisplayItem 
} from '@/lib/api/rest-stops';
import { FACILITY_METADATA } from '@/components/rest-stops/facility-config';
import { RestStopCheckInDesk } from '@/components/rest-stops/RestStopCheckInDesk';
import { RestStopMap } from '@/components/maps/RestStopMap';
import { CapacityStatus } from 'shared-types';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return getAllRestStopSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { item } = await fetchPublicRestStopBySlug(params.slug);
    return {
      title: `${item.name} (${item.address.area}) — PitStop Rest Stop Details`,
      description: item.description,
    };
  } catch (err: unknown) {
    if (err instanceof ApiNotFoundError) {
      return {
        title: 'Rest Stop Not Found — PitStop',
        description: 'The requested rest stop could not be found.',
      };
    }
    return {
      title: 'Rest Stop Details — PitStop',
      description: 'Rest stop amenities, seating capacity, and details for delivery riders.',
    };
  }
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default async function RestStopDetailPage({ params }: PageProps) {
  let stop: RestStopDisplayItem;

  try {
    const res = await fetchPublicRestStopBySlug(params.slug);
    stop = res.item;
  } catch (err: unknown) {
    // Rule: genuine 404 maps to notFound(). Server/network failures throw to error boundary.
    if (err instanceof ApiNotFoundError) {
      notFound();
    }
    throw err;
  }

  const {
    name,
    merchantName,
    venueType,
    description,
    address,
    facilities,
    capacity,
    operatingHours,
    rating,
    dealBadge,
    dealDescription,
    isDemoData,
  } = stop;

  const getCapacityBadge = (status: CapacityStatus) => {
    switch (status) {
      case CapacityStatus.AVAILABLE:
        return (
          <Badge variant="success" size="md" icon={<Users className="h-3.5 w-3.5" />}>
            Available ({capacity.currentOccupancy}/{capacity.maxRiders} seats occupied)
          </Badge>
        );
      case CapacityStatus.BUSY:
        return (
          <Badge variant="warning" size="md" icon={<Users className="h-3.5 w-3.5" />}>
            Busy ({capacity.currentOccupancy}/{capacity.maxRiders} seats occupied)
          </Badge>
        );
      case CapacityStatus.FULL:
        return (
          <Badge variant="danger" size="md" icon={<Users className="h-3.5 w-3.5" />}>
            Full ({capacity.currentOccupancy}/{capacity.maxRiders} seats occupied)
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
      <RiderNav />
      <main id="main-content" className="py-6 sm:py-12 pb-32 md:pb-12">
        <Container size="xl">
          {/* Breadcrumbs & Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-pitstop-muted">
              <li>
                <Link 
                  href="/" 
                  className="hover:text-pitstop-charcoal rounded px-1 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link 
                  href="/explore" 
                  className="hover:text-pitstop-charcoal rounded px-1 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
                >
                  Explore Rest Stops
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-pitstop-charcoal truncate max-w-[200px] sm:max-w-none" aria-current="page">
                {name}
              </li>
            </ol>
          </nav>

          {/* Back to Explore link */}
          <div className="mb-6">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitstop-muted hover:text-pitstop-charcoal transition-colors rounded p-1 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to all rest stops</span>
            </Link>
          </div>

          {/* Demo Notice Banner when in offline fallback */}
          {isDemoData && (
            <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-subtle flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-amber-900 space-y-1">
                <p>
                  <strong>Sample Rest Stop (Offline Mode):</strong> This rest-stop listing is presented from the sample demo catalog because the live backend service is unreachable or running in offline mode.
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Responsive Grid */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Header Card */}
              <Card className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="yellow" size="md">
                      {isDemoData ? 'Sample Rest Stop (Demo)' : 'Rest Stop Location'}
                    </Badge>
                    {venueType && (
                      <span className="text-xs text-pitstop-muted bg-pitstop-bg border border-pitstop-border px-2 py-0.5 rounded font-medium">
                        {venueType}
                      </span>
                    )}
                  </div>

                  {rating && rating.count > 0 ? (
                    <div 
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"
                      aria-label={`Rating: ${rating.average.toFixed(1)} out of 5 stars based on ${rating.count} reviews${isDemoData ? ' (Sample Data)' : ''}`}
                    >
                      <Star className="h-4 w-4 fill-amber-500 stroke-amber-500" aria-hidden="true" />
                      <span>{rating.average.toFixed(1)}</span>
                      <span className="text-pitstop-muted font-normal">({rating.count} reviews)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-pitstop-muted bg-pitstop-bg border border-pitstop-border px-2.5 py-1 rounded-full font-medium">
                      New Location
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl break-words">
                  {name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-pitstop-muted">
                  <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-pitstop-muted shrink-0" aria-hidden="true" />
                    <span className="font-medium text-pitstop-charcoal">
                      {merchantName || 'Local Partner Business'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-pitstop-muted shrink-0" aria-hidden="true" />
                    <span>{address.area}, {address.city}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-pitstop-border pt-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-pitstop-charcoal mb-2">
                    About this Rest Stop
                  </h2>
                  <p className="text-sm leading-relaxed text-pitstop-charcoal/90">
                    {description}
                  </p>
                </div>
              </Card>

              {/* Facilities Section */}
              <Card className="p-6 sm:p-8">
                <div className="border-b border-pitstop-border pb-4 mb-6">
                  <h2 className="text-lg font-bold text-pitstop-charcoal">
                    Available Amenities & Facilities
                  </h2>
                  <p className="text-xs text-pitstop-muted mt-1">
                    Free amenities accessible to delivery riders and gig workers during operating hours.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2" role="list" aria-label="List of available amenities">
                  {facilities.map((facilityKey) => {
                    const meta = FACILITY_METADATA[facilityKey];
                    if (!meta) return null;
                    return (
                      <div
                        key={facilityKey}
                        role="listitem"
                        className="rounded-lg border border-pitstop-border bg-pitstop-bg/40 p-4 flex items-start gap-3.5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-pitstop-border shadow-subtle shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-pitstop-charcoal">
                            {meta.label}
                          </h3>
                          <p className="mt-0.5 text-xs text-pitstop-muted leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Operating Hours */}
              {operatingHours && operatingHours.length > 0 && (
                <Card className="p-6 sm:p-8">
                  <div className="border-b border-pitstop-border pb-4 mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-pitstop-charcoal flex items-center gap-2">
                        <Clock className="h-5 w-5 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>Operating Hours</span>
                      </h2>
                      <p className="text-xs text-pitstop-muted mt-1">
                        Regular rest-stop access hours for delivery partners.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-pitstop-charcoal border-collapse">
                      <thead>
                        <tr className="border-b border-pitstop-border bg-pitstop-bg/50">
                          <th className="py-2.5 px-3 font-semibold">Day of Week</th>
                          <th className="py-2.5 px-3 font-semibold">Hours</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Access Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitstop-border">
                        {operatingHours.map((schedule) => (
                          <tr key={schedule.day} className="hover:bg-pitstop-bg/40">
                            <td className="py-2.5 px-3 font-medium">
                              {DAY_LABELS[schedule.day] || schedule.day}
                            </td>
                            <td className="py-2.5 px-3 text-pitstop-muted">
                              {schedule.isOpen ? `${schedule.openTime} – ${schedule.closeTime}` : 'Closed'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {schedule.isOpen ? (
                                <span className="font-semibold text-emerald-700">Open</span>
                              ) : (
                                <span className="font-medium text-pitstop-muted">Closed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Location & Address */}
              <Card className="p-6 sm:p-8">
                <div className="border-b border-pitstop-border pb-4 mb-6">
                  <h2 className="text-lg font-bold text-pitstop-charcoal flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-pitstop-yellow-dark" aria-hidden="true" />
                    <span>Location & Address</span>
                  </h2>
                  <p className="text-xs text-pitstop-muted mt-1">
                    Physical location details in {address.city}.
                  </p>
                </div>

                <div className="rounded-lg bg-pitstop-bg p-4 mb-6">
                  <div className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider mb-1">
                    Street Address
                  </div>
                  <p className="text-sm font-medium text-pitstop-charcoal">
                    {address.street}
                  </p>
                  <p className="text-xs text-pitstop-muted mt-0.5">
                    {address.area}, {address.city}, {address.state} — {address.pincode}
                  </p>
                  {address.landmark && (
                    <p className="text-xs text-pitstop-charcoal mt-1">
                      <strong>Landmark:</strong> {address.landmark}
                    </p>
                  )}
                </div>

                {/* Live Venue Map & Directions */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-pitstop-muted font-mono bg-pitstop-bg px-2.5 py-1.5 rounded-md border border-pitstop-border">
                      <Navigation className="h-3.5 w-3.5 text-pitstop-yellow-dark shrink-0" aria-hidden="true" />
                      <span>{stop.location.coordinates[1].toFixed(4)}° N, {stop.location.coordinates[0].toFixed(4)}° E</span>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.location.coordinates[1]},${stop.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-pitstop-charcoal bg-pitstop-yellow hover:bg-pitstop-yellow-dark py-1.5 px-3 rounded-lg shadow-sm transition-all"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Get Directions in Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <RestStopMap
                    stops={[stop]}
                    height="380px"
                    initialZoom={15}
                    showLocateMe={true}
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Capacity Card */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-pitstop-charcoal mb-3">
                  Current Seating Status
                </h3>
                <div className="space-y-3">
                  <div>{getCapacityBadge(capacity.status)}</div>
                  <p className="text-xs text-pitstop-muted">
                    Total rider seating capacity: <strong>{capacity.maxRiders} seats</strong>
                  </p>
                </div>
              </Card>

              {/* Rider Exclusive Deal Card */}
              {dealBadge && (
                <Card className="p-6 border-pitstop-yellow/40 bg-pitstop-yellow-light/40">
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal shrink-0">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pitstop-charcoal/70">
                        Rider Exclusive Perk
                      </span>
                      <h3 className="text-base font-bold text-pitstop-charcoal">
                        {dealBadge}
                      </h3>
                    </div>
                  </div>

                  {dealDescription && (
                    <p className="text-xs text-pitstop-charcoal/80 mb-4 leading-relaxed">
                      {dealDescription}
                    </p>
                  )}

                  <div className="rounded-lg bg-white/80 p-3 text-[11px] text-pitstop-muted border border-pitstop-border/60">
                    <strong>Rider Perk:</strong> Check-in at this rest stop with your rider profile to reveal your merchant coupon code once rider authentication launches.
                  </div>
                </Card>
              )}

              {/* Check-in Desk Section */}
              <RestStopCheckInDesk
                restStopId={stop.id}
                restStopName={name}
                restStopSlug={params.slug}
                coordinates={stop.location?.coordinates}
              />

              {/* Merchant Details Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-pitstop-charcoal">
                    Partner Information
                  </h3>
                </div>
                <div className="text-xs space-y-2 text-pitstop-charcoal">
                  <p>
                    <strong>Business:</strong> {merchantName || 'Local Partner Business'}
                  </p>
                  {venueType && (
                    <p>
                      <strong>Category:</strong> {venueType}
                    </p>
                  )}
                  <p>
                    <strong>City:</strong> {address.city}, {address.state}
                  </p>
                </div>
                <div className="mt-4 border-t border-pitstop-border pt-4 text-[11px] text-pitstop-muted">
                  Partner merchants provide rest-stop amenities to support delivery riders in their local communities.
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </PublicLayout>
  );
}
