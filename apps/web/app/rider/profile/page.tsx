import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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
  ChevronRight
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
import { getServerSession } from '@/lib/auth/server-session';
import { LogoutButton } from '@/components/auth/LogoutButton';

export const metadata: Metadata = {
  title: 'Rider Profile & Account — PitStop',
  description:
    'Rider profile, work platform associations, vehicle registration, and activity details for authenticated delivery partners.',
};

export default async function RiderProfilePage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/rider/login?returnUrl=/rider/profile');
  }
  if (session.role === 'merchant') {
    redirect('/merchant');
  }

  const initials = session.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'RP';

  const formattedPhone = session.phone
    ? `+91 ${session.phone.slice(0, 5)} ${session.phone.slice(5)}`
    : 'Not provided';

  const platformName = session.riderProfile?.platform
    ? session.riderProfile.platform.charAt(0).toUpperCase() + session.riderProfile.platform.slice(1)
    : 'Independent';

  const vehicleTypeName = session.riderProfile?.vehicleType
    ? session.riderProfile.vehicleType
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Two-Wheeler';

  const memberSince = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Member';

  return (
    <PublicLayout>
      <RiderNav />

      <main id="main-content" className="pb-20 md:pb-12">
        <PageHeader
          title="Rider Profile & Account"
          description="Manage your delivery partner account, vehicle details, platform associations, and saved preferences."
          badge="Rider Account"
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
                          {session.name}
                        </h2>
                        <Badge variant="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>
                          Active Rider
                        </Badge>
                      </div>
                      <p className="text-xs text-pitstop-muted mt-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{formattedPhone}</span>
                      </p>
                      {session.email && (
                        <p className="text-xs text-pitstop-muted mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{session.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-pitstop-charcoal">
                    {/* Primary Network */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        Delivery Network
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Briefcase className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>{platformName} Delivery Partner</span>
                      </div>
                    </div>

                    {/* Delivery Vehicle */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        Vehicle Type
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Bike className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>{vehicleTypeName}</span>
                      </div>
                    </div>

                    {/* Vehicle Registration Number */}
                    {session.riderProfile?.vehicleNumber && (
                      <div>
                        <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                          Vehicle Registration
                        </span>
                        <div className="mt-1 font-mono font-bold text-pitstop-charcoal">
                          {session.riderProfile.vehicleNumber}
                        </div>
                      </div>
                    )}

                    {/* Account Joined Date */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        Member Since
                      </span>
                      <div className="mt-1 flex items-center gap-2 text-pitstop-muted font-medium">
                        <Calendar className="h-4 w-4 text-pitstop-muted" aria-hidden="true" />
                        <span>{memberSince}</span>
                      </div>
                    </div>

                    {/* Preferred Break Hours */}
                    <div>
                      <span className="text-pitstop-muted block uppercase tracking-wider text-[10px] font-bold">
                        Recommended Break Window
                      </span>
                      <div className="mt-1 flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                        <span>Afternoon Off-Peak (2:00 PM – 5:00 PM)</span>
                      </div>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <div className="mt-6 border-t border-pitstop-border pt-4">
                    <LogoutButton fullWidth variant="outline" size="sm" />
                  </div>
                </Card>

                {/* Quick Navigation Card */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-pitstop-charcoal mb-3">
                    Portal Navigation
                  </h3>
                  <div className="space-y-2">
                    <Link href="/explore" className="block">
                      <Button variant="primary" fullWidth size="sm" leftIcon={<Compass className="h-4 w-4" />}>
                        Explore Rest Stops
                      </Button>
                    </Link>
                    <Link href="/jobs" className="block">
                      <Button variant="outline" fullWidth size="sm" leftIcon={<Briefcase className="h-4 w-4" />}>
                        Browse Micro-Jobs
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
                        Bookmarked Rest Stops
                      </h3>
                    </div>
                    <Badge variant="neutral" size="sm">0 Saved</Badge>
                  </div>

                  <EmptyState
                    title="No Saved Stops Yet"
                    description="Bookmark your frequent rest stops along your regular delivery routes for quick 1-tap navigation. Bookmarking will link to your account in Phase 5B."
                    icon={<Bookmark className="h-6 w-6 text-pitstop-muted" aria-hidden="true" />}
                    action={
                      <Link href="/explore">
                        <Button variant="primary" size="sm" leftIcon={<Compass className="h-3.5 w-3.5" />}>
                          Find Rest Stops
                        </Button>
                      </Link>
                    }
                  />
                </Card>

                {/* Check-In History */}
                <Card className="p-6">
                  <div className="flex items-center justify-between border-b border-pitstop-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-pitstop-yellow-dark" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-pitstop-charcoal">
                        Verified Rest Check-Ins
                      </h3>
                    </div>
                    <Badge variant="neutral" size="sm">0 Visits</Badge>
                  </div>

                  <EmptyState
                    title="No Check-In Activity"
                    description="Check in at partner merchant rest stops to unlock free drinking water, device charging desks, and exclusive meal discounts. Mobile QR check-in desk launches in Phase 5B."
                    icon={<QrCode className="h-6 w-6 text-pitstop-muted" aria-hidden="true" />}
                    action={
                      <Link href="/how-it-works">
                        <Button variant="outline" size="sm" leftIcon={<Info className="h-3.5 w-3.5" />}>
                          Learn How Check-Ins Work
                        </Button>
                      </Link>
                    }
                  />
                </Card>

                {/* Account Security Information Card */}
                <Card className="p-6 bg-pitstop-bg border border-pitstop-border">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-pitstop-charcoal">
                      Account Security & Privacy
                    </h3>
                  </div>
                  <p className="text-xs text-pitstop-muted leading-relaxed">
                    Your PitStop session is authenticated via secure HttpOnly cookies. Passwords and JWT tokens are never accessible to client scripts or browser storage, protecting your account against XSS and session interception.
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PublicLayout>
  );
}
