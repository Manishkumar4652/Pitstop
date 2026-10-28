'use client';

import React from 'react';
import Link from 'next/link';
import { 
  User, 
  Bike, 
  MapPin, 
  Phone,
  Mail,
  Calendar,
  Compass, 
  LayoutDashboard, 
  Briefcase, 
  QrCode, 
  Bookmark, 
  Clock, 
  Info,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Globe,
  FileText
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
import { LogoutButton } from '@/components/auth/LogoutButton';
import { RiderCheckInSection } from '@/components/rider/RiderCheckInSection';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useLanguage } from '@/lib/i18n';
import { UserPublicProfile } from 'shared-types';

export interface RiderProfileContentProps {
  user: UserPublicProfile;
}

export const RiderProfileContent: React.FC<RiderProfileContentProps> = ({ user }) => {
  const { t, isHindi, language } = useLanguage();

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'RP';

  const formattedPhone = user.phone
    ? `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`
    : t('profile.phoneNotProvided');

  // Platform localization
  const rawPlatform = user.riderProfile?.platform || 'other';
  const platformNameMap: Record<string, { en: string; hi: string }> = {
    zomato: { en: 'Zomato', hi: 'जोमैटो' },
    swiggy: { en: 'Swiggy', hi: 'स्विगी' },
    blinkit: { en: 'Blinkit', hi: 'ब्लिंकिट' },
    zepto: { en: 'Zepto', hi: 'ज़ेप्टो' },
    uber: { en: 'Uber', hi: 'उबर' },
    ola: { en: 'Ola', hi: 'ओला' },
    rapido: { en: 'Rapido', hi: 'रैपिडो' },
    other: { en: 'Independent', hi: 'स्वतंत्र' },
  };
  const platformName = isHindi
    ? platformNameMap[rawPlatform]?.hi || rawPlatform
    : platformNameMap[rawPlatform]?.en || rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);

  // Vehicle type localization
  const rawVehicleType = user.riderProfile?.vehicleType || '2-wheeler-petrol';
  const vehicleTypeMap: Record<string, { en: string; hi: string }> = {
    '2-wheeler-ev': { en: 'Electric Two-Wheeler (EV)', hi: 'इलेक्ट्रिक 2-व्हीलर (EV)' },
    '2-wheeler-petrol': { en: 'Two-Wheeler (Petrol Bike / Scooter)', hi: 'पेट्रोल दोपहिया (बाइक / स्कूटर)' },
    bicycle: { en: 'Bicycle', hi: 'साइकिल' },
    auto: { en: 'Auto Rickshaw', hi: 'ऑटो रिक्शा' },
    car: { en: 'Car / Cab', hi: 'कार / कैब' },
  };
  const vehicleTypeName = isHindi
    ? vehicleTypeMap[rawVehicleType]?.hi || 'दोपहिया'
    : vehicleTypeMap[rawVehicleType]?.en || 'Two-Wheeler';

  // Member date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : t('profile.recentMember');

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-24 md:pb-12">
        <PageHeader
          title={t('profile.title')}
          description={t('profile.description')}
          badge={t('profile.badge')}
          backHref="/explore"
        />

        <section className="py-6 sm:py-8" aria-label="Rider profile details">
          <Container size="xl">
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Column: Profile Card & Preferences (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Profile Summary Card */}
                <Card className="p-6">
                  <div className="flex items-start gap-4 border-b border-pitstop-border pb-5 mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold text-lg shadow-subtle shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-pitstop-charcoal truncate">
                          {user.name}
                        </h2>
                        <Badge variant="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>
                          {t('profile.activeRider')}
                        </Badge>
                      </div>
                      <p className="text-xs text-pitstop-muted mt-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{formattedPhone}</span>
                      </p>
                      {user.email && (
                        <p className="text-xs text-pitstop-muted mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-pitstop-charcoal">
                    {/* Primary Network */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        {t('profile.deliveryNetwork')}
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Briefcase className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>
                          {t('profile.deliveryPartner', { platform: platformName })}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Vehicle */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        {t('profile.vehicleType')}
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Bike className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>{vehicleTypeName}</span>
                      </div>
                    </div>

                    {/* Vehicle Registration Number */}
                    {user.riderProfile?.vehicleNumber && (
                      <div>
                        <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                          {t('profile.vehicleRegistration')}
                        </span>
                        <div className="mt-1 font-mono font-bold text-pitstop-charcoal">
                          {user.riderProfile.vehicleNumber}
                        </div>
                      </div>
                    )}

                    {/* Account Joined Date */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        {t('profile.memberSince')}
                      </span>
                      <div className="mt-1 flex items-center gap-2 text-pitstop-muted font-medium">
                        <Calendar className="h-4 w-4 text-pitstop-muted" aria-hidden="true" />
                        <span>{memberSince}</span>
                      </div>
                    </div>

                    {/* Preferred Break Hours */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        {t('profile.breakWindow')}
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>{t('profile.breakWindowTime')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <div className="mt-6 border-t border-pitstop-border pt-4">
                    <LogoutButton fullWidth variant="outline" size="sm" />
                  </div>
                </Card>

                {/* Dedicated Language Preference Card */}
                <Card className="p-6">
                  <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-pitstop-charcoal">
                        {t('profile.languagePreference')}
                      </h3>
                    </div>
                    <Badge variant={isHindi ? 'yellow' : 'neutral'} size="sm">
                      {isHindi ? 'हिंदी सक्रिय' : 'English Active'}
                    </Badge>
                  </div>

                  <p className="text-xs text-pitstop-muted mb-4 leading-relaxed">
                    {t('profile.languagePreferenceDesc')}
                  </p>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-pitstop-bg border border-pitstop-border">
                    <span className="text-xs font-semibold text-pitstop-charcoal">
                      {t('footer.selectLanguage')}
                    </span>
                    <LanguageToggle size="md" isDark={false} />
                  </div>
                </Card>

                {/* Quick Navigation Card */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-pitstop-charcoal mb-3">
                    {t('profile.portalNavigation')}
                  </h3>
                  <div className="space-y-2">
                    <Link href="/explore" className="block">
                      <Button variant="primary" fullWidth size="sm" leftIcon={<Compass className="h-4 w-4" />}>
                        {t('profile.exploreRestStops')}
                      </Button>
                    </Link>
                    <Link href="/jobs" className="block">
                      <Button variant="outline" fullWidth size="sm" leftIcon={<Briefcase className="h-4 w-4" />}>
                        {t('profile.browseJobs')}
                      </Button>
                    </Link>
                    <Link href="/rider/applications" className="block">
                      <Button variant="outline" fullWidth size="sm" leftIcon={<FileText className="h-4 w-4" />}>
                        {t('profile.myApplications')}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Right Column: Activity Logs & Saved Stops (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Saved Rest Stops */}
                <Card className="p-6">
                  <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-pitstop-charcoal">
                        {t('profile.bookmarkedStops')}
                      </h3>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {t('profile.savedCount', { count: 0 })}
                    </Badge>
                  </div>

                  <EmptyState
                    title={t('profile.noSavedTitle')}
                    description={t('profile.noSavedDesc')}
                    icon={<Bookmark className="h-6 w-6 text-pitstop-muted" aria-hidden="true" />}
                    action={
                      <Link href="/explore">
                        <Button variant="primary" size="sm" leftIcon={<Compass className="h-3.5 w-3.5" />}>
                          {t('profile.findRestStops')}
                        </Button>
                      </Link>
                    }
                  />
                </Card>

                {/* Live Check-In Activity & QR Scanner */}
                <RiderCheckInSection />

                {/* Account Security Information Card */}
                <Card className="p-6 bg-pitstop-bg border border-pitstop-border">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      {t('profile.accountSecurity')}
                    </h3>
                  </div>
                  <p className="text-xs text-pitstop-muted leading-relaxed">
                    {t('profile.accountSecurityDesc')}
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
};

