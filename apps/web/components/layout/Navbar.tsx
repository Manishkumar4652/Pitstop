'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation, Menu, X, Store, User, Bike, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/auth/AuthContext';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserRole } from 'shared-types';

export interface NavbarProps {
  theme?: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({ theme = 'light' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
      isDark 
        ? 'border-white/10 bg-[#12131C]/90 text-white' 
        : 'border-pitstop-border bg-white/95 text-pitstop-charcoal'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo (Preserved exact PitStop icon and text) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded-md p-1"
          aria-label="PitStop Homepage"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitstop-yellow text-pitstop-charcoal font-bold shadow-subtle">
            <Navigation className="h-6 w-6 fill-pitstop-charcoal stroke-pitstop-charcoal" />
          </div>
          <div className="flex flex-col">
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-pitstop-charcoal'}`}>
              PitStop
            </span>
            <span className={`hidden text-xs font-medium sm:inline-block ${isDark ? 'text-gray-400' : 'text-pitstop-muted'}`}>
              For Delivery &amp; Ride Gig Workers
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main Navigation">
          <Link
            href="/explore"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${
              isDark ? 'text-gray-300 hover:text-pitstop-yellow' : 'text-pitstop-charcoal hover:text-pitstop-yellow-dark'
            }`}
          >
            Explore Rest Stops
          </Link>
          <Link
            href="/jobs"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${
              isDark ? 'text-gray-300 hover:text-pitstop-yellow' : 'text-pitstop-charcoal hover:text-pitstop-yellow-dark'
            }`}
          >
            Micro-Jobs
          </Link>
          <Link
            href="/how-it-works"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-pitstop-muted hover:text-pitstop-charcoal'
            }`}
          >
            How It Works
          </Link>
          <Link
            href="/for-merchants"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-pitstop-muted hover:text-pitstop-charcoal'
            }`}
          >
            For Merchants
          </Link>
        </nav>

        {/* Desktop Right Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user?.role === UserRole.MERCHANT ? (
            <div className="flex items-center gap-2">
              <Link href="/merchant">
                <Button variant="primary" size="sm" leftIcon={<Store className="h-4 w-4" />}>
                  {user.name.split(' ')[0]} (Merchant)
                </Button>
              </Link>
              <LogoutButton variant="ghost" size="sm" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href="/explore">
                <Button variant="primary" size="sm" leftIcon={<Bike className="h-4 w-4" />}>
                  {user.name.split(' ')[0]}
                </Button>
              </Link>
              <LogoutButton variant="ghost" size="sm" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/merchant/login">
                <button className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isDark 
                    ? 'border border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white' 
                    : 'border border-pitstop-border bg-white text-pitstop-charcoal hover:bg-pitstop-bg'
                }`}>
                  <Store className="h-3.5 w-3.5" />
                  <span>Merchant Portal</span>
                </button>
              </Link>

              <Link href="/rider/login">
                <button className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-pitstop-charcoal hover:text-black'
                }`}>
                  Log In
                </button>
              </Link>

              <Link href="/rider/register">
                <button className="inline-flex items-center gap-1.5 rounded-full bg-pitstop-yellow px-5 py-2 text-xs font-extrabold text-pitstop-charcoal shadow-md transition-all hover:bg-pitstop-yellow-dark active:scale-[0.98]">
                  <span>Join as Rider</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && user ? (
            <Link href={user.role === UserRole.MERCHANT ? '/merchant' : '/explore'}>
              <Button variant="primary" size="sm">
                {user.name.split(' ')[0]}
              </Button>
            </Link>
          ) : (
            <Link href="/rider/login">
              <Button variant="primary" size="sm">
                Log In
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-colors ${
              isDark 
                ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' 
                : 'border-pitstop-border bg-white text-pitstop-charcoal hover:bg-pitstop-bg'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Collapsible Menu */}
      {mobileMenuOpen && (
        <div className={`border-t px-4 pt-3 pb-6 md:hidden shadow-elevation animate-in slide-in-from-top-2 ${
          isDark ? 'border-white/10 bg-[#161726]' : 'border-pitstop-border bg-white'
        }`}>
          <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                isDark ? 'text-white hover:bg-white/5' : 'text-pitstop-charcoal hover:bg-pitstop-bg'
              }`}
            >
              📍 Explore Rest Stops
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                isDark ? 'text-white hover:bg-white/5' : 'text-pitstop-charcoal hover:bg-pitstop-bg'
              }`}
            >
              💼 Micro-Jobs Board
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal'
              }`}
            >
              💡 How It Works
            </Link>
            <Link
              href="/for-merchants"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal'
              }`}
            >
              🏪 Merchant Partner Info
            </Link>

            <div className={`mt-3 flex flex-col gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-pitstop-border'}`}>
              <Link href={isAuthenticated && user?.role === UserRole.MERCHANT ? '/merchant' : '/merchant/login'} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth leftIcon={<Store className="h-4 w-4" />}>
                  Merchant Portal
                </Button>
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={user.role === UserRole.MERCHANT ? '/merchant' : '/explore'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" fullWidth leftIcon={user.role === UserRole.MERCHANT ? <Store className="h-4 w-4" /> : <Bike className="h-4 w-4" />}>
                      {user.role === UserRole.MERCHANT ? `Dashboard (${user.name.split(' ')[0]})` : `Explore Stops (${user.name.split(' ')[0]})`}
                    </Button>
                  </Link>
                  <LogoutButton fullWidth variant="outline" />
                </>
              ) : (
                <>
                  <Link href="/rider/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth leftIcon={<User className="h-4 w-4" />}>
                      Rider Log In
                    </Button>
                  </Link>
                  <Link href="/rider/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Create Rider Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
