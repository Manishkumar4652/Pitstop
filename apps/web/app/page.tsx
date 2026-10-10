import Link from 'next/link';
import { 
  Droplet, 
  Briefcase, 
  ShieldCheck, 
  QrCode, 
  ChevronRight,
  Store,
  MapPin,
  Sparkles
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Button, Container, Card, Badge } from '@/components/ui';

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="border-b border-pitstop-border bg-gradient-to-b from-white via-white to-pitstop-bg px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <Container size="md" className="text-center">
          <Badge variant="yellow" icon={<Sparkles className="h-3.5 w-3.5 text-pitstop-yellow-dark" />} className="mb-4">
            Dedicated Rest Facilities for India&apos;s Gig Economy
          </Badge>

          <h1 className="text-3xl font-extrabold tracking-tight text-pitstop-charcoal sm:text-5xl lg:text-6xl">
            Every rider deserves <br className="hidden sm:inline" />
            <span className="relative inline-block px-2">
              <span className="relative z-10">a place to stop.</span>
              <span className="absolute inset-x-0 bottom-1.5 h-3 bg-pitstop-yellow/60 -z-0 rounded-sm"></span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-pitstop-muted sm:text-lg">
            Find verified rest stops with clean drinking water, comfortable seating, fast phone charging, restrooms, and exclusive food offers — plus local paid micro-jobs during off-peak hours.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/explore" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" fullWidth leftIcon={<MapPin className="h-5 w-5" />}>
                Find Nearby Rest Stops
              </Button>
            </Link>

            <Link href="/for-merchants" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth leftIcon={<Store className="h-5 w-5 text-pitstop-muted" />}>
                Become a Partner Merchant
              </Button>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-12 grid grid-cols-2 gap-4 rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle sm:grid-cols-4 sm:p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">Free</div>
              <div className="text-xs text-pitstop-muted">Drinking Water</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">Fast</div>
              <div className="text-xs text-pitstop-muted">Phone Charging</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">50%+</div>
              <div className="text-xs text-pitstop-muted">Food Discounts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pitstop-charcoal sm:text-3xl">Off-Peak</div>
              <div className="text-xs text-pitstop-muted">Paid Micro-Jobs</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Core Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <Container size="xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl">
              Built for Delivery &amp; Ride-Hailing Champions
            </h2>
            <p className="mt-2 text-sm text-pitstop-muted sm:text-base">
              Whether you ride for Zomato, Swiggy, Blinkit, Zepto, Uber, Ola, or Rapido — PitStop is your sanctuary on shift.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark">
                  <Droplet className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-pitstop-charcoal">Verified Rest Facilities</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Filter by clean drinking water, comfortable seating, fast battery charging, restrooms, and shade.
                </p>
              </div>
              <Link href="/explore" className="mt-4 inline-flex items-center text-xs font-semibold text-pitstop-charcoal hover:underline">
                Browse amenities <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            {/* Feature 2 */}
            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-pitstop-charcoal">Merchant Food Deals</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Enjoy exclusive discounts on chai, snacks, and meals at local partner restaurants and tea stalls.
                </p>
              </div>
              <Link href="/explore" className="mt-4 inline-flex items-center text-xs font-semibold text-pitstop-charcoal hover:underline">
                View rider deals <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            {/* Feature 3 */}
            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-pitstop-charcoal">Off-Peak Micro-Jobs</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Earn extra income during quiet afternoon hours (2 PM – 5 PM) with short-term paid helper tasks.
                </p>
              </div>
              <Link href="/jobs" className="mt-4 inline-flex items-center text-xs font-semibold text-pitstop-charcoal hover:underline">
                Search job board <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            {/* Feature 4 */}
            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pitstop-yellow-light text-pitstop-yellow-dark">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-pitstop-charcoal">Instant QR Check-Ins</h3>
                <p className="mt-2 text-sm text-pitstop-muted">
                  Quick OTP or QR scan check-in confirms your rest stop visit and instantly unlocks special perks.
                </p>
              </div>
              <Link href="/how-it-works" className="mt-4 inline-flex items-center text-xs font-semibold text-pitstop-charcoal hover:underline">
                Learn how it works <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </div>
        </Container>
      </section>

      {/* Merchant Banner Section */}
      <section className="border-t border-pitstop-border bg-white px-4 py-12 sm:px-6 lg:px-8">
        <Container size="xl">
          <div className="rounded-2xl bg-pitstop-bg border border-pitstop-border p-6 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold text-pitstop-charcoal sm:text-2xl">Own a restaurant, cafe, or shop?</h3>
                <p className="mt-2 max-w-2xl text-sm text-pitstop-muted">
                  Become a verified PitStop partner merchant. Drive steady foot traffic during off-peak hours and hire reliable gig workers for short-term tasks.
                </p>
              </div>
              <Link href="/for-merchants" className="whitespace-nowrap">
                <Button variant="primary" size="md">
                  Register as Merchant
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
