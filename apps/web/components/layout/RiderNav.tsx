'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  MapPin, 
  Briefcase, 
  User, 
  Bike
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { LogoutButton } from '@/components/auth/LogoutButton';

export interface RiderNavProps {
  className?: string;
}

export const RiderNav: React.FC<RiderNavProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t('nav.dashboard'),
      href: '/rider/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/rider' || pathname === '/rider/dashboard',
    },
    {
      label: t('nav.restStops'),
      href: '/explore',
      icon: <MapPin className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/explore' || pathname.startsWith('/rest-stops/'),
    },
    {
      label: t('nav.jobs'),
      href: '/jobs',
      icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/jobs',
    },
    {
      label: t('nav.profile'),
      href: '/rider/profile',
      icon: <User className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/rider/profile',
    },
  ];

  const mobileNavItems = navItems;

  return (
    <>
      {/* Desktop Top Sub-Navigation Bar */}
      <nav 
        className={`hidden md:block border-b border-pitstop-border bg-white py-2.5 px-4 sm:px-6 lg:px-8 shadow-subtle ${className}`}
        aria-label="Rider Portal Navigation"
      >
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${
                  item.active
                    ? 'bg-pitstop-yellow-light text-pitstop-charcoal border border-pitstop-yellow/40 shadow-subtle'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg border border-transparent'
                }`}
              >
                <span className={item.active ? 'text-pitstop-charcoal' : 'text-pitstop-muted'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Session Status / Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <>
                <Badge variant="yellow" size="sm" icon={<Bike className="h-3 w-3" />}>
                  {user.name}
                </Badge>
                <LogoutButton variant="ghost" size="sm" />
              </>
            ) : (
              <Link href="/rider/login">
                <Button variant="outline" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pitstop-border px-1 py-1 pb-[max(4px,env(safe-area-inset-bottom))] shadow-elevation flex items-center justify-around"
        aria-label="Mobile Rider Navigation"
      >
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-transform active:scale-95 focus:outline-none ${
              item.active
                ? 'text-pitstop-charcoal font-bold'
                : 'text-pitstop-muted hover:text-pitstop-charcoal font-medium'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${item.active ? 'bg-pitstop-yellow text-pitstop-charcoal shadow-xs' : 'text-pitstop-muted'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] tracking-tight text-center leading-tight mt-0.5 ${item.active ? 'font-bold text-pitstop-charcoal' : 'text-pitstop-muted'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
};
