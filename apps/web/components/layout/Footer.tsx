'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { LanguageToggle } from '@/components/common/LanguageToggle';

export interface FooterProps {
  theme?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ theme = 'light' }) => {
  const { t, isHindi } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <footer
      className={`border-t transition-colors text-sm pb-24 md:pb-6 ${
        isDark
          ? 'border-white/10 bg-[#0B0B0F] text-gray-400'
          : 'border-pitstop-border bg-white text-pitstop-muted'
      }`}
      aria-label="Portal Footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          {/* Brand Col */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded-md w-fit"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-pitstop-yellow text-pitstop-charcoal font-bold shadow-subtle">
                <Navigation className="h-4 w-4 fill-pitstop-charcoal stroke-pitstop-charcoal" />
              </div>
              <span className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-pitstop-charcoal'}`}>
                PitStop
              </span>
            </Link>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-pitstop-muted'}`}>
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links / Platform */}
          <div className="col-span-1">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-pitstop-charcoal'
              }`}
            >
              {t('footer.platform')}
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs">
              <li>
                <Link
                  href="/explore"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.findRestStops')}
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.microJobs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.howItWorks')}
                </Link>
              </li>
              <li>
                <Link
                  href="/rider/profile"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.riderAccount')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchant Links */}
          <div className="col-span-1">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-pitstop-charcoal'
              }`}
            >
              {t('footer.merchants')}
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs">
              <li>
                <Link
                  href="/for-merchants"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.partnerOverview')}
                </Link>
              </li>
              <li>
                <Link
                  href="/merchant"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.merchantPortal')}
                </Link>
              </li>
              <li>
                <Link
                  href="/for-merchants"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.listFacility')}
                </Link>
              </li>
              <li>
                <Link
                  href="/merchant/jobs"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.postMicroJobs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="col-span-2 sm:col-span-1">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-pitstop-charcoal'
              }`}
            >
              {t('footer.legalSupport')}
            </h4>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 sm:block sm:space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.contactSupport')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-pitstop-charcoal'
                  }`}
                >
                  {t('footer.aboutMission')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright + Language Selector */}
        <div
          className={`mt-8 border-t pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${
            isDark ? 'border-white/10 text-gray-400' : 'border-pitstop-border text-pitstop-muted'
          }`}
        >
          <div>
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs">
              {t('footer.selectLanguage')}
            </span>
            <LanguageToggle size="sm" isDark={isDark} />
          </div>
        </div>
      </div>
    </footer>
  );
};
