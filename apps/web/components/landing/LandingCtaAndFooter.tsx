'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, ArrowRight } from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';

export const LandingCtaAndFooter: React.FC = () => {
  const [ctaRef, isCtaRevealed] = useScrollReveal();
  const [footerRef, isFooterRevealed] = useScrollReveal(0.05);

  return (
    <div className="bg-[#0B0B0F] text-white pt-10 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ── 5. FINAL DARK CTA BAND (fade + scale 0.97 to 1) ── */}
        <div
          ref={ctaRef}
          style={{
            transitionDuration: '550ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#14141B] p-6 sm:p-10 lg:p-12 text-center max-w-5xl mx-auto mb-10 sm:mb-16 transition-all ${
            isCtaRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-full max-w-lg rounded-full bg-[#FBBF24]/10 blur-3xl animate-hero-glow"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-[#FBBF24] mb-3 sm:mb-4">
              <span>BENGALURU NETWORK PILOT</span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight max-w-2xl mx-auto">
              Delivery riders keep India moving. Give them a place to stop.
            </h2>

            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
              Open directly on any smartphone. Locate free drinking water, fast phone charging, and clean washrooms in seconds.
            </p>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <Link href="/explore" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto min-h-[46px] sm:min-h-[50px] group inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#FBBF24] px-6 sm:px-8 py-3 text-sm sm:text-base font-extrabold text-[#0B0B0F] shadow-lg shadow-[#FBBF24]/10 transition-all duration-200 hover:bg-amber-400 active:scale-[0.97]">
                  <Navigation className="h-4 w-4 fill-[#0B0B0F] stroke-[#0B0B0F] transition-transform duration-200 group-hover:-rotate-12" />
                  <span>Find Nearby Rest Stops</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

        </div>

        {/* ── SLEEK, COMPACT FOOTER (Responsive & perfectly aligned) ── */}
        <footer
          ref={footerRef}
          style={{
            transitionDuration: '450ms',
            transitionTimingFunction: 'ease-out',
          }}
          className={`pt-6 sm:pt-8 border-t border-white/10 text-gray-400 text-xs sm:text-sm transition-opacity ${
            isFooterRevealed ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 pb-6 sm:pb-8">
            
            {/* Brand Column: Full width on mobile, 4 columns on desktop */}
            <div className="md:col-span-4 lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBBF24] text-[#0B0B0F] font-black">
                  <Navigation className="h-4 w-4 fill-[#0B0B0F] stroke-[#0B0B0F]" />
                </div>
                <span className="text-base sm:text-lg font-black text-white">PitStop</span>
              </Link>

              <p className="mt-2 sm:mt-2.5 max-w-sm text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                India&apos;s dedicated sanctuary network connecting gig delivery riders with verified rest stops, clean water, charging, and afternoon micro-jobs.
              </p>
            </div>

            {/* Links Columns: 3 equal compact columns on mobile, 8 columns on desktop */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:col-span-8 md:grid-cols-8 md:gap-6 items-start">
              
              {/* Platform Links (3 cols on desktop) */}
              <div className="md:col-span-3">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mb-2 sm:mb-3">
                  Platform
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                  <li>
                    <Link href="/explore" className="hover:text-white transition-colors">
                      Find Rest Stops
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs" className="hover:text-white transition-colors">
                      Micro-Jobs
                    </Link>
                  </li>
                  <li>
                    <a href="#how-it-works" className="hover:text-white transition-colors">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#riders" className="hover:text-white transition-colors">
                      Rider Benefits
                    </a>
                  </li>
                </ul>
              </div>

              {/* Merchant Links (2 cols on desktop) */}
              <div className="md:col-span-2">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mb-2 sm:mb-3">
                  Merchants
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                  <li>
                    <Link href="/for-merchants" className="hover:text-white transition-colors">
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link href="/merchant/dashboard" className="hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/for-merchants" className="hover:text-white transition-colors">
                      Host Venue
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal & Support Links (3 cols on desktop) */}
              <div className="md:col-span-3">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mb-2 sm:mb-3">
                  Legal &amp; Support
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                  <li>
                    <Link href="/privacy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-white transition-colors">
                      About PitStop
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Copyright & Location Bar: Balanced and aligned */}
          <div className="pt-4 sm:pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs text-gray-500 text-center sm:text-left">
            <div>© 2026 PitStop. Built for India&apos;s road heroes.</div>
            <div className="text-gray-500">Bengaluru Pilot Active • Koramangala &amp; HSR</div>
          </div>
        </footer>

      </div>
    </div>
  );
};
