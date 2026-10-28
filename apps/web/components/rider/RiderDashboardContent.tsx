'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bike, 
  Compass, 
  Briefcase, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Store,
  Droplet,
  Zap,
  Bath,
  Armchair,
  Wifi,
  SquareParking
} from 'lucide-react';
import { PublicLayout, RiderNav } from '@/components/layout';
import { Container, PageHeader, Button, Badge, EmptyState } from '@/components/ui';
import { RestStopCard } from '@/components/rest-stops/RestStopCard';
import { RiderCheckInSection } from '@/components/rider/RiderCheckInSection';
import { RestStopDisplayItem } from '@/lib/api/rest-stops';
import { UserPublicProfile, Facility } from 'shared-types';
import { useLanguage } from '@/lib/i18n';

interface RiderDashboardContentProps {
  user: UserPublicProfile;
  recommendedStops: RestStopDisplayItem[];
}

export const RiderDashboardContent: React.FC<RiderDashboardContentProps> = ({
  user,
  recommendedStops,
}) => {
  const { t, isHindi } = useLanguage();

  const facilityShortcuts = [
    {
      facility: Facility.DRINKING_WATER,
      label: isHindi ? 'RO पानी' : 'RO Water',
      description: isHindi ? 'ठंडा पीने का पानी रिफिल' : 'Chilled drinking water refills',
      icon: <Droplet className="h-5 w-5 text-blue-600" />,
      href: '/explore?facility=drinking_water',
    },
    {
      facility: Facility.CHARGING,
      label: isHindi ? 'चार्जिंग' : 'Charging',
      description: isHindi ? 'फास्ट मोबाइल चार्जिंग पॉइंट्स' : 'Fast mobile charging points',
      icon: <Zap className="h-5 w-5 text-amber-600" />,
      href: '/explore?facility=charging',
    },
    {
      facility: Facility.RESTROOM,
      label: isHindi ? 'वॉशरूम' : 'Washroom',
      description: isHindi ? 'साफ एवं स्वच्छ शौचालय' : 'Hygienic, clean restrooms',
      icon: <Bath className="h-5 w-5 text-emerald-600" />,
      href: '/explore?facility=restroom',
    },
    {
      facility: Facility.SEATING,
      label: isHindi ? 'बैठने की जगह' : 'Seating',
      description: isHindi ? 'आरामदायक इनडोर सीटिंग' : 'Comfortable indoor seating',
      icon: <Armchair className="h-5 w-5 text-indigo-600" />,
      href: '/explore?facility=seating',
    },
    {
      facility: Facility.WIFI,
      label: isHindi ? 'फ्री वाई-फाई' : 'Free Wi-Fi',
      description: isHindi ? 'हाई-स्पीड इंटरनेट' : 'High-speed internet access',
      icon: <Wifi className="h-5 w-5 text-purple-600" />,
      href: '/explore?facility=wifi',
    },
    {
      facility: Facility.PARKING,
      label: isHindi ? 'बाइक पार्किंग' : 'Bike Parking',
      description: isHindi ? 'सुरक्षित 2-व्हीलर पार्किंग' : 'Safe two-wheeler parking spots',
      icon: <SquareParking className="h-5 w-5 text-rose-600" />,
      href: '/explore?facility=parking',
    },
  ];

  const riderFirstName = user.name?.split(' ')[0] || (isHindi ? 'राइडर' : 'Rider');

  return (
    <PublicLayout>
      <RiderNav />

      <main className="flex-1 pb-24 md:pb-16 bg-pitstop-bg">
        <PageHeader
          title={`${t('riderDashboard.welcomeBack', { name: riderFirstName })} 🛵`}
          badge={t('riderDashboard.activeBadge')}
          description={t('riderDashboard.subtitle')}
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/explore">
                <Button variant="primary" size="md" leftIcon={<Compass className="h-4 w-4" />}>
                  {t('riderDashboard.exploreMap')}
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" size="md" leftIcon={<Briefcase className="h-4 w-4" />}>
                  {t('riderDashboard.browseJobs')}
                </Button>
              </Link>
            </div>
          }
        />

        <section className="py-6 sm:py-8" aria-label="Rider hub overview">
          <Container size="xl">
            {/* Quick Hero Banner */}
            <div className="mb-8 rounded-2xl border border-pitstop-border bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-pitstop-yellow-light border border-pitstop-yellow/50 px-3 py-1 text-xs font-bold text-pitstop-charcoal">
                  <Sparkles className="h-3.5 w-3.5 text-pitstop-yellow-dark" aria-hidden="true" />
                  <span>{isHindi ? 'हर राइडर का हक है आराम का स्थान' : 'Every rider deserves a place to stop'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-pitstop-charcoal tracking-tight">
                  {t('riderDashboard.breatherTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-pitstop-muted leading-relaxed">
                  {t('riderDashboard.breatherDesc')}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <Link href="/explore" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" fullWidth leftIcon={<Compass className="h-4 w-4" />}>
                    {t('riderDashboard.findNearest')}
                  </Button>
                </Link>
                <Link href="/rider/applications" className="w-full sm:w-auto">
                  <Button variant="outline" size="md" fullWidth leftIcon={<FileText className="h-4 w-4" />}>
                    {t('riderDashboard.myShifts')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Facility Amenities Grid */}
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-pitstop-charcoal">
                    {t('riderDashboard.quickAmenities')}
                  </h2>
                  <p className="text-xs text-pitstop-muted">
                    {t('riderDashboard.quickAmenitiesDesc')}
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1"
                >
                  <span>{isHindi ? 'सभी स्टॉप्स' : 'All stops'}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" role="list">
                {facilityShortcuts.map((item) => (
                  <Link
                    key={item.facility}
                    href={item.href}
                    className="group rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle hover:border-pitstop-yellow hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[110px]"
                  >
                    <div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pitstop-bg group-hover:bg-pitstop-yellow-light transition-colors mb-2.5">
                        {item.icon}
                      </div>
                      <h3 className="text-xs font-bold text-pitstop-charcoal">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-pitstop-muted line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-pitstop-yellow-dark flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>{isHindi ? 'देखें' : 'Explore'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Two-Column Layout: Recommended Stops + Live Check-In Activity */}
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Column (7 cols): Recommended Verified Stops */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-pitstop-charcoal">
                      {isHindi ? 'सुझाए गए रेस्ट स्टॉप्स' : 'Recommended Rest Stops'}
                    </h2>
                    <p className="text-xs text-pitstop-muted">
                      {isHindi
                        ? 'बेंगलुरु के सबसे लोकप्रिय और वेरिफाइड रेस्ट स्टॉप्स।'
                        : 'Highest rated stops in Bengaluru with verified amenities and rider perks.'}
                    </p>
                  </div>
                  <Link
                    href="/explore"
                    className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1"
                  >
                    <span>{isHindi ? 'सभी देखें' : 'View all'}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {recommendedStops.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                    {recommendedStops.map((stop) => (
                      <RestStopCard key={stop.id} stop={stop} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Store className="h-8 w-8 text-pitstop-muted" />}
                    title={isHindi ? 'कोई रेस्ट स्टॉप नहीं मिला' : 'No active rest stops found'}
                    description={
                      isHindi
                        ? 'जब पार्टनर मर्चेंट्स नए स्टॉप्स जोड़ेंगे तो वे यहां दिखेंगे।'
                        : 'When partner merchants register rest stops and get approved, they will appear right here.'
                    }
                    action={
                      <Link href="/explore">
                        <Button variant="primary" size="sm">
                          {isHindi ? 'सभी लोकेशन्स देखें' : 'Browse All Locations'}
                        </Button>
                      </Link>
                    }
                  />
                )}
              </div>

              {/* Right Column (5 cols): Live Check-In Station Card */}
              <div className="lg:col-span-5 space-y-6">
                <RiderCheckInSection />
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
};
