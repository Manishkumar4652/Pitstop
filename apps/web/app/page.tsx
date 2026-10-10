import Link from 'next/link';
import { 
  Droplet, 
  BatteryCharging, 
  Armchair, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  QrCode, 
  ChevronRight,
  Store,
  Navigation
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-pitstop-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded-md p-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal font-bold shadow-subtle">
              <Navigation className="h-6 w-6 fill-pitstop-charcoal stroke-pitstop-charcoal" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-pitstop-charcoal">PitStop</span>
              <span className="hidden text-[10px] font-medium text-pitstop-muted sm:inline-block">For Delivery & Ride Gig Workers</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/explore" className="text-sm font-medium text-pitstop-charcoal hover:text-pitstop-yellow-dark transition-colors">
              Explore Rest Stops
            </Link>
            <Link href="/jobs" className="text-sm font-medium text-pitstop-charcoal hover:text-pitstop-yellow-dark transition-colors">
              Micro-Jobs
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-pitstop-muted hover:text-pitstop-charcoal transition-colors">
              How It Works
            </Link>
            <Link href="/for-merchants" className="text-sm font-medium text-pitstop-muted hover:text-pitstop-charcoal transition-colors">
              For Merchants
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/for-merchants"
              className="hidden rounded-lg border border-pitstop-border px-3.5 py-2 text-sm font-medium text-pitstop-charcoal hover:bg-pitstop-bg sm:inline-block focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            >
              Merchant Partner
            </Link>
            <Link
              href="/rider/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-pitstop-yellow px-4 py-2 text-sm font-semibold text-pitstop-charcoal shadow-subtle hover:bg-pitstop-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow focus:ring-offset-2"
            >
              Rider Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="border-b border-pitstop-border bg-gradient-to-b from-white via-white to-pitstop-bg px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pitstop-yellow/30 bg-pitstop-yellow-light px-3.5 py-1.5 text-xs font-semibold text-pitstop-charcoal">
              <Sparkles className="h-3.5 w-3.5 text-pitstop-yellow-dark" />
              <span>Dedicated Rest Facilities for India&apos;s Gig Economy</span>
            </div>

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
              <Link
                href="/explore"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-pitstop-yellow px-6 py-3 text-base font-bold text-pitstop-charcoal shadow-card hover:bg-pitstop-yellow-dark transition-all sm:w-auto focus:outline-none focus:ring-2 focus:ring-pitstop-yellow focus:ring-offset-2"
              >
                <MapPin className="h-5 w-5" />
                <span>Find Nearby Rest Stops</span>
              </Link>

              <Link
                href="/for-merchants"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-pitstop-border bg-white px-6 py-3 text-base font-semibold text-pitstop-charcoal shadow-subtle hover:bg-pitstop-bg transition-all sm:w-auto focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
              >
                <Store className="h-5 w-5 text-pitstop-muted" />
                <span>Become a Partner Merchant</span>
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
          </div>
        </section>

        {/* Core Benefits Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl">
                Built for Delivery & Ride-Hailing Champions
              </h2>
              <p className="mt-2 text-sm text-pitstop-muted sm:text-base">
                Whether you ride for Zomato, Swiggy, Blinkit, Zepto, Uber, Ola, or Rapido — PitStop is your sanctuary on shift.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Feature 1 */}
              <div className="flex flex-col justify-between rounded-xl border border-pitstop-border bg-white p-6 shadow-subtle hover:shadow-card transition-shadow">
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
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col justify-between rounded-xl border border-pitstop-border bg-white p-6 shadow-subtle hover:shadow-card transition-shadow">
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
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col justify-between rounded-xl border border-pitstop-border bg-white p-6 shadow-subtle hover:shadow-card transition-shadow">
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
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col justify-between rounded-xl border border-pitstop-border bg-white p-6 shadow-subtle hover:shadow-card transition-shadow">
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
              </div>
            </div>
          </div>
        </section>

        {/* Merchant Banner Section */}
        <section className="border-t border-pitstop-border bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl bg-pitstop-bg border border-pitstop-border p-6 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold text-pitstop-charcoal sm:text-2xl">Own a restaurant, cafe, or shop?</h3>
                <p className="mt-2 max-w-2xl text-sm text-pitstop-muted">
                  Become a verified PitStop partner merchant. Drive steady foot traffic during off-peak hours and hire reliable gig workers for short-term tasks.
                </p>
              </div>
              <Link
                href="/for-merchants"
                className="inline-flex min-h-[44px] whitespace-nowrap rounded-lg bg-pitstop-yellow px-5 py-2.5 text-sm font-bold text-pitstop-charcoal shadow-subtle hover:bg-pitstop-yellow-dark transition-colors"
              >
                Register as Merchant
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-pitstop-border bg-white text-sm text-pitstop-muted">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-bold text-pitstop-charcoal">PitStop</span>
              <span>— &quot;Every rider deserves a place to stop.&quot;</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs text-pitstop-muted">
              <Link href="/privacy" className="hover:text-pitstop-charcoal">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-pitstop-charcoal">Terms of Service</Link>
              <Link href="/contact" className="hover:text-pitstop-charcoal">Contact Support</Link>
              <Link href="/about" className="hover:text-pitstop-charcoal">About Us</Link>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-pitstop-muted">
            &copy; {new Date().getFullYear()} PitStop Platform. Built for India&apos;s gig workers and local merchants.
          </div>
        </div>
      </footer>
    </div>
  );
}
