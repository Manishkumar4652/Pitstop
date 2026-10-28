'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  MapPin, 
  Tag, 
  Briefcase, 
  Plus, 
  ArrowRight, 
  Info, 
  ChevronRight, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  QrCode,
  Edit3,
  Users
} from 'lucide-react';
import { PublicLayout, MerchantNav } from '@/components/layout';
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Badge 
} from '@/components/ui';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserPublicProfile } from 'shared-types';
import { useLanguage } from '@/lib/i18n';

interface MerchantDashboardContentProps {
  user: UserPublicProfile;
  restStops: any[];
  deals: any[];
  jobs: any[];
}

export const MerchantDashboardContent: React.FC<MerchantDashboardContentProps> = ({
  user,
  restStops,
  deals,
  jobs,
}) => {
  const { isHindi } = useLanguage();
  const profile = user.merchantProfile;

  const activeDealsCount = deals.filter((d: any) => d.isActive).length;
  const openJobsCount = jobs.filter((j: any) => j.status === 'open').length;

  const formattedPhone = user.phone
    ? `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`
    : (isHindi ? 'उपलब्ध नहीं' : 'Not provided');

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : (isHindi ? 'हाल ही में' : 'Recently');

  const businessTypeName = profile?.businessType
    ? profile.businessType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : (isHindi ? 'सामान्य मर्चेंट' : 'General Merchant');

  return (
    <PublicLayout>
      <MerchantNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title={
            profile?.businessName
              ? profile.businessName
              : (isHindi ? `${user.name} का मर्चेंट स्टेशन` : `${user.name}'s Merchant Station`)
          }
          description={
            isHindi
              ? 'अपनी वेरिफाइड रेस्ट-स्टॉप उपस्थिति प्रबंधित करें, सुविधाएं सेट करें और पिटस्टॉप नेटवर्क पर संचालन देखें।'
              : 'Manage your verified rest-stop presence, configure amenities, and review partner operations on the PitStop network.'
          }
          badge={
            user.isVerified
              ? (isHindi ? 'सत्यापित पार्टनर' : 'Verified Partner')
              : (isHindi ? 'सत्यापन प्रगति में' : 'Verification In Progress')
          }
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
                        {user.isVerified
                          ? (isHindi ? 'सत्यापित मर्चेंट' : 'Verified Merchant')
                          : (isHindi ? 'सत्यापन लंबित' : 'Pending Verification')}
                      </Badge>
                      <span className="text-xs bg-pitstop-bg border border-pitstop-border px-2 py-0.5 rounded text-pitstop-muted">
                        {businessTypeName}
                      </span>
                    </div>

                    <p className="text-xs text-pitstop-muted flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{profile?.address || (isHindi ? 'भौतिक वेन्यू पता कॉन्फ़िगर किया गया' : 'Physical venue address configured')}</span>
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
                      <span>{isHindi ? `सदस्य बने: ${memberSince}` : `Member since ${memberSince}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
                  {restStops.length > 0 ? (
                    <Link href="/merchant/rest-stops">
                      <Button variant="primary" size="sm" leftIcon={<QrCode className="h-4 w-4" />}>
                        {isHindi ? 'वेन्यू QR कोड' : 'Venue QR Code'}
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/merchant/rest-stops/new">
                      <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        {isHindi ? 'रेस्ट स्टॉप जोड़ें' : 'Register Rest Stop'}
                      </Button>
                    </Link>
                  )}
                  <Link href="/for-merchants">
                    <Button variant="outline" size="sm">
                      {isHindi ? 'पार्टनर दिशानिर्देश' : 'Partner Guidelines'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Status & Station Scope Notice */}
            <div className="mb-8 rounded-xl border border-pitstop-border bg-pitstop-bg/60 p-4 shadow-subtle flex items-start gap-3">
              <Info className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-pitstop-muted space-y-1">
                <p>
                  <strong>{isHindi ? 'मर्चेंट स्टेशन लाइव:' : 'Merchant Station Live:'}</strong>{' '}
                  {isHindi
                    ? 'रेस्ट स्टॉप वेन्यू प्रबंधन, वेन्यू QR चेक-इन पोस्टर्स, प्रमोशनल राइडर डील्स और ऑफ-पीक माइक्रो-जॉब्स पिटस्टॉप नेटवर्क पर सक्रिय हैं।'
                    : 'Rest stop venue management, cryptographic venue QR check-in posters, promotional rider deals, and off-peak micro-jobs are active on the PitStop network.'}
                </p>
                <p>
                  {isHindi
                    ? 'सीटिंग ऑक्यूपेंसी देखें, काउंटर QR चेक-इन कोड्स रोटेट करें और अपने मर्चेंट पोर्टल से हेल्पर राइडर्स नियुक्त करें।'
                    : 'Review seating occupancy, rotate physical desk QR check-in codes, and recruit helper riders directly from your merchant portal.'}
                </p>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Rest Stops Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      {isHindi ? 'रेस्ट स्टॉप लोकेशन्स' : 'Rest Stop Locations'}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">{restStops.length}</span>
                    <span className="text-xs text-pitstop-muted">
                      {isHindi ? 'पंजीकृत वेन्यू' : 'Registered Venues'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">
                    {restStops.length > 0
                      ? (isHindi ? 'नेटवर्क पर लाइव' : 'Live on Network')
                      : (isHindi ? 'ऑनबोर्डिंग जारी' : 'Onboarding in Phase 6B')}
                  </span>
                  <Link href="/merchant/rest-stops" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    {isHindi ? 'प्रबंधित करें' : 'Manage'} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              {/* Active Deals Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      {isHindi ? 'सक्रिय राइडर डील्स' : 'Active Rider Deals'}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Tag className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">{activeDealsCount}</span>
                    <span className="text-xs text-pitstop-muted">
                      {isHindi ? 'सक्रिय ऑफर्स' : 'Active Offers'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">
                    {activeDealsCount > 0
                      ? (isHindi ? 'कैटलॉग में लाइव' : 'Live in Catalog')
                      : (isHindi ? 'विशेष डील्स बनाएं' : 'Create Special Deals')}
                  </span>
                  <Link href="/merchant/deals" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    {isHindi ? 'डील्स देखें' : 'Manage Deals'} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              {/* Open Micro-Jobs Summary */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pitstop-muted uppercase tracking-wider">
                      {isHindi ? 'खुले माइक्रो-जॉब्स' : 'Open Micro-Jobs'}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-pitstop-charcoal">{openJobsCount}</span>
                    <span className="text-xs text-pitstop-muted">
                      {isHindi ? 'ऑफ-पीक टास्क' : 'Off-Peak Tasks'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pitstop-border flex items-center justify-between">
                  <span className="text-[11px] text-pitstop-muted">
                    {openJobsCount > 0
                      ? (isHindi ? 'आवेदक स्वीकार्य' : 'Accepting Applicants')
                      : (isHindi ? 'हेल्पर राइडर्स नियुक्त करें' : 'Hire Helper Riders')}
                  </span>
                  <Link href="/merchant/jobs" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                    {isHindi ? 'टास्क देखें' : 'Manage Tasks'} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </div>

            {/* My Rest Stops Section */}
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-pitstop-charcoal">
                    {isHindi ? 'मेरे रेस्ट स्टॉप लोकेशन्स' : 'My Rest Stop Locations'}
                  </h2>
                  <p className="text-xs text-pitstop-muted">
                    {isHindi
                      ? 'आपके मर्चेंट खाते द्वारा संचालित और प्रबंधित वेन्यू।'
                      : 'Venues owned and managed by your merchant account.'}
                  </p>
                </div>
                <Link href="/merchant/rest-stops" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark inline-flex items-center gap-1">
                  <span>{isHindi ? 'सभी देखें' : 'View all'}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {restStops.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {restStops.map((venue: any) => (
                    <Card key={venue.id} className="p-5 sm:p-6 shadow-subtle border border-pitstop-border">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-pitstop-charcoal">
                              {venue.name}
                            </h3>
                            <Badge
                              variant={venue.status === 'active' ? 'success' : 'warning'}
                              size="sm"
                              className="capitalize"
                            >
                              {venue.status === 'active'
                                ? (isHindi ? 'लाइव और सक्रिय' : 'Live & Active')
                                : (isHindi ? 'सत्यापन लंबित' : 'Pending Verification')}
                            </Badge>
                          </div>

                          <p className="text-xs text-pitstop-muted flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-pitstop-muted" />
                            <span>
                              {venue.address?.street}, {venue.address?.area}, {venue.address?.city} {venue.address?.pincode}
                            </span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-pitstop-muted pt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {isHindi
                                ? `क्षमता: ${venue.capacity?.maxRiders || 10} राइडर्स`
                                : `Capacity: ${venue.capacity?.maxRiders || 10} riders`}
                            </span>
                            {venue.operatingHours && venue.operatingHours[0] && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {venue.operatingHours[0].openTime} - {venue.operatingHours[0].closeTime}
                              </span>
                            )}
                          </div>

                          {venue.facilities && venue.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {venue.facilities.map((fac: string) => (
                                <span
                                  key={fac}
                                  className="inline-flex items-center rounded-md bg-pitstop-bg border border-pitstop-border px-2 py-0.5 text-[10px] font-medium text-pitstop-charcoal capitalize"
                                >
                                  {fac.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                          <Link href="/merchant/rest-stops">
                            <Button variant="primary" size="sm" leftIcon={<QrCode className="h-4 w-4" />}>
                              {isHindi ? 'डेस्क QR पोस्टर' : 'Desk QR Poster'}
                            </Button>
                          </Link>
                          <Link href="/merchant/rest-stops">
                            <Button variant="outline" size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>
                              {isHindi ? 'वेन्यू प्रबंधित करें' : 'Manage Venue'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-2 border-pitstop-border">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pitstop-bg text-pitstop-muted">
                    <MapPin className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-pitstop-charcoal">
                    {isHindi ? 'अभी कोई रेस्ट स्टॉप पंजीकृत नहीं है' : 'No Rest Stops Registered Yet'}
                  </h3>
                  <p className="mt-1 text-xs text-pitstop-muted max-w-md mx-auto">
                    {isHindi
                      ? 'आपके मर्चेंट पार्टनर खाते में अभी कोई रेस्ट स्टॉप सुविधा सूचीबद्ध नहीं है।'
                      : 'Your merchant partner account currently has no rest stop facilities listed in the database.'}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/merchant/rest-stops/new">
                      <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        {isHindi ? 'रेस्ट स्टॉप जोड़ें' : 'Register Rest Stop'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>

            {/* Deals & Jobs Snapshots */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Deals Snapshot */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      {isHindi ? 'राइडर डील्स प्रबंधक' : 'Rider Deals Manager'}
                    </h3>
                  </div>
                  <Link href="/merchant/deals" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark">
                    {isHindi ? 'डील्स देखें' : 'View Manager'}
                  </Link>
                </div>

                <div className="rounded-lg border border-dashed border-pitstop-border p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-pitstop-charcoal">
                    {isHindi ? 'प्रमोशनल डील्स प्रबंधित करें' : 'Manage Promotional Deals'}
                  </p>
                  <p className="text-[11px] text-pitstop-muted max-w-sm mx-auto">
                    {isHindi
                      ? 'अनुमोदित रेस्ट स्टॉप्स के लिए विशेष छूट (उदा. 50% चाय व समोसा) प्रकाशित करें ताकि आपके प्रतिष्ठान पर डिलीवरी राइडर्स आएं।'
                      : 'Publish exclusive discounts (e.g. 50% Chai & Samosa) for approved rest stops to drive gig rider footfall to your venue.'}
                  </p>
                  <div className="pt-2">
                    <Link href="/merchant/deals">
                      <Button variant="primary" size="sm">
                        {isHindi ? 'डील्स प्रबंधित करें' : 'Manage Deals'}
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
                      {isHindi ? 'माइक्रो-जॉब्स मार्केटप्लेस' : 'Micro-Jobs Marketplace'}
                    </h3>
                  </div>
                  <Link href="/merchant/jobs" className="text-xs font-semibold text-pitstop-charcoal hover:text-pitstop-yellow-dark">
                    {isHindi ? 'मार्केटप्लेस देखें' : 'View Marketplace'}
                  </Link>
                </div>

                <div className="rounded-lg border border-dashed border-pitstop-border p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-pitstop-charcoal">
                    {openJobsCount > 0
                      ? (isHindi
                          ? `${openJobsCount} खुले हेल्पर टास्क सक्रिय`
                          : `${openJobsCount} Open Helper Task${openJobsCount === 1 ? '' : 's'} Active`)
                      : (isHindi ? 'कोई खुला टास्क पोस्ट नहीं किया गया' : 'No Open Helper Tasks Posted')}
                  </p>
                  <p className="text-[11px] text-pitstop-muted max-w-sm mx-auto">
                    {openJobsCount > 0
                      ? (isHindi
                          ? 'पिटस्टॉप प्लेटफॉर्म पर राइडर्स आपके टास्क खोज रहे हैं। आने वाले आवेदनों की समीक्षा करें और राइडर्स चुनें।'
                          : 'Riders on the PitStop platform are discovering your tasks. Review incoming applications and select workers.')
                      : (isHindi
                          ? 'दोपहर के धीमे घंटों में त्वरित 1-घंटे के हेल्पर टास्क (सॉर्टिंग, लोडिंग, तैयारी) के लिए विश्वसनीय डिलीवरी राइडर्स को नियुक्त करें।'
                          : 'Hire reliable delivery riders for quick 1-hour helper tasks (sorting, loading, prep) during slow afternoon hours.')}
                  </p>
                  <div className="pt-2">
                    <Link href="/merchant/jobs">
                      <Button variant={openJobsCount > 0 ? 'primary' : 'outline'} size="sm">
                        {openJobsCount > 0
                          ? (isHindi ? 'टास्क व आवेदक प्रबंधित करें' : 'Manage Tasks & Applicants')
                          : (isHindi ? 'माइक्रो-जॉब पोस्ट करें' : 'Post Micro-Job')}
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
};
