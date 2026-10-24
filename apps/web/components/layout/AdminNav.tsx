'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MapPin, 
  Store, 
  Briefcase, 
  Tag, 
  ShieldAlert 
} from 'lucide-react';
import { Badge } from '@/components/ui';

export interface AdminNavProps {
  className?: string;
}

export const AdminNav: React.FC<AdminNavProps> = ({ className = '' }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
      active: pathname === '/admin',
    },
    {
      label: 'Rest Stops',
      href: '/admin/rest-stops',
      icon: <MapPin className="h-4 w-4" aria-hidden="true" />,
      active: pathname.startsWith('/admin/rest-stops'),
    },
    {
      label: 'Merchants',
      href: '/admin/merchants',
      icon: <Store className="h-4 w-4" aria-hidden="true" />,
      active: pathname.startsWith('/admin/merchants'),
    },
    {
      label: 'Micro-Jobs',
      href: '/admin/jobs',
      icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
      active: pathname.startsWith('/admin/jobs'),
    },
    {
      label: 'Rider Deals',
      href: '/admin/deals',
      icon: <Tag className="h-4 w-4" aria-hidden="true" />,
      active: pathname.startsWith('/admin/deals'),
    },
  ];

  return (
    <>
      {/* Desktop Top Sub-Navigation Bar */}
      <nav 
        className={`hidden md:block border-b border-pitstop-border bg-white py-2.5 px-4 sm:px-6 lg:px-8 shadow-subtle ${className}`}
        aria-label="Admin Portal Navigation"
      >
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-pitstop-yellow ${
                  item.active
                    ? 'bg-pitstop-charcoal text-white shadow-subtle'
                    : 'text-pitstop-muted hover:text-pitstop-charcoal hover:bg-pitstop-bg border border-transparent'
                }`}
              >
                <span className={item.active ? 'text-pitstop-yellow' : 'text-pitstop-muted'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Demo Mode Notice Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="warning" size="sm" icon={<ShieldAlert className="h-3 w-3" />}>
              Admin Portal Preview (Demo)
            </Badge>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pitstop-border px-1 py-1 pb-[max(4px,env(safe-area-inset-bottom))] shadow-elevation flex items-center justify-around"
        aria-label="Mobile Admin Navigation"
      >
        {navItems.map((item) => (
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
