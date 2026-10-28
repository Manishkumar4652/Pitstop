'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation, Menu, X, Store, User, Bike, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserRole } from 'shared-types';

export interface NavbarProps {
  theme?: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({ theme = 'light' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { t, isHindi } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${isDark
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
          <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-pitstop-charcoal'}`}>
            PitStop
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main Navigation">
          <Link
            href="/explore"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${isDark ? 'text-gray-300 hover:text-pitstop-yellow' : 'text-pitstop-charcoal hover:text-pitstop-yellow-dark'
              }`}
          >
            {t('nav.explore')}
          </Link>
          <Link
            href="/jobs"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${isDark ? 'text-gray-300 hover:text-pitstop-yellow' : 'text-pitstop-charcoal hover:text-pitstop-yellow-dark'
              }`}
          >
            {t('nav.jobs')}
          </Link>
          <Link
            href="/how-it-works"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-pitstop-muted hover:text-pitstop-charcoal'
              }`}
          >
            {t('nav.howItWorks')}
          </Link>
          <Link
            href="/for-merchants"
            className={`text-xs uppercase font-bold tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1.5 py-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-pitstop-muted hover:text-pitstop-charcoal'
              }`}
          >
            {t('nav.forMerchants')}
          </Link>
        </nav>

        {/* Desktop Right Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Language Switcher Pill */}
          <LanguageToggle isDark={isDark} />

          {isAuthenticated && user?.role === UserRole.MERCHANT ? (
            <div className="flex items-center gap-2">
              <Link href="/merchant">
                <Button variant="primary" size="sm" leftIcon={<Store className="h-4 w-4" />}>
                  {user.name.split(' ')[0]} ({t('nav.merchantPortal')})
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
                <button className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${isDark
                    ? 'border border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white'
                    : 'border border-pitstop-border bg-white text-pitstop-charcoal hover:bg-pitstop-bg'
                  }`}>
                  <Store className="h-3.5 w-3.5" />
                  <span>{t('nav.merchantPortal')}</span>
                </button>
              </Link>

              <Link href="/rider/login">
                <button className={`px-3 py-2 text-xs font-semibold transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-pitstop-charcoal hover:text-black'
                  }`}>
                  {t('nav.login')}
                </button>
              </Link>

              <Link href="/rider/register">
                <button className="inline-flex items-center gap-1.5 rounded-full bg-pitstop-yellow px-5 py-2 text-xs font-extrabold text-pitstop-charcoal shadow-md transition-all hover:bg-pitstop-yellow-dark active:scale-[0.98]">
                  <span>{t('nav.joinRider')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Actions (User / Hamburger) */}
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
                {t('nav.login')}
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-all active:scale-95 ${isDark
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
        <div className={`border-t px-4 pt-4 pb-8 md:hidden shadow-elevation animate-in slide-in-from-top-2 max-h-[calc(100vh-64px)] overflow-y-auto ${isDark ? 'border-white/10 bg-[#161726]' : 'border-pitstop-border bg-white'
          }`}>
          {/* Language Switcher inside Mobile Menu */}
          <div className={`mb-3 flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-pitstop-border bg-pitstop-bg'}`}>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-pitstop-charcoal'}`}>
              {isHindi ? 'भाषा चुनें:' : 'Language:'}
            </span>
            <LanguageToggle isDark={isDark} />
          </div>

          <nav className="flex flex-col gap-2.5" aria-label="Mobile Navigation">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isDark ? 'text-white hover:bg-white/5 active:bg-white/10' : 'text-pitstop-charcoal hover:bg-pitstop-bg active:bg-slate-100'
                }`}
            >
              📍 {t('nav.explore')}
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center min-h-[44px] rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isDark ? 'text-white hover:bg-white/5 active:bg-white/10' : 'text-pitstop-charcoal hover:bg-pitstop-bg active:bg-slate-100'
                }`}
            >
              💼 {t('nav.jobs')}
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal'
                }`}
            >
              💡 {t('nav.howItWorks')}
            </Link>
            <Link
              href="/for-merchants"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-pitstop-muted hover:bg-pitstop-bg hover:text-pitstop-charcoal'
                }`}
            >
              🏪 {t('nav.forMerchants')}
            </Link>

            <div className={`mt-3 flex flex-col gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-pitstop-border'}`}>
              <Link href={isAuthenticated && user?.role === UserRole.MERCHANT ? '/merchant' : '/merchant/login'} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth leftIcon={<Store className="h-4 w-4" />}>
                  {t('nav.merchantPortal')}
                </Button>
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={user.role === UserRole.MERCHANT ? '/merchant' : '/explore'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" fullWidth leftIcon={user.role === UserRole.MERCHANT ? <Store className="h-4 w-4" /> : <Bike className="h-4 w-4" />}>
                      {user.role === UserRole.MERCHANT ? `${t('nav.dashboard')} (${user.name.split(' ')[0]})` : `${t('nav.explore')} (${user.name.split(' ')[0]})`}
                    </Button>
                  </Link>
                  <LogoutButton fullWidth variant="outline" />
                </>
              ) : (
                <>
                  <Link href="/rider/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth leftIcon={<User className="h-4 w-4" />}>
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link href="/rider/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>
                      {t('nav.joinRider')}
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
