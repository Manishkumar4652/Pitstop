import React from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-pitstop-border bg-white text-sm text-pitstop-muted pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          {/* Brand Col */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-pitstop-yellow text-pitstop-charcoal font-bold">
                <Navigation className="h-4 w-4 fill-pitstop-charcoal stroke-pitstop-charcoal" />
              </div>
              <span className="text-base sm:text-lg font-bold text-pitstop-charcoal">PitStop</span>
            </Link>
            <p className="text-xs text-pitstop-muted">
              Connecting delivery riders, ride drivers, and local merchants across India with verified rest stops, clean amenities, and micro-jobs.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Platform</h4>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              <li>
                <Link href="/explore" className="hover:text-pitstop-charcoal transition-colors">
                  Find Rest Stops
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-pitstop-charcoal transition-colors">
                  Micro-Jobs
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-pitstop-charcoal transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/rider/profile" className="hover:text-pitstop-charcoal transition-colors">
                  Rider Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchant Links */}
          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Merchants</h4>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              <li>
                <Link href="/for-merchants" className="hover:text-pitstop-charcoal transition-colors">
                  Partner Overview
                </Link>
              </li>
              <li>
                <Link href="/merchant/dashboard" className="hover:text-pitstop-charcoal transition-colors">
                  Merchant Portal
                </Link>
              </li>
              <li>
                <Link href="/for-merchants" className="hover:text-pitstop-charcoal transition-colors">
                  List Your Facility
                </Link>
              </li>
              <li>
                <Link href="/for-merchants" className="hover:text-pitstop-charcoal transition-colors">
                  Post Micro-Jobs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Legal & Support</h4>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 sm:block sm:space-y-1.5 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-pitstop-charcoal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-pitstop-charcoal transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-pitstop-charcoal transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-pitstop-charcoal transition-colors">
                  About Mission
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-pitstop-border pt-4 text-center text-[11px] text-pitstop-muted">
          &copy; {new Date().getFullYear()} PitStop Platform. Built for India&apos;s gig workers and local merchants.
        </div>
      </div>
    </footer>
  );
};
