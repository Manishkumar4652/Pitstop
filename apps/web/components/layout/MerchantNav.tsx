'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store, 
  MapPin, 
  Tag, 
  Briefcase, 
  ShieldAlert,
  User 
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserRole } from 'shared-types';

export interface MerchantNavProps {
  className?: string;
}

export const MerchantNav: React.FC<MerchantNavProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/merchant',
      icon: <Store className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/merchant' || pathname === '/merchant/dashboard',
    },
    {
      label: 'My Rest Stops',
      href: '/merchant/rest-stops',
      icon: <MapPin className="h-4 w-4" aria-hidden="true" />,
      active: pathname.startsWith('/merchant/rest-stops'),
    },
    {
      label: 'Rider Deals',
      href: '/merchant/deals',
      icon: <Tag className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/merchant/deals',
    },
    {
      label: 'Micro-Jobs',
      href: '/merchant/jobs',
      icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/merchant/jobs',
    },
  ];

  return (
    <>
      {/* Desktop Top Sub-Navigation Bar */}
      <nav 
        className={`border-b border-pitstop-border bg-white py-2.5 px-4 sm:px-6 lg:px-8 shadow-subtle ${className}`}
        aria-label="Merchant Portal Navigation"
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
            {isAuthenticated && user && user.role === UserRole.MERCHANT ? (
              <>
                <Badge variant="yellow" size="sm" icon={<Store className="h-3 w-3" />}>
                  {user.merchantProfile?.businessName || user.name}
                </Badge>
                <LogoutButton variant="ghost" size="sm" />
              </>
            ) : isAuthenticated && user ? (
              <>
                <Badge variant="warning" size="sm">
                  {user.name} ({user.role})
                </Badge>
                <LogoutButton variant="ghost" size="sm" />
              </>
            ) : (
              <Link href="/merchant/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pitstop-border px-2 py-1 shadow-elevation min-h-[56px] flex items-center justify-around"
        aria-label="Mobile Merchant Navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-md min-h-[48px] focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${
              item.active
                ? 'text-pitstop-charcoal font-bold'
                : 'text-pitstop-muted hover:text-pitstop-charcoal font-medium'
            }`}
          >
            <div className={`p-1 rounded-md ${item.active ? 'bg-pitstop-yellow-light text-pitstop-charcoal' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight text-center leading-none mt-0.5">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
};
