'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation, Menu, X, Store, User } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-pitstop-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded-md p-1"
          aria-label="PitStop Homepage"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal font-bold shadow-subtle">
            <Navigation className="h-6 w-6 fill-pitstop-charcoal stroke-pitstop-charcoal" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-pitstop-charcoal">PitStop</span>
            <span className="hidden text-[10px] font-medium text-pitstop-muted sm:inline-block">
              For Delivery & Ride Gig Workers
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main Navigation">
          <Link
            href="/explore"
            className="text-sm font-medium text-pitstop-charcoal hover:text-pitstop-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1"
          >
            Explore Rest Stops
          </Link>
          <Link
            href="/jobs"
            className="text-sm font-medium text-pitstop-charcoal hover:text-pitstop-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1"
          >
            Micro-Jobs
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-pitstop-muted hover:text-pitstop-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1"
          >
            How It Works
          </Link>
          <Link
            href="/for-merchants"
            className="text-sm font-medium text-pitstop-muted hover:text-pitstop-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1"
          >
            For Merchants
          </Link>
        </nav>

        {/* Desktop Right Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/for-merchants">
            <Button variant="outline" size="sm" leftIcon={<Store className="h-4 w-4" />}>
              Merchant Partner
            </Button>
          </Link>
          <Link href="/rider/dashboard">
            <Button variant="primary" size="sm" leftIcon={<User className="h-4 w-4" />}>
              Rider Portal
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/rider/dashboard">
            <Button variant="primary" size="sm" className="min-h-[40px] px-3 text-xs">
              Portal
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-pitstop-border bg-white text-pitstop-charcoal hover:bg-pitstop-bg focus:outline-none focus:ring-2 focus:ring-pitstop-yellow"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-pitstop-border bg-white px-4 pt-3 pb-6 md:hidden shadow-elevation animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-pitstop-charcoal hover:bg-pitstop-bg"
            >
              📍 Explore Rest Stops
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-pitstop-charcoal hover:bg-pitstop-bg"
            >
              💼 Micro-Jobs Board
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal"
            >
              💡 How It Works
            </Link>
            <Link
              href="/for-merchants"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal"
            >
              🏪 Merchant Partner Info
            </Link>

            <div className="mt-3 flex flex-col gap-2 border-t border-pitstop-border pt-4">
              <Link href="/for-merchants" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth leftIcon={<Store className="h-4 w-4" />}>
                  Merchant Registration
                </Button>
              </Link>
              <Link href="/rider/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth leftIcon={<User className="h-4 w-4" />}>
                  Rider Login / Dashboard
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
