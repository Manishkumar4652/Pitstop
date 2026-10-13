import React from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-pitstop-border bg-white text-sm text-pitstop-muted">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pitstop-yellow text-pitstop-charcoal font-bold">
                <Navigation className="h-5 w-5 fill-pitstop-charcoal stroke-pitstop-charcoal" />
              </div>
              <span className="text-lg font-bold text-pitstop-charcoal">PitStop</span>
            </Link>
            <p className="text-xs text-pitstop-muted">
              &quot;Every rider deserves a place to stop.&quot;
            </p>
            <p className="text-xs text-pitstop-muted">
              Connecting delivery riders, ride drivers, and local merchants across India with verified rest stops, clean amenities, and off-peak micro-jobs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Platform</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-pitstop-charcoal transition-colors">
                  Find Rest Stops
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-pitstop-charcoal transition-colors">
                  Micro-Job Marketplace
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
              <li>
                <Link href="/admin" className="hover:text-pitstop-charcoal transition-colors">
                  Admin Portal (Demo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchant Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Merchants</h4>
            <ul className="mt-3 space-y-2 text-xs">
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
                  Post Off-Peak Jobs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pitstop-charcoal">Legal & Support</h4>
            <ul className="mt-3 space-y-2 text-xs">
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
                  About PitStop Mission
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-pitstop-border pt-6 text-center text-xs text-pitstop-muted">
          &copy; {new Date().getFullYear()} PitStop Platform. Built for India&apos;s gig workers and local merchants. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
