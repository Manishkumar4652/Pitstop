import React from 'react';
import Link from 'next/link';
import {
  Droplet,
  Briefcase,
  ShieldCheck,
  QrCode,
  Store,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Zap,
  Coffee,
  Users,
  Navigation
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { fetchPublicPlatformStats } from '@/lib/api/public-stats';

function formatStatCount(count: number): string {
  if (count >= 1000) {
    return `${count.toLocaleString('en-IN')}+`;
  }
  if (count >= 50) {
    return `${count}+`;
  }
  return `${count}`;
}

export default async function HomePage() {
  const stats = await fetchPublicPlatformStats();

  return (
    <PublicLayout theme="dark">
      {/* ──────────────────────────────────────────────────────────────────────────
          HERO SECTION — Recreating Landingpage.png Fluid Liquid Waves & Diagonal Beams
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] lg:min-h-[88vh] overflow-hidden bg-[#12131C] px-4 py-16 sm:px-6 lg:px-8 flex items-center">
        
        {/* ── BACKGROUND FLUID ARTWORK (Landingpage.png Reproduction in Pure CSS/SVG) ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
          
          {/* Top-Right Yellow Organic Wave */}
          <div className="absolute -top-16 -right-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[480px] lg:w-[480px]">
            <svg viewBox="0 0 500 500" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M320,0 C420,40 500,140 500,260 C500,380 430,420 380,360 C320,290 350,180 270,120 C210,75 220,20 320,0 Z" 
                fill="url(#topRightYellowGrad)" 
              />
              <defs>
                <linearGradient id="topRightYellowGrad" x1="500" y1="0" x2="250" y2="400" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFC107" />
                  <stop offset="0.6" stopColor="#F7B928" />
                  <stop offset="1" stopColor="#FFA000" />
                </linearGradient>
              </defs>
            </svg>
            {/* Top-Right Capsule Beam */}
            <div className="absolute top-16 right-24 h-48 w-14 -rotate-45 rounded-full bg-white/20 blur-[1px]"></div>
          </div>

          {/* Bottom-Left Massive Organic Fluid Wave */}
          <div className="absolute -bottom-24 -left-20 h-[420px] w-[420px] sm:h-[540px] sm:w-[540px] lg:h-[680px] lg:w-[680px]">
            <svg viewBox="0 0 600 600" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M0,280 C60,200 140,220 180,300 C240,420 320,440 380,520 C420,580 340,600 0,600 Z" 
                fill="url(#bottomLeftYellowGrad)" 
              />
              <defs>
                <linearGradient id="bottomLeftYellowGrad" x1="0" y1="200" x2="400" y2="600" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F7B928" />
                  <stop offset="0.5" stopColor="#FFB300" />
                  <stop offset="1" stopColor="#FF8F00" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Embedded Capsule Beams Inside Bottom-Left Wave (As in Landingpage.png) */}
            <div className="absolute bottom-28 left-20 h-64 w-16 -rotate-45 rounded-full bg-white/25"></div>
            <div className="absolute bottom-40 left-44 h-48 w-12 -rotate-45 rounded-full bg-amber-200/30"></div>
          </div>

          {/* Bottom-Right Curved Yellow Edge */}
          <div className="absolute -bottom-24 -right-20 h-72 w-72 sm:h-96 sm:w-96 lg:h-[440px] lg:w-[440px]">
            <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M400,160 C340,200 320,290 340,360 C350,390 380,400 400,400 Z" 
                fill="#F7B928" 
              />
            </svg>
          </div>

          {/* Translucent Angled Capsule Pill Beams Across the Dark Field */}
          <div className="absolute top-24 left-1/4 h-80 w-24 -rotate-45 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-xs"></div>
          <div className="absolute top-44 left-1/3 h-96 w-28 -rotate-45 rounded-full bg-white/[0.03] border border-white/[0.05]"></div>
          <div className="absolute bottom-16 right-1/4 h-88 w-24 -rotate-45 rounded-full bg-white/[0.04] border border-white/[0.06]"></div>

          {/* Floating Geometric Accents (Exact matches to Landingpage.png) */}
          {/* Small Top-Left Triangle */}
          <div className="absolute top-28 left-24 sm:left-48 text-pitstop-yellow rotate-12">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 22,22 2,22" />
            </svg>
          </div>

          {/* Mid-Left Floating Yellow Circle */}
          <div className="absolute top-1/2 left-1/4 h-5 w-5 rounded-full bg-pitstop-yellow shadow-lg shadow-pitstop-yellow/50"></div>

          {/* Floating Mid-Right Yellow Ring */}
          <div className="absolute bottom-36 right-1/3 h-7 w-7 rounded-full border-[3px] border-pitstop-yellow"></div>

          {/* Bottom-Right Small Triangle */}
          <div className="absolute bottom-12 right-20 sm:right-36 text-pitstop-yellow -rotate-45">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 22,22 2,22" />
            </svg>
          </div>
        </div>

        {/* ── HERO TEXT & CONTENT (Center-Right Aligned exactly as Landingpage.png) ── */}
        <div className="relative mx-auto max-w-7xl w-full z-10 py-10">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Left Spacer to position headline prominently towards center/right */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-4"></div>

            {/* Right/Center Content Column */}
            <div className="lg:col-span-8 xl:col-span-8 lg:pl-8">
              
              {/* Subtle Tagline */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="h-0.5 w-6 bg-pitstop-yellow"></span>
                <span className="text-xs font-bold tracking-widest text-pitstop-yellow uppercase">
                  PitStop India
                </span>
              </div>

              {/* Huge Stylized Headline (Landingpage.png Style) */}
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08] uppercase">
                EVERY RIDER <br />
                <span className="text-pitstop-yellow font-black">
                  DESERVES A PLACE
                </span> <br />
                <span>TO STOP.</span>
              </h1>

              {/* Direct, Meaningful Paragraph (No fluff or watermarks) */}
              <p className="mt-6 max-w-xl text-base text-gray-300 sm:text-lg leading-relaxed font-normal">
                Connecting India&apos;s delivery riders and drivers with verified rest facilities, clean drinking water, fast phone charging, clean washrooms, and off-peak micro-jobs.
              </p>

              {/* Action Buttons */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/explore">
                  <button className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-pitstop-yellow px-8 py-4 text-sm font-extrabold text-pitstop-charcoal shadow-lg shadow-pitstop-yellow/20 transition-all hover:bg-pitstop-yellow-dark hover:scale-[1.02] active:scale-[0.98]">
                    <span>Find Nearby Rest Stops</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>

                <Link href="/for-merchants">
                  <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 active:scale-[0.98]">
                    <Store className="h-4 w-4 text-pitstop-yellow" />
                    <span>Become a Partner Merchant</span>
                  </button>
                </Link>
              </div>

              {/* 3 Quick Features Highlights */}
              <div className="mt-12 grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3 border-t border-white/10 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Free RO Water</div>
                    <div className="text-xs text-gray-400">Clean &amp; Cold</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Fast Charging</div>
                    <div className="text-xs text-gray-400">Phones &amp; EV Ports</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Paid Micro-Jobs</div>
                    <div className="text-xs text-gray-400">2 PM – 5 PM Tasks</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 2 — CORE SERVICES: 3 Elevated Dark Cards with Yellow Accents
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0E0F17] py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-0.5 w-6 bg-pitstop-yellow"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-pitstop-yellow">
                WHAT WE OFFER
              </span>
              <span className="h-0.5 w-6 bg-pitstop-yellow"></span>
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Essential PitStop Facilities
            </h2>
            
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
              Designed specifically for delivery riders and ride-hailing drivers navigating Indian roads every day.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Card 1: Verified Rest Stops */}
            <div className="group flex flex-col justify-between rounded-3xl bg-[#161724] p-8 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-pitstop-yellow/50 hover:shadow-xl hover:shadow-pitstop-yellow/5">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30 group-hover:bg-pitstop-yellow group-hover:text-pitstop-charcoal transition-colors">
                  <Droplet className="h-7 w-7" />
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-white">
                  Verified Rest Facilities
                </h3>
                
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Clean drinking water, hygienic washrooms, comfortable seating, and fast charging docks reserved exclusively for on-duty gig workers.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-300 group-hover:text-pitstop-yellow transition-colors">
                  Explore Stops
                </span>
                <Link 
                  href="/explore"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal shadow-sm transition-transform group-hover:scale-110"
                  aria-label="Explore rest stops"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Merchant Food Deals */}
            <div className="group flex flex-col justify-between rounded-3xl bg-[#161724] p-8 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-pitstop-yellow/50 hover:shadow-xl hover:shadow-pitstop-yellow/5">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30 group-hover:bg-pitstop-yellow group-hover:text-pitstop-charcoal transition-colors">
                  <Coffee className="h-7 w-7" />
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-white">
                  Partner Food &amp; Chai Deals
                </h3>
                
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Enjoy exclusive 50%+ discounts on hot chai, snacks, and wholesome meals at verified partner restaurants, cafes, and tea stalls on your route.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-300 group-hover:text-pitstop-yellow transition-colors">
                  View Deals
                </span>
                <Link 
                  href="/explore"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal shadow-sm transition-transform group-hover:scale-110"
                  aria-label="View food and chai deals"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Off-Peak Micro-Jobs */}
            <div className="group flex flex-col justify-between rounded-3xl bg-[#161724] p-8 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-pitstop-yellow/50 hover:shadow-xl hover:shadow-pitstop-yellow/5">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pitstop-yellow/15 text-pitstop-yellow border border-pitstop-yellow/30 group-hover:bg-pitstop-yellow group-hover:text-pitstop-charcoal transition-colors">
                  <Briefcase className="h-7 w-7" />
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-white">
                  Off-Peak Micro-Jobs
                </h3>
                
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Earn extra cash during quiet afternoon hours (2 PM – 5 PM) with short helper tasks like parcel sorting, packing, and local express deliveries.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-300 group-hover:text-pitstop-yellow transition-colors">
                  Browse Jobs
                </span>
                <Link 
                  href="/jobs"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal shadow-sm transition-transform group-hover:scale-110"
                  aria-label="Browse micro-jobs"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 3 — WHY CHOOSE PITSTOP: High-Contrast Checklist & Live Metrics
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#12131C] py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            
            {/* Left Column: Checklist */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="h-0.5 w-6 bg-pitstop-yellow"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-pitstop-yellow">
                  WHY CHOOSE PITSTOP
                </span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Solve Daily Road Fatigue <br />
                <span className="text-pitstop-yellow">Safely &amp; Dignified</span>
              </h2>

              <p className="mt-4 text-base text-gray-300 leading-relaxed">
                Delivery riders spend over 10 hours a day on intense traffic routes. PitStop gives you verified sanctuary stops to recharge your body, phone, and vehicle.
              </p>

              {/* Checklist */}
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    Zero-cost access to clean drinking water and clean restrooms
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    High-speed fast charging ports for smartphones &amp; power banks
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    Exclusive subsidized meals &amp; chai with no hidden conditions
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitstop-yellow text-pitstop-charcoal font-bold mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    100% verified merchant hosts who respect and welcome gig workers
                  </span>
                </div>
              </div>

              <div className="mt-10">
                <Link href="/rider/register">
                  <button className="group inline-flex items-center gap-3 rounded-full bg-pitstop-yellow px-8 py-4 text-sm font-extrabold text-pitstop-charcoal shadow-lg shadow-pitstop-yellow/20 transition-all hover:bg-pitstop-yellow-dark hover:scale-[1.02] active:scale-[0.98]">
                    <span>Join as a Rider Now</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: Platform Impact Stats Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-[#161724] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-pitstop-yellow/10 blur-2xl pointer-events-none"></div>

                <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitstop-yellow text-pitstop-charcoal font-black shadow-md">
                    <Navigation className="h-6 w-6 fill-pitstop-charcoal stroke-pitstop-charcoal" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white leading-none">PitStop Impact</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {stats.cities && stats.cities.length > 0 ? stats.cities.join(' • ') : 'Verified Stop Network'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-pitstop-yellow" />
                      <span className="text-sm font-semibold text-gray-300">Active Gig Riders</span>
                    </div>
                    <span className="text-xl font-black text-pitstop-yellow">
                      {formatStatCount(stats.activeRiders)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-pitstop-yellow" />
                      <span className="text-sm font-semibold text-gray-300">Verified Stop Hubs</span>
                    </div>
                    <span className="text-xl font-black text-white">
                      {formatStatCount(stats.verifiedStopHubs)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-gray-300">Amenity Rating</span>
                    </div>
                    <span className="text-xl font-black text-emerald-400">
                      {stats.amenityRating > 0 ? `${stats.amenityRating.toFixed(1)} / 5` : '4.9 / 5'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4 — MERCHANT PARTNER BANNER
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0E0F17] py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-[#161724] border border-white/10 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-pitstop-yellow">
                FOR RESTAURANTS, CAFES &amp; SHOPS
              </span>
              <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Become a Verified PitStop Partner Merchant
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-gray-400 leading-relaxed">
                Drive steady foot traffic during slow afternoon hours (2 PM – 5 PM) and access reliable delivery partners for short-term helper tasks.
              </p>
            </div>
            <Link href="/for-merchants" className="whitespace-nowrap">
              <button className="group inline-flex items-center gap-2 rounded-full bg-pitstop-yellow px-7 py-3.5 text-sm font-bold text-pitstop-charcoal shadow-md transition-all hover:bg-pitstop-yellow-dark active:scale-[0.98]">
                <span>Register Your Venue</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
